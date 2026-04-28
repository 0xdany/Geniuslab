import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { questionAttempts, questionResponses, videoObjects } from "@/db/schema";
import { getCandidateSession } from "@/lib/candidate-session";
import { badRequest, unauthorized } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  const session = await getCandidateSession();
  if (!session) return unauthorized("Candidate session is required.");
  const body = await request.json().catch(() => ({}));
  const attemptId = String(body.attemptId || "");

  const [attempt] = await db.select().from(questionAttempts).where(eq(questionAttempts.id, attemptId)).limit(1);
  if (!attempt || attempt.assessmentId !== session.assessment.id || attempt.status !== "finalized") {
    return badRequest("INVALID_ATTEMPT", "Choose a saved recording before continuing.", 409);
  }

  const [video] = await db.select().from(videoObjects).where(eq(videoObjects.attemptId, attempt.id)).limit(1);
  if (!video) return badRequest("VIDEO_NOT_READY", "This recording is still being saved.", 409);

  const [existing] = await db
    .select()
    .from(questionResponses)
    .where(and(eq(questionResponses.assessmentId, attempt.assessmentId), eq(questionResponses.questionId, attempt.questionId)))
    .limit(1);
  if (existing) return NextResponse.json({ success: true, responseId: existing.id });

  const [response] = await db
    .insert(questionResponses)
    .values({
      assessmentId: attempt.assessmentId,
      questionId: attempt.questionId,
      finalizedAttemptId: attempt.id,
      lockedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ success: true, responseId: response.id });
}
