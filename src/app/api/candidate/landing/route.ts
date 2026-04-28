import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assessmentQuestions, candidates, questionResponses } from "@/db/schema";
import { getCandidateSession } from "@/lib/candidate-session";
import { badRequest, unauthorized } from "@/lib/permissions";
import { expireAssessmentIfNeeded } from "@/lib/status";

export async function GET() {
  const session = await getCandidateSession();
  if (!session) return unauthorized("Candidate session is required.");
  const assessment = await expireAssessmentIfNeeded(session.assessment.id);
  if (!assessment || assessment.status === "expired") return badRequest("EXPIRED", "This assessment link has expired.", 410);
  if (["completed", "reviewed"].includes(assessment.status)) return badRequest("ALREADY_SUBMITTED", "This assessment has already been submitted.", 409);
  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, assessment.candidateId)).limit(1);
  const questions = await db
    .select({
      questionNumber: assessmentQuestions.questionNumber,
      maxDurationSeconds: assessmentQuestions.maxDurationSeconds,
      maxAttempts: assessmentQuestions.maxAttempts,
    })
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, assessment.id));
  const responses = await db.select().from(questionResponses).where(eq(questionResponses.assessmentId, assessment.id));

  return NextResponse.json({
    success: true,
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      candidateName: candidate?.name,
      status: assessment.status,
      expiresAt: assessment.expiresAt.toISOString(),
      questionCount: questions.length,
      completedCount: responses.length,
      questions: questions.map((q) => ({
        questionNumber: q.questionNumber,
        maxDurationSeconds: q.maxDurationSeconds,
        maxAttempts: q.maxAttempts,
      })),
    },
  });
}
