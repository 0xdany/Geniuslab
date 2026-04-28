import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assessmentQuestions, assessments, candidates, questionResponses } from "@/db/schema";
import { clearCandidateSession, getCandidateSession } from "@/lib/candidate-session";
import { sendCompletionEmail } from "@/lib/email/resend";
import { badRequest, unauthorized } from "@/lib/permissions";

export async function POST() {
  const session = await getCandidateSession();
  if (!session) return unauthorized("Candidate session is required.");
  const questions = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.assessmentId, session.assessment.id));
  const responses = await db.select().from(questionResponses).where(eq(questionResponses.assessmentId, session.assessment.id));
  if (responses.length < questions.length) {
    return badRequest("INCOMPLETE", "All questions must be recorded before submitting.", 409);
  }
  const [assessment] = await db
    .update(assessments)
    .set({ status: "completed", submittedAt: new Date(), updatedAt: new Date() })
    .where(eq(assessments.id, session.assessment.id))
    .returning();
  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, assessment.candidateId)).limit(1);
  await sendCompletionEmail({ assessmentId: assessment.id, to: candidate.email, candidateName: candidate.name, title: assessment.title });
  await clearCandidateSession();
  return NextResponse.json({ success: true });
}
