import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assessmentQuestions, questionAttempts, uploadSessions } from "@/db/schema";
import { getCandidateSession } from "@/lib/candidate-session";
import { sha256 } from "@/lib/crypto";
import { extensionForMimeType } from "@/lib/media/mime-types";
import { badRequest, unauthorized } from "@/lib/permissions";
import { createResumableUploadSession } from "@/lib/storage/gcs";

export async function POST(request: NextRequest) {
  const session = await getCandidateSession();
  if (!session) return unauthorized("Candidate session is required.");
  const body = await request.json().catch(() => ({}));
  const attemptId = String(body.attemptId || "");
  const mimeType = String(body.mimeType || "video/webm");
  const extension = String(body.fileExtension || extensionForMimeType(mimeType));

  const [attempt] = await db.select().from(questionAttempts).where(eq(questionAttempts.id, attemptId)).limit(1);
  if (!attempt || attempt.assessmentId !== session.assessment.id || !["recording", "upload_pending", "failed"].includes(attempt.status)) {
    return badRequest("INVALID_ATTEMPT", "Upload session can only be created for a pending recording.", 409);
  }
  const [question] = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.id, attempt.questionId)).limit(1);
  const objectName = `assessments/${attempt.assessmentId}/questions/${question?.questionNumber ?? 0}/attempts/${attempt.id}/recording.${extension}`;
  const sessionUri = await createResumableUploadSession(objectName, mimeType, {
    assessmentId: attempt.assessmentId,
    questionId: attempt.questionId,
    attemptId: attempt.id,
  });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [record] = await db
    .insert(uploadSessions)
    .values({
      attemptId: attempt.id,
      gcsObjectName: objectName,
      sessionUriHash: sha256(`gcs-session:${sessionUri}`),
      status: "created",
      expiresAt,
    })
    .returning();
  await db
    .update(questionAttempts)
    .set({
      status: "upload_pending",
      mimeType,
      fileExtension: extension,
      browserName: body.browserName,
      browserVersion: body.browserVersion,
    })
    .where(eq(questionAttempts.id, attempt.id));

  return NextResponse.json({ success: true, uploadSessionId: record.id, uploadUrl: sessionUri, objectName, expiresAt });
}
