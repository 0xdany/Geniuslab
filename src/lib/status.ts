import { and, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { assessments } from "@/db/schema";

export async function expireAssessmentIfNeeded(assessmentId: string) {
  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, assessmentId)).limit(1);
  if (!assessment) return null;
  if (assessment.expiresAt <= new Date() && ["invited", "in_progress"].includes(assessment.status)) {
    const [expired] = await db
      .update(assessments)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(assessments.id, assessmentId))
      .returning();
    return expired;
  }
  return assessment;
}

export async function expireStaleAssessments() {
  return db
    .update(assessments)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(lt(assessments.expiresAt, new Date()), inArray(assessments.status, ["invited", "in_progress"])))
    .returning({ id: assessments.id });
}
