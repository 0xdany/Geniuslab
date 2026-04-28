import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { assessmentQuestions, assessments, assessmentTokens, candidates } from "@/db/schema";
import { addDays } from "@/lib/ids";
import { randomToken, sha256, stableJsonHash } from "@/lib/crypto";
import { appUrl } from "@/lib/env";
import { getAppSettings } from "@/lib/settings";
import { sendInvitationEmail } from "@/lib/email/resend";

export type AssessmentQuestionInput = {
  text: string;
  maxDurationSeconds?: number | null;
  maxAttempts?: number;
};

export async function createAssessment(input: {
  candidate: {
    externalId: string;
    name: string;
    email: string;
    phone?: string | null;
    resumeUrl?: string | null;
  };
  assessment: {
    title: string;
    description?: string | null;
    questions: AssessmentQuestionInput[];
  };
  source: {
    type: "manual" | "api";
    apiKeyId?: string;
    event?: string;
    payload?: unknown;
    createdByUserId?: string;
  };
}) {
  const settings = await getAppSettings();
  const duplicateSince = new Date(Date.now() - settings.duplicateWindowMinutes * 60_000);
  const existing = await db
    .select({ id: assessments.id })
    .from(assessments)
    .innerJoin(candidates, eq(candidates.id, assessments.candidateId))
    .where(
      and(
        eq(candidates.email, input.candidate.email),
        eq(assessments.title, input.assessment.title),
        gte(assessments.createdAt, duplicateSince),
      ),
    )
    .orderBy(desc(assessments.createdAt))
    .limit(1);

  if (existing[0]) {
    throw new Error("An assessment for this candidate and title was recently created.");
  }

  const expiresAt = addDays(new Date(), settings.linkExpirationDays);
  const rawToken = randomToken(32);
  const tokenHash = sha256(`assessment-token:${rawToken}`);

  const [candidate] = await db
    .insert(candidates)
    .values({
      externalId: input.candidate.externalId,
      name: input.candidate.name,
      email: input.candidate.email,
      phone: input.candidate.phone || null,
      resumeUrl: input.candidate.resumeUrl || null,
    })
    .returning();

  const [assessment] = await db
    .insert(assessments)
    .values({
      candidateId: candidate.id,
      title: input.assessment.title,
      description: input.assessment.description || null,
      sourceType: input.source.type,
      sourceApiKeyId: input.source.apiKeyId,
      sourceEvent: input.source.event,
      sourceCandidateId: input.candidate.externalId,
      sourcePayloadHash: input.source.payload ? stableJsonHash(input.source.payload) : undefined,
      sourcePayloadSnapshotJson: input.source.payload as Record<string, unknown> | undefined,
      expiresAt,
      createdByUserId: input.source.createdByUserId,
    })
    .returning();

  await db.insert(assessmentQuestions).values(
    input.assessment.questions.map((question, index) => ({
      assessmentId: assessment.id,
      questionNumber: index + 1,
      text: question.text,
      maxDurationSeconds: question.maxDurationSeconds ?? null,
      maxAttempts: question.maxAttempts ?? 1,
    })),
  );

  await db.insert(assessmentTokens).values({ assessmentId: assessment.id, tokenHash, expiresAt });

  const assessmentLink = `${appUrl()}/assess/${rawToken}`;
  await sendInvitationEmail({
    assessmentId: assessment.id,
    to: candidate.email,
    candidateName: candidate.name,
    title: assessment.title,
    link: assessmentLink,
    questionCount: input.assessment.questions.length,
    expiresAt,
  });

  return { assessment, candidate, assessmentLink };
}
