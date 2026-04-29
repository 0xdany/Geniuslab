import { and, asc, desc, eq, gte, ilike, lte } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db/client";
import { assessments, candidates } from "@/db/schema";
import { AssessmentFilters } from "@/components/admin/assessment-filters";
import { AssessmentTable } from "@/components/admin/assessment-table";
import { expireStaleAssessments } from "@/lib/status";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/animation-wrapper";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, CheckCircle2, Clock3, Send, Video } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await expireStaleAssessments();
  const params = await searchParams;
  const filters = [
    params.status ? eq(assessments.status, params.status as typeof assessments.status.enumValues[number]) : undefined,
    params.title ? ilike(assessments.title, `%${params.title}%`) : undefined,
    params.source ? eq(assessments.sourceType, params.source as "manual" | "api") : undefined,
    params.from ? gte(assessments.createdAt, new Date(params.from)) : undefined,
    params.to ? lte(assessments.createdAt, new Date(params.to)) : undefined,
    params.minScore ? gte(assessments.overallScore, params.minScore) : undefined,
    params.maxScore ? lte(assessments.overallScore, params.maxScore) : undefined,
  ].filter(Boolean);
  const sort =
    params.sort === "candidate" ? asc(candidates.name)
      : params.sort === "status" ? asc(assessments.status)
        : params.sort === "score" ? desc(assessments.overallScore)
          : desc(assessments.submittedAt);
  const rows = await db
    .select({
      id: assessments.id,
      candidateName: candidates.name,
      candidateEmail: candidates.email,
      title: assessments.title,
      status: assessments.status,
      sourceType: assessments.sourceType,
      submittedAt: assessments.submittedAt,
      createdAt: assessments.createdAt,
      overallScore: assessments.overallScore,
    })
    .from(assessments)
    .innerJoin(candidates, eq(candidates.id, assessments.candidateId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(sort);
  const completedCount = rows.filter((row) => row.status === "completed").length;
  const inProgressCount = rows.filter((row) => row.status === "in_progress").length;
  const reviewedCount = rows.filter((row) => row.status === "reviewed").length;
  const invitedCount = rows.filter((row) => row.status === "invited").length;
  const totalCount = rows.length;
  const submittedCount = completedCount + reviewedCount;
  const candidateCompletionRate = totalCount ? Math.round((submittedCount / totalCount) * 100) : 0;
  const reviewCompletionRate = submittedCount ? Math.round((reviewedCount / submittedCount) * 100) : 0;
  const circumference = 339.292;
  const reviewedArc = submittedCount ? (reviewedCount / submittedCount) * circumference : 0;
  const pendingReviewArc = submittedCount ? (completedCount / submittedCount) * circumference : 0;
  const pendingReviewOffset = circumference - reviewedArc;
  const overviewMetrics = [
    { label: "Awaiting candidate", value: invitedCount, caption: "Invitation sent", href: "/admin?status=invited", icon: Send, tone: "text-primary" },
    { label: "In progress", value: inProgressCount, caption: "Candidate recording", href: "/admin?status=in_progress", icon: Clock3, tone: "text-amber-600" },
    { label: "Needs review", value: completedCount, caption: "Submitted, not reviewed", href: "/admin?status=completed", icon: Video, tone: "text-emerald-600" },
    { label: "Reviewed", value: reviewedCount, caption: "Review complete", href: "/admin?status=reviewed", icon: CheckCircle2, tone: "text-indigo-600" },
  ];

  return (
    <StaggerContainer className="relative">
      <StaggerItem className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="default">Hiring operations</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Assessment workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review submissions, track candidate progress, and keep every interview stage moving from one clean dashboard.</p>
        </div>
        <Link href="/admin/assessments/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
          New assessment
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Link>
      </StaggerItem>

      <StaggerItem className="mb-6">
        <section className="console-shell overflow-hidden p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-label">Pipeline overview</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">Action queue</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <span className="rounded-full border bg-muted/40 px-3 py-1">{totalCount} total</span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                {submittedCount}/{totalCount || 0} submitted
              </span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_210px]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {overviewMetrics.map((metric) => (
                <Link key={metric.label} href={metric.href} className="rounded-lg border bg-muted/15 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
                  <metric.icon className={`h-5 w-5 ${metric.tone}`} />
                  <div className="mt-3 text-3xl font-bold">{metric.value}</div>
                  <p className="mt-1 text-sm font-bold text-foreground">{metric.label}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">{metric.caption}</p>
                </Link>
              ))}
            </div>

            <div className="rounded-lg border bg-white p-3">
              <div className="relative mx-auto h-36 w-36">
                <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                  <circle cx="70" cy="70" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
                  {reviewedArc > 0 ? (
                    <circle
                      cx="70"
                      cy="70"
                      r="54"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="14"
                      strokeLinecap="butt"
                      strokeDasharray={`${reviewedArc} ${circumference - reviewedArc}`}
                    />
                  ) : null}
                  {pendingReviewArc > 0 ? (
                    <circle
                      cx="70"
                      cy="70"
                      r="54"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="14"
                      strokeLinecap="butt"
                      strokeDasharray={`${pendingReviewArc} ${circumference - pendingReviewArc}`}
                      strokeDashoffset={pendingReviewOffset}
                    />
                  ) : null}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold tracking-tight">{reviewCompletionRate}%</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Reviewed</div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs font-semibold text-muted-foreground">
                <div className="rounded-md bg-muted/40 px-2 py-1.5">
                  <span className="block text-foreground">{candidateCompletionRate}%</span>
                  candidate completion
                </div>
                <div className="rounded-md bg-muted/40 px-2 py-1.5">
                  <span className="block text-foreground">{completedCount}</span>
                  pending review
                </div>
              </div>
            </div>
          </div>
        </section>
      </StaggerItem>

      <StaggerItem>
        <div className="mb-6">
          <AssessmentFilters defaults={params} />
        </div>
      </StaggerItem>
      <FadeIn delay={0.2}>
        <div className="console-shell overflow-hidden">
          <AssessmentTable rows={rows} />
        </div>
      </FadeIn>
    </StaggerContainer>
  );
}
