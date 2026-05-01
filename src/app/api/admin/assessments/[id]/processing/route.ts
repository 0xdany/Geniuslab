import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { runVideoWorkerJob } from "@/lib/integrations/cloud-run-jobs";
import {
  ensureProcessingJobsForAssessment,
  getProcessingSummary,
  markAssessmentProcessingFailed,
} from "@/lib/integrations/processing";
import { badRequest } from "@/lib/permissions";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await context.params;
  try {
    const jobs = await ensureProcessingJobsForAssessment(id);
    const operation = await runVideoWorkerJob({ mode: "process", assessmentId: id });
    const summary = await getProcessingSummary(id);
    return NextResponse.json({ success: true, jobs, summary, operation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start video processing.";
    await markAssessmentProcessingFailed(id, message).catch(() => undefined);
    return badRequest("PROCESSING_START_FAILED", message, 422);
  }
}
