import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assessmentQuestions, assessments, questionAttempts, questionResponses } from "@/db/schema";
import { getCandidateSession } from "@/lib/candidate-session";
import { badRequest, unauthorized } from "@/lib/permissions";
import { logCandidateEvent } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const session = await getCandidateSession();
  if (!session) return unauthorized("Candidate session is required.");
  if (["completed", "reviewed", "expired"].includes(session.assessment.status)) {
    return badRequest("ASSESSMENT_LOCKED", "This assessment cannot be changed.", 409);
  }
  const body = await request.json().catch(() => ({}));
  const requestedNumber = Number(body.questionNumber || 0);
  const questions = await db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, session.assessment.id))
    .orderBy(asc(assessmentQuestions.questionNumber));
  const locked = await db.select().from(questionResponses).where(eq(questionResponses.assessmentId, session.assessment.id));
  const next = questions.find((question) => !locked.some((response) => response.questionId === question.id));
  if (!next || next.questionNumber !== requestedNumber) {
    return badRequest("INVALID_SEQUENCE", "Questions must be completed one at a time.", 409);
  }

  const [attemptCount] = await db
    .select({ value: count() })
    .from(questionAttempts)
    .where(and(eq(questionAttempts.assessmentId, session.assessment.id), eq(questionAttempts.questionId, next.id)));
  if ((attemptCount?.value ?? 0) >= next.maxAttempts) {
    return badRequest("ATTEMPTS_EXHAUSTED", "No attempts remain for this question.", 409);
  }

  const [attempt] = await db
    .insert(questionAttempts)
    .values({
      assessmentId: session.assessment.id,
      questionId: next.id,
      attemptNumber: (attemptCount?.value ?? 0) + 1,
      status: "recording",
    })
    .returning();

  if (session.assessment.status === "invited") {
    await db.update(assessments).set({ status: "in_progress", openedAt: new Date(), updatedAt: new Date() }).where(eq(assessments.id, session.assessment.id));
  }
  await logCandidateEvent(session.assessment.id, "question_started", { questionNumber: next.questionNumber, attemptId: attempt.id });

  return NextResponse.json({
    success: true,
    question: {
      id: next.id,
      questionNumber: next.questionNumber,
      text: next.text,
      maxDurationSeconds: next.maxDurationSeconds,
      maxAttempts: next.maxAttempts,
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
    },
  });
}
