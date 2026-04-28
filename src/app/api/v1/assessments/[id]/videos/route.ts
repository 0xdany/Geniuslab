import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assessmentQuestions, assessments, candidates, questionResponses, videoObjects } from "@/db/schema";
import { authenticateApiKey } from "@/lib/api-keys";
import { logApiRequest } from "@/lib/audit";
import { getSignedReadUrl } from "@/lib/storage/gcs";
import { getAppSettings } from "@/lib/settings";
import { badRequest, unauthorized } from "@/lib/permissions";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const path = "/api/v1/assessments/{id}/videos";
  const apiKey = await authenticateApiKey(_request.headers.get("authorization"));
  if (!apiKey) return unauthorized("A valid API key is required.");
  const { id } = await context.params;
  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
  if (!assessment) return badRequest("NOT_FOUND", "Assessment was not found.", 404);
  if (!["completed", "reviewed"].includes(assessment.status)) {
    return badRequest("ASSESSMENT_INCOMPLETE", "Videos are available only after submission.", 409);
  }
  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, assessment.candidateId)).limit(1);
  const settings = await getAppSettings();
  const rows = await db
    .select({
      questionNumber: assessmentQuestions.questionNumber,
      questionText: assessmentQuestions.text,
      objectName: videoObjects.gcsObjectName,
      ext: videoObjects.fileExtension,
      duration: videoObjects.durationSeconds,
    })
    .from(questionResponses)
    .innerJoin(assessmentQuestions, eq(assessmentQuestions.id, questionResponses.questionId))
    .innerJoin(videoObjects, eq(videoObjects.attemptId, questionResponses.finalizedAttemptId))
    .where(eq(questionResponses.assessmentId, id));

  const videos = await Promise.all(
    rows.map(async (row) => {
      const signed = await getSignedReadUrl(row.objectName, settings.signedUrlTtlMinutes * 60);
      return {
        questionNumber: row.questionNumber,
        questionText: row.questionText,
        videoUrl: signed.url,
        expiresAt: signed.expiresAt,
        duration: row.duration,
      };
    }),
  );

  await logApiRequest({ apiKeyId: apiKey.id, method: "GET", path, statusCode: 200 });
  return NextResponse.json({
    success: true,
    candidate: { id: candidate?.externalId, name: candidate?.name, email: candidate?.email },
    assessment: { id: assessment.id, title: assessment.title, submittedAt: assessment.submittedAt?.toISOString() },
    videos,
  });
}
