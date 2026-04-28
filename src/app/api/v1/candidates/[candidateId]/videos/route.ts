import { NextRequest } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { assessments, candidates } from "@/db/schema";
import { authenticateApiKey } from "@/lib/api-keys";
import { unauthorized, badRequest } from "@/lib/permissions";

export async function GET(request: NextRequest, context: { params: Promise<{ candidateId: string }> }) {
  const apiKey = await authenticateApiKey(request.headers.get("authorization"));
  if (!apiKey) return unauthorized("A valid API key is required.");
  const { candidateId } = await context.params;
  const [row] = await db
    .select({ assessmentId: assessments.id })
    .from(candidates)
    .innerJoin(assessments, eq(assessments.candidateId, candidates.id))
    .where(and(eq(candidates.externalId, candidateId), inArray(assessments.status, ["completed", "reviewed"])))
    .orderBy(desc(assessments.submittedAt))
    .limit(1);
  if (!row) return badRequest("NOT_FOUND", "No completed assessment was found for this candidate.", 404);
  const url = new URL(`/api/v1/assessments/${row.assessmentId}/videos`, request.url);
  return fetch(url, { headers: { authorization: request.headers.get("authorization") ?? "" } });
}
