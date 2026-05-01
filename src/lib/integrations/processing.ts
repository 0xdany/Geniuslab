import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  assessmentQuestions,
  assessments,
  processedVideoAssets,
  questionResponses,
  videoObjects,
  videoProcessingJobs,
} from "@/db/schema";
import { processedVideoPrefix } from "@/lib/env";

export type ProcessingSummary = {
  totalVideos: number;
  ready: number;
  queued: number;
  processing: number;
  failed: number;
  missing: number;
  status: "not_ready" | "queued" | "processing" | "ready" | "failed";
};

export async function ensureProcessingJobsForAssessment(assessmentId: string) {
  const videos = await getFinalizedVideosForAssessment(assessmentId);
  if (videos.length === 0) {
    throw new Error("This assessment has no finalized videos to process.");
  }

  const created = [];
  for (const video of videos) {
    const [job] = await db
      .insert(videoProcessingJobs)
      .values({
        assessmentId,
        videoObjectId: video.videoObjectId,
        status: "queued",
      })
      .onConflictDoNothing()
      .returning();
    if (job) created.push(job);
  }
  return { totalVideos: videos.length, createdJobs: created.length };
}

export async function getProcessingSummary(assessmentId: string): Promise<ProcessingSummary> {
  const [{ totalVideos }] = await db
    .select({ totalVideos: count() })
    .from(questionResponses)
    .innerJoin(videoObjects, eq(videoObjects.attemptId, questionResponses.finalizedAttemptId))
    .where(eq(questionResponses.assessmentId, assessmentId));

  const jobs = await db
    .select({ status: videoProcessingJobs.status, total: count() })
    .from(videoProcessingJobs)
    .where(eq(videoProcessingJobs.assessmentId, assessmentId))
    .groupBy(videoProcessingJobs.status);

  const assets = await db
    .select({ status: processedVideoAssets.status, total: count() })
    .from(processedVideoAssets)
    .where(eq(processedVideoAssets.assessmentId, assessmentId))
    .groupBy(processedVideoAssets.status);

  const jobCounts = Object.fromEntries(jobs.map((row) => [row.status, row.total])) as Record<string, number>;
  const assetCounts = Object.fromEntries(assets.map((row) => [row.status, row.total])) as Record<string, number>;
  const ready = assetCounts.ready ?? 0;
  const failed = Math.max(jobCounts.failed ?? 0, assetCounts.failed ?? 0);
  const processing = jobCounts.processing ?? 0;
  const queued = jobCounts.queued ?? 0;
  const missing = Math.max(0, totalVideos - ready - failed - processing - queued);

  let status: ProcessingSummary["status"] = "not_ready";
  if (totalVideos > 0 && ready === totalVideos) status = "ready";
  else if (failed > 0) status = "failed";
  else if (processing > 0) status = "processing";
  else if (queued > 0) status = "queued";

  return { totalVideos, ready, queued, processing, failed, missing, status };
}

export async function markAssessmentProcessingFailed(assessmentId: string, errorMessage: string) {
  await db
    .update(videoProcessingJobs)
    .set({ status: "failed", errorMessage, updatedAt: new Date(), completedAt: new Date() })
    .where(and(eq(videoProcessingJobs.assessmentId, assessmentId), inArray(videoProcessingJobs.status, ["queued", "processing"])));
}

