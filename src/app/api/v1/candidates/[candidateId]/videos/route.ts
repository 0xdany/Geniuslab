import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assessmentQuestions, assessments, candidates, questionResponses, videoObjects } from "@/db/schema";
import { authenticateApiKey } from "@/lib/api-keys";
import { unauthorized, badRequest } from "@/lib/permissions";
import { logApiRequest } from "@/lib/audit";
import { getAppSettings } from "@/lib/settings";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSignedReadUrl } from "@/lib/storage/gcs";

export async function GET(request: NextRequest, context: { params: Promise<{ candidateId: string }> }) {
  const path = "/api/v1/candidates/{candidateId}/videos";
  const apiKey = await authenticateApiKey(request.headers.get("authorization"));
  if (!apiKey) {
    await logApiRequest({ method: "GET", path, statusCode: 401, errorCode: "UNAUTHORIZED" });
    return unauthorized("A valid API key is required.");
  }
  const settings = await getAppSettings();
  const allowed = await checkRateLimit(`api:${apiKey.id}`, path, settings.apiRateLimitPerMinute);
  if (!allowed) {
    await logApiRequest({ apiKeyId: apiKey.id, method: "GET", path, statusCode: 429, errorCode: "RATE_LIMITED" });
    return badRequest("RATE_LIMITED", "Rate limit exceeded.", 429);
  }
  const { candidateId } = await context.params;
  const [row] = await db
    .select({
      assessmentId: assessments.id,
      assessmentTitle: assessments.title,
      submittedAt: assessments.submittedAt,
      candidateExternalId: candidates.externalId,
      candidateName: candidates.name,
      candidateEmail: candidates.email,
    })
    .from(candidates)
    .innerJoin(assessments, eq(assessments.candidateId, candidates.id))
    .where(eq(candidates.externalId, candidateId))
    .orderBy(desc(assessments.createdAt))
    .limit(1);
  if (!row) {
    await logApiRequest({ apiKeyId: apiKey.id, method: "GET", path, statusCode: 404, errorCode: "NOT_FOUND" });
    return badRequest("NOT_FOUND", "No assessment was found for this candidate.", 404);
  }
  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, row.assessmentId)).limit(1);
  if (!["completed", "reviewed"].includes(assessment.status)) {
    await logApiRequest({ apiKeyId: apiKey.id, method: "GET", path, statusCode: 409, errorCode: "ASSESSMENT_INCOMPLETE" });
    return badRequest("ASSESSMENT_INCOMPLETE", "Videos are available only after submission.", 409);
  }

  const videos = await db
    .select({
      questionNumber: assessmentQuestions.questionNumber,
      questionText: assessmentQuestions.text,
      objectName: videoObjects.gcsObjectName,
      duration: videoObjects.durationSeconds,
    })
    .from(questionResponses)
    .innerJoin(assessmentQuestions, eq(assessmentQuestions.id, questionResponses.questionId))
    .innerJoin(videoObjects, eq(videoObjects.attemptId, questionResponses.finalizedAttemptId))
    .where(eq(questionResponses.assessmentId, row.assessmentId));

  const signedVideos = await Promise.all(
    videos.map(async (video) => {
      const signed = await getSignedReadUrl(video.objectName, settings.signedUrlTtlMinutes * 60);
      return {
        questionNumber: video.questionNumber,
        questionText: video.questionText,
        videoUrl: signed.url,
        expiresAt: signed.expiresAt,
        duration: video.duration,
      };
    }),
  );

  await logApiRequest({ apiKeyId: apiKey.id, method: "GET", path, statusCode: 200 });
  return NextResponse.json({
    success: true,
    candidate: { id: row.candidateExternalId, name: row.candidateName, email: row.candidateEmail },
    assessment: { id: row.assessmentId, title: row.assessmentTitle, submittedAt: row.submittedAt?.toISOString() },
    videos: signedVideos,
  });
}
