import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { questionResponses } from "@/db/schema";
import { getCandidateSession } from "@/lib/candidate-session";
import { finalizeGcsObject } from "@/lib/upload/finalize-gcs-object";
import { badRequest, unauthorized } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  const session = await getCandidateSession();
  if (!session) return unauthorized("Candidate session is required.");
  const body = await request.json().catch(() => ({}));
  const attemptId = String(body.attemptId || "");
  const uploadSessionId = String(body.uploadSessionId || "");
  try {
    const video = await finalizeGcsObject({
      attemptId,
      uploadSessionId,
      durationSeconds: Number(body.durationSeconds || 0) || undefined,
    });
    if (!video) throw new Error("Video was already finalized or could not be finalized.");
    const [response] = await db
      .insert(questionResponses)
      .values({
        assessmentId: session.assessment.id,
        questionId: video.questionId,
        finalizedAttemptId: attemptId,
        lockedAt: new Date(),
      })
      .returning();
    return NextResponse.json({ success: true, responseId: response.id });
  } catch (error) {
    return badRequest("FINALIZE_FAILED", error instanceof Error ? error.message : "Could not finalize upload.", 422);
  }
}