export async function claimProcessingJobs(assessmentId: string) {
  const jobs = await db
    .select({
      jobId: videoProcessingJobs.id,
      attempts: videoProcessingJobs.attempts,
      videoObjectId: videoObjects.id,
      assessmentId: videoObjects.assessmentId,
      questionId: videoObjects.questionId,
      attemptId: videoObjects.attemptId,
      gcsObjectName: videoObjects.gcsObjectName,
    })
    .from(videoProcessingJobs)
    .innerJoin(videoObjects, eq(videoObjects.id, videoProcessingJobs.videoObjectId))
    .where(and(eq(videoProcessingJobs.assessmentId, assessmentId), inArray(videoProcessingJobs.status, ["queued", "failed"])));

  for (const job of jobs) {
    await db
      .update(videoProcessingJobs)
      .set({
        status: "processing",
        attempts: job.attempts + 1,
        errorMessage: null,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(videoProcessingJobs.id, job.jobId));
    await db
      .insert(processedVideoAssets)
      .values({
        assessmentId: job.assessmentId,
        videoObjectId: job.videoObjectId,
        processingJobId: job.jobId,
        status: "processing",
      })
      .onConflictDoNothing();
  }
  return jobs;
}

export async function markProcessingJobReady(params: {
  jobId: string;
  assessmentId: string;
  videoObjectId: string;
  mp4ObjectName: string;
  thumbnailObjectName: string;
  mp4SizeBytes: number;
  thumbnailSizeBytes: number;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
}) {
  await db
    .insert(processedVideoAssets)
    .values({
      assessmentId: params.assessmentId,
      videoObjectId: params.videoObjectId,
      processingJobId: params.jobId,
      status: "ready",
      mp4ObjectName: params.mp4ObjectName,
      thumbnailObjectName: params.thumbnailObjectName,
      mp4SizeBytes: params.mp4SizeBytes,
      thumbnailSizeBytes: params.thumbnailSizeBytes,
      durationSeconds: params.durationSeconds ? Math.round(params.durationSeconds) : undefined,
      metadata: params.metadata,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: processedVideoAssets.videoObjectId,
      set: {
        processingJobId: params.jobId,
        status: "ready",
        mp4ObjectName: params.mp4ObjectName,
        thumbnailObjectName: params.thumbnailObjectName,
        mp4SizeBytes: params.mp4SizeBytes,
        thumbnailSizeBytes: params.thumbnailSizeBytes,
        durationSeconds: params.durationSeconds ? Math.round(params.durationSeconds) : undefined,
        metadata: params.metadata,
        errorMessage: null,
        updatedAt: new Date(),
      },
    });
  await db
    .update(videoProcessingJobs)
    .set({ status: "ready", errorMessage: null, completedAt: new Date(), updatedAt: new Date() })
    .where(eq(videoProcessingJobs.id, params.jobId));
}

export async function markProcessingJobFailed(jobId: string, videoObjectId: string, errorMessage: string) {
  const [video] = await db.select({ assessmentId: videoObjects.assessmentId }).from(videoObjects).where(eq(videoObjects.id, videoObjectId)).limit(1);
  if (!video) throw new Error("Video object was not found.");
  await db
    .update(videoProcessingJobs)
    .set({ status: "failed", errorMessage, completedAt: new Date(), updatedAt: new Date() })
    .where(eq(videoProcessingJobs.id, jobId));
  await db
    .insert(processedVideoAssets)
    .values({ videoObjectId, assessmentId: video.assessmentId, status: "failed", errorMessage })
    .onConflictDoUpdate({
      target: processedVideoAssets.videoObjectId,
      set: { status: "failed", errorMessage, updatedAt: new Date() },
    });
}

export async function getReadyProcessedAssetsForAssessment(assessmentId: string) {
  return db
    .select({
      processedAssetId: processedVideoAssets.id,
      videoObjectId: videoObjects.id,
      questionNumber: assessmentQuestions.questionNumber,
      questionText: assessmentQuestions.text,
      mp4ObjectName: processedVideoAssets.mp4ObjectName,
      thumbnailObjectName: processedVideoAssets.thumbnailObjectName,
      durationSeconds: processedVideoAssets.durationSeconds,
      mp4SizeBytes: processedVideoAssets.mp4SizeBytes,
      thumbnailSizeBytes: processedVideoAssets.thumbnailSizeBytes,
    })
    .from(processedVideoAssets)
    .innerJoin(videoObjects, eq(videoObjects.id, processedVideoAssets.videoObjectId))
    .innerJoin(assessmentQuestions, eq(assessmentQuestions.id, videoObjects.questionId))
    .where(and(eq(processedVideoAssets.assessmentId, assessmentId), eq(processedVideoAssets.status, "ready")))
    .orderBy(assessmentQuestions.questionNumber);
}

export function processedObjectNames(assessmentId: string, videoObjectId: string) {
  const base = `${processedVideoPrefix()}/${assessmentId}/${videoObjectId}`;
  return {
    mp4ObjectName: `${base}/playback.mp4`,
    thumbnailObjectName: `${base}/thumbnail.jpg`,
  };
}

async function getFinalizedVideosForAssessment(assessmentId: string) {
  const [assessment] = await db.select({ id: assessments.id, status: assessments.status }).from(assessments).where(eq(assessments.id, assessmentId)).limit(1);
  if (!assessment) throw new Error("Assessment was not found.");
  if (!["completed", "reviewed"].includes(assessment.status)) {
    throw new Error("Only completed or reviewed assessments can be processed.");
  }
  return db
    .select({
      videoObjectId: videoObjects.id,
    })
    .from(questionResponses)
    .innerJoin(videoObjects, eq(videoObjects.attemptId, questionResponses.finalizedAttemptId))
    .where(eq(questionResponses.assessmentId, assessmentId));
}
