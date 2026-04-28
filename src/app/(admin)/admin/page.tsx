import { and, asc, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { assessments, candidates } from "@/db/schema";
import { AssessmentFilters } from "@/components/admin/assessment-filters";
import { AssessmentTable } from "@/components/admin/assessment-table";
import { expireStaleAssessments } from "@/lib/status";

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
  ].filter(Boolean);
  const sort = params.sort === "candidate" ? asc(candidates.name) : desc(assessments.submittedAt);
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

  return (
    <div>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assessments</h1>
          <p className="text-sm text-muted-foreground">Review submissions, track status, and navigate candidate work.</p>
        </div>
      </div>
      <AssessmentFilters defaults={params} />
      <AssessmentTable rows={rows} />
    </div>
  );
}
