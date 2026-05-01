import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  assessmentQuestions,
  assessmentReviews,
  assessments,
  candidates,
  questionResponses,
  responseReviews,
  videoObjects,
  processedVideoAssets,
} from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BulkDownloadButton } from "@/components/admin/bulk-download-button";
import { ReviewForm } from "@/components/admin/review-form";
import { OverallReviewForm } from "@/components/admin/overall-review-form";
import { ReviewPlayer } from "@/components/admin/review-player";
import { IntegrationActions } from "@/components/admin/integration-actions";
import { requireAdmin } from "@/lib/admin-access";
import { videoDownloadName } from "@/lib/downloads";
import { getSignedReadUrl } from "@/lib/storage/gcs";
import { getProcessingSummary } from "@/lib/integrations/processing";
import { getLatestDriveExportJob } from "@/lib/integrations/drive";
import { StaggerContainer, StaggerItem } from "@/components/ui/animation-wrapper";
import { ChevronLeft, ChevronRight, CheckCircle2, User } from "lucide-react";

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
      processedStatus: processedVideoAssets.status,
      processedMp4ObjectName: processedVideoAssets.mp4ObjectName,
      processedThumbnailObjectName: processedVideoAssets.thumbnailObjectName,
      processedDurationSeconds: processedVideoAssets.durationSeconds,
      reviewScore: responseReviews.score,
      reviewNotes: responseReviews.notes,
    })
    .from(assessmentQuestions)
    .leftJoin(questionResponses, eq(questionResponses.questionId, assessmentQuestions.id))
    .leftJoin(videoObjects, eq(videoObjects.attemptId, questionResponses.finalizedAttemptId))
    .leftJoin(processedVideoAssets, eq(processedVideoAssets.videoObjectId, videoObjects.id))
    .leftJoin(responseReviews, eq(responseReviews.responseId, questionResponses.id))
    .where(eq(assessmentQuestions.assessmentId, id))
    .orderBy(asc(assessmentQuestions.questionNumber));

  const signedRows = await Promise.all(
    rows.map(async (row) => {
      if (!row.objectName) return { ...row, playbackSigned: null, downloadSigned: null, posterSigned: null };
      const playbackObjectName = row.processedStatus === "ready" && row.processedMp4ObjectName ? row.processedMp4ObjectName : row.objectName;
      const playbackSigned = await getSignedReadUrl(playbackObjectName, 15 * 60);
      const downloadSigned = await getSignedReadUrl(
        row.objectName,
        15 * 60,
        `attachment; filename="${videoDownloadName(candidate.name, assessment.title, row.questionNumber, row.ext || "webm")}"`,
      );
      const posterSigned = row.processedStatus === "ready" && row.processedThumbnailObjectName
        ? await getSignedReadUrl(row.processedThumbnailObjectName, 15 * 60)
        : null;
      return { ...row, playbackSigned, downloadSigned, posterSigned };
    }),
  );
  const processingSummary = await getProcessingSummary(id);
  const driveExport = await getLatestDriveExportJob(id);
  const driveExportView = driveExport
    ? {
      status: driveExport.status,
      driveFolderUrl: driveExport.driveFolderUrl,
      errorMessage: driveExport.errorMessage,
    }
    : null;
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
    <StaggerContainer className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Header & Navigation */}
      <StaggerItem className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <Link 
          href="/admin" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Assessments
        </Link>
        <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md rounded-full p-1 border border-border/50 shadow-sm">
          {previousAssessment ? (
            <Link 
              href={`/admin/assessments/${previousAssessment.id}`} 
              className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Prev
            </Link>
          ) : <span className="px-4 py-1.5 text-sm text-muted-foreground opacity-50 cursor-not-allowed">Prev</span>}
          
          <div className="w-px h-4 bg-border mx-1"></div>
          
          {nextAssessment ? (
            <Link 
              href={`/admin/assessments/${nextAssessment.id}`} 
              className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          ) : <span className="px-4 py-1.5 text-sm text-muted-foreground opacity-50 cursor-not-allowed">Next</span>}
        </div>
      </StaggerItem>

      {/* Candidate Profile Card */}
      <StaggerItem>
        <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
              <User className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{candidate.name}</h1>
                <Badge variant={assessment.status === "completed" ? "default" : "secondary"}>
                  {assessment.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{candidate.email}</span>
                {candidate.phone && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40"></span>
                    <span>{candidate.phone}</span>
                  </>
                )}
                {candidate.resumeUrl && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40"></span>
                    <a className="text-primary hover:underline font-medium" href={candidate.resumeUrl} target="_blank" rel="noreferrer">
                      View Resume
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <BulkDownloadButton assessmentId={assessment.id} />
            {assessment.status === "completed" && (
              <form action={markReviewed} className="w-full md:w-auto">
                <Button className="w-full md:w-auto">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Reviewed
                </Button>
              </form>
            )}
          </div>
        </div>
      </StaggerItem>

      <StaggerItem>
        <IntegrationActions assessmentId={assessment.id} processing={processingSummary} driveExport={driveExportView} />
      </StaggerItem>

      <StaggerItem>
        <Card>
          <CardHeader className="border-b bg-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-xl">Overall Review</CardTitle>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Final score and closing thoughts for this assessment.
                </p>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[560px]">
                <div className="rounded-lg border bg-muted/25 px-3 py-2">
                  <p className="section-label">Assessment</p>
                  <p className="mt-1 truncate font-semibold">{assessment.title}</p>
                </div>
                <div className="rounded-lg border bg-muted/25 px-3 py-2">
                  <p className="section-label">Source</p>
                  <p className="mt-1 font-semibold capitalize">{assessment.sourceType}</p>
                </div>
                <div className="rounded-lg border bg-muted/25 px-3 py-2">
                  <p className="section-label">Created</p>
                  <p className="mt-1 font-semibold">{assessment.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            {assessment.description ? (
              <p className="mt-4 rounded-lg border bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
                {assessment.description}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="p-5">
            <OverallReviewForm
              initialScore={assessment.overallScore}
              initialNotes={assessment.summaryNotes}
              action={saveOverallReview}
            />
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Videos List */}
      <StaggerItem>
        <h2 className="text-xl font-semibold mt-8 mb-5">Candidate Responses</h2>
        <div className="space-y-6">
          {signedRows.map((row) => (
            <Card key={row.questionId} className="overflow-hidden border-border/40 shadow-sm">
              <div className="flex flex-col">
                <div className="grid gap-6 border-b border-border/60 bg-white p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
                  <section className="flex flex-col justify-between rounded-lg border bg-muted/25 p-5">
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-border/50 text-xs font-semibold">
                          Question {row.questionNumber}
                        </Badge>
                        {row.durationSeconds && (
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {row.processedDurationSeconds || row.durationSeconds}s
                          </span>
                        )}
                      </div>
                      <p className="section-label">Prompt</p>
                      <h3 className="mt-3 font-semibold text-2xl text-foreground leading-snug">
                        {row.questionText}
                      </h3>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-lg bg-black shadow-sm">
                    {row.playbackSigned ? (
                      <ReviewPlayer
                        src={row.playbackSigned.url}
                        downloadUrl={row.downloadSigned?.url}
                        poster={row.posterSigned?.url}
                      />
                    ) : (
                      <div className="flex min-h-[300px] flex-col items-center justify-center text-center bg-slate-900/50">
                        <div className="rounded-full bg-white/5 p-5 mb-5 ring-1 ring-white/10">
                          <svg className="w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-white/80 font-medium text-lg">Video still processing</p>
                        <p className="text-sm text-white/50 mt-1">Please check back in a few minutes.</p>
                      </div>
                    )}
                  </section>
                </div>

                {/* Review Form Section */}
                <div className="bg-background px-5 py-5">
                  {row.responseId ? (
                    <div>
                      <ReviewForm responseId={row.responseId} score={row.reviewScore} notes={row.reviewNotes} action={saveReview} />
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-muted/10 rounded-xl border border-dashed border-border/50">
                      <p className="text-sm text-muted-foreground italic">No response submitted yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
}
