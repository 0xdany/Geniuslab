import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assessmentQuestions, assessmentTokens, assessments, candidates, emailMessages } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-access";
import { appUrl } from "@/lib/env";
import { sendCompletionEmail, sendInvitationEmail } from "@/lib/email/resend";
import { badRequest } from "@/lib/permissions";
import { randomToken, sha256 } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const [message] = await db.select().from(emailMessages).where(eq(emailMessages.id, String(body.emailMessageId || ""))).limit(1);
  if (!message || !message.assessmentId) return badRequest("NOT_FOUND", "Email message was not found.", 404);
  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, message.assessmentId)).limit(1);
  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, assessment.candidateId)).limit(1);
  if (message.kind === "completion") {
    await sendCompletionEmail({ assessmentId: assessment.id, to: candidate.email, candidateName: candidate.name, title: assessment.title });
  } else {
    const rawToken = randomToken(32);
    await db
      .insert(assessmentTokens)
      .values({
        assessmentId: assessment.id,
        tokenHash: sha256(`assessment-token:${rawToken}`),
        expiresAt: assessment.expiresAt,
      });
    const questions = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.assessmentId, assessment.id));
    await sendInvitationEmail({
      assessmentId: assessment.id,
      to: candidate.email,
      candidateName: candidate.name,
      title: assessment.title,
      link: `${appUrl()}/assess/${rawToken}`,
      questionCount: questions.length,
      expiresAt: assessment.expiresAt,
    });
  }
  await db.update(emailMessages).set({ retryCount: message.retryCount + 1, updatedAt: new Date() }).where(eq(emailMessages.id, message.id));
  return NextResponse.json({ success: true });
}
