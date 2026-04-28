import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { questionAttempts, uploadSessions, videoObjects } from "@/db/schema";
import { verifyGcsObject } from "@/lib/storage/gcs";

export async function finalizeGcsObject(params: {
  uploadSessionId: string;
  attemptId: string;
  durationSeconds?: number;
}) {
  const [upload] = await db.select().from(uploadSessions).where(eq(uploadSessions.id, params.uploadSessionId)).limit(1);
  if (!upload || upload.attemptId !== params.attemptId) {
    throw new Error("Upload session was not found for this attempt.");
  }

  const object = await verifyGcsObject(upload.gcsObjectName);
  if (!object || object.sizeBytes <= 0) {
    throw new Error("Uploaded video object was not found or is empty.");
  }

  const [attempt] = await db.select().from(questionAttempts).where(eq(questionAttempts.id, params.attemptId)).limit(1);
  if (!attempt) throw new Error("Attempt was not found.");

  const [video] = await db
    .insert(videoObjects)
    .values({
      assessmentId: attempt.assessmentId,
      questionId: attempt.questionId,
      attemptId: attempt.id,
      gcsObjectName: upload.gcsObjectName,
      mimeType: attempt.mimeType || object.contentType,
      fileExtension: attempt.fileExtension || "webm",
      sizeBytes: object.sizeBytes,
      durationSeconds: params.durationSeconds,
      browserName: attempt.browserName,
      browserVersion: attempt.browserVersion,
      finalizedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  await db.update(uploadSessions).set({ status: "finalized", finalizedAt: new Date() }).where(eq(uploadSessions.id, upload.id));
  await db
    .update(questionAttempts)
    .set({ status: "finalized", stoppedAt: new Date(), durationSeconds: params.durationSeconds })
    .where(eq(questionAttempts.id, attempt.id));

  return video;
}
