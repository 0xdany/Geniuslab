import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getProcessingSummary } from "@/lib/integrations/processing";
import { runVideoWorkerJob } from "@/lib/integrations/cloud-run-jobs";
import { assertProcessedAssetsReady, ensureDriveExportJob, markDriveExportFailed } from "@/lib/integrations/drive";
import { badRequest } from "@/lib/permissions";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const currentAdmin = await requireAdmin();
  const { id } = await context.params;
  try {
    const summary = await getProcessingSummary(id);
    if (summary.totalVideos === 0 || summary.ready < summary.totalVideos) {
      return badRequest("VIDEOS_NOT_PROCESSED", "Process all videos before exporting to Drive.", 409);
    }
    await assertProcessedAssetsReady(id);
    const exportJob = await ensureDriveExportJob({ assessmentId: id, createdByUserId: currentAdmin.user.id });
    if (exportJob.status !== "completed") {
      await runVideoWorkerJob({ mode: "drive-export", assessmentId: id, driveExportJobId: exportJob.id });
    }
    return NextResponse.json({ success: true, exportJob });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Drive export.";
    const maybeJob = await ensureDriveExportJob({ assessmentId: id, createdByUserId: currentAdmin.user.id }).catch(() => null);
    if (maybeJob) await markDriveExportFailed(maybeJob.id, message).catch(() => undefined);
    return badRequest("DRIVE_EXPORT_START_FAILED", message, 422);
  }
}
