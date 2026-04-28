import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  assessmentQuestions,
  assessmentReviews,
  assessments,
  candidates,
  questionResponses,
  responseReviews,
  videoObjects,
} from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BulkDownloadButton } from "@/components/admin/bulk-download-button";
import { ReviewForm } from "@/components/admin/review-form";
import { ReviewPlayer } from "@/components/admin/review-player";
import { requireAdmin } from "@/lib/admin-access";
import { videoDownloadName } from "@/lib/downloads";
import { getSignedReadUrl } from "@/lib/storage/gcs";

export const dynamic = "force-dynamic";

export default async function AssessmentReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
  if (!assessment) return <div>Assessment not found.</div>;
  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, assessment.candidateId)).limit(1);

  const rows = await db
    .select({
      questionId: assessmentQuestions.id,
      questionNumber: assessmentQuestions.questionNumber,
      questionText: assessmentQuestions.text,
      responseId: questionResponses.id,
      durationSeconds: videoObjects.durationSeconds,
      objectName: videoObjects.gcsObjectName,
      ext: videoObjects.fileExtension,
      reviewScore: responseReviews.score,
      reviewNotes: responseReviews.notes,
    })
    .from(assessmentQuestions)
    .leftJoin(questionResponses, eq(questionResponses.questionId, assessmentQuestions.id))
    .leftJoin(videoObjects, eq(videoObjects.attemptId, questionResponses.finalizedAttemptId))
    .leftJoin(responseReviews, eq(responseReviews.responseId, questionResponses.id))
    .where(eq(assessmentQuestions.assessmentId, id));

  const signedRows = await Promise.all(
    rows.map(async (row) => {
      if (!row.objectName) return { ...row, playbackSigned: null, downloadSigned: null };
      const playbackSigned = await getSignedReadUrl(row.objectName, 15 * 60);
      const downloadSigned = await getSignedReadUrl(
        row.objectName,
        15 * 60,
        `attachment; filename="${videoDownloadName(candidate.name, assessment.title, row.questionNumber, row.ext || "webm")}"`,
      );
      return { ...row, playbackSigned, downloadSigned };
    }),
  );
  const reviewQueue = await db
    .select({ id: assessments.id, candidateName: candidates.name })
    .from(assessments)
    .innerJoin(candidates, eq(candidates.id, assessments.candidateId))
    .where(inArray(assessments.status, ["completed", "reviewed"]))
    .orderBy(desc(assessments.submittedAt));
  const currentIndex = reviewQueue.findIndex((item) => item.id === id);
  const previousAssessment = currentIndex > 0 ? reviewQueue[currentIndex - 1] : null;
  const nextAssessment = currentIndex >= 0 && currentIndex < reviewQueue.length - 1 ? reviewQueue[currentIndex + 1] : null;

  async function saveReview(formData: FormData) {
    "use server";
    const currentAdmin = await requireAdmin();
    const responseId = String(formData.get("responseId") || "");
    const score = formData.get("score") ? Number(formData.get("score")) : null;
    const notes = String(formData.get("notes") || "");
    await db
      .insert(responseReviews)
      .values({ responseId, reviewerUserId: currentAdmin.user.id, score, notes, reviewed: true, updatedAt: new Date() })
      .onConflictDoNothing();
    redirect(`/admin/assessments/${id}`);
  }

  async function markReviewed() {
    "use server";
    const currentAdmin = await requireAdmin();
    await db
      .insert(assessmentReviews)
      .values({ assessmentId: id, reviewerUserId: currentAdmin.user.id, markedReviewedAt: new Date() })
      .onConflictDoNothing();
    await db.update(assessments).set({ status: "reviewed", reviewedAt: new Date(), updatedAt: new Date() }).where(eq(assessments.id, id));
    redirect(`/admin/assessments/${id}`);
  }

  async function saveOverallReview(formData: FormData) {
    "use server";
    const currentAdmin = await requireAdmin();
    const overallScore = formData.get("overallScore") ? String(formData.get("overallScore")) : null;
    const summaryNotes = String(formData.get("summaryNotes") || "");
    await db
      .insert(assessmentReviews)
      .values({ assessmentId: id, reviewerUserId: currentAdmin.user.id, overallScore, summaryNotes, updatedAt: new Date() })
      .onConflictDoNothing();
    await db
      .update(assessments)
      .set({ overallScore, summaryNotes, updatedAt: new Date() })
      .where(eq(assessments.id, id));
    redirect(`/admin/assessments/${id}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-primary">Back to list</Link>
          <h1 className="mt-2 text-2xl font-semibold">{candidate.name}</h1>
          <p className="text-sm text-muted-foreground">{candidate.email} {candidate.phone ? `• ${candidate.phone}` : ""}</p>
          {candidate.resumeUrl ? <a className="text-sm text-primary" href={candidate.resumeUrl}>Resume</a> : null}
        </div>
        <div className="flex items-center gap-3">
          {previousAssessment ? (
            <Link href={`/admin/assessments/${previousAssessment.id}`} className="text-sm font-medium text-primary">
              Previous
            </Link>
          ) : null}
          {nextAssessment ? (
            <Link href={`/admin/assessments/${nextAssessment.id}`} className="text-sm font-medium text-primary">
              Next
            </Link>
          ) : null}
          <Badge>{assessment.status}</Badge>
          <BulkDownloadButton assessmentId={assessment.id} />
          {assessment.status === "completed" ? (
            <form action={markReviewed}><Button>Mark reviewed</Button></form>
          ) : null}
        </div>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">{assessment.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{assessment.description || "No description provided."}</p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Overall review</h2>
        <form action={saveOverallReview} className="mt-3 grid gap-3 md:grid-cols-[140px_1fr_auto]">
          <input
            name="overallScore"
            type="number"
            min={1}
            max={5}
            step="0.5"
            defaultValue={assessment.overallScore ?? ""}
            placeholder="Score"
            className="h-10 rounded-md border bg-white px-3 text-sm"
          />
          <textarea
            name="summaryNotes"
            defaultValue={assessment.summaryNotes ?? ""}
            placeholder="Summary notes"
            className="min-h-10 rounded-md border bg-white px-3 py-2 text-sm"
          />
          <Button type="submit">Save summary</Button>
        </form>
      </Card>

      <div className="space-y-4">
        {signedRows.map((row) => (
          <Card key={row.questionId}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Q{row.questionNumber}: {row.questionText}</h3>
              <span className="text-sm text-muted-foreground">{row.durationSeconds ? `${row.durationSeconds}s` : ""}</span>
            </div>
            {row.playbackSigned ? (
              <>
                <ReviewPlayer src={row.playbackSigned.url} />
                {row.downloadSigned ? (
                  <a className="mt-2 inline-flex text-sm font-medium text-primary" href={row.downloadSigned.url}>
                    Download individual video
                  </a>
                ) : null}
              </>
            ) : (
              <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">Video still uploading or missing.</div>
            )}
            {row.responseId ? <ReviewForm responseId={row.responseId} score={row.reviewScore} notes={row.reviewNotes} action={saveReview} /> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
