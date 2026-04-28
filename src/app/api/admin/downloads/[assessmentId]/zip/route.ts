import { NextRequest } from "next/server";
import archiver from "archiver";
import { PassThrough } from "node:stream";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assessmentQuestions, assessments, candidates, questionResponses, videoObjects } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-access";
import { videoDownloadName, videoZipFolder } from "@/lib/downloads";
import { getVideoBucket } from "@/lib/storage/gcs";

export async function GET(_request: NextRequest, context: { params: Promise<{ assessmentId: string }> }) {
  await requireAdmin();
  const { assessmentId } = await context.params;
  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, assessmentId)).limit(1);
  if (!assessment) return new Response("Not found", { status: 404 });
  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, assessment.candidateId)).limit(1);
  const rows = await db
    .select({
      questionNumber: assessmentQuestions.questionNumber,
      objectName: videoObjects.gcsObjectName,
      ext: videoObjects.fileExtension,
    })
    .from(questionResponses)
    .innerJoin(assessmentQuestions, eq(assessmentQuestions.id, questionResponses.questionId))
    .innerJoin(videoObjects, eq(videoObjects.attemptId, questionResponses.finalizedAttemptId))
    .where(eq(questionResponses.assessmentId, assessment.id));

  const archive = archiver("zip", { zlib: { level: 6 } });
  const stream = new PassThrough();
  archive.pipe(stream);

  const folder = videoZipFolder(candidate.name, assessment.title);
  for (const row of rows) {
    archive.append(getVideoBucket().file(row.objectName).createReadStream(), {
      name: `${folder}/${videoDownloadName(candidate.name, assessment.title, row.questionNumber, row.ext)}`,
    });
  }
  archive.finalize().catch(() => undefined);

  return new Response(stream as unknown as BodyInit, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${folder}.zip"`,
    },
  });
}
