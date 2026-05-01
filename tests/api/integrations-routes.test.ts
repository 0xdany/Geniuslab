import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  ensureProcessingJobsForAssessment: vi.fn(),
  getProcessingSummary: vi.fn(),
  markAssessmentProcessingFailed: vi.fn(),
  runVideoWorkerJob: vi.fn(),
  assertProcessedAssetsReady: vi.fn(),
  ensureDriveExportJob: vi.fn(),
  markDriveExportFailed: vi.fn(),
}));

vi.mock("@/lib/admin-access", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/integrations/processing", () => ({
  ensureProcessingJobsForAssessment: mocks.ensureProcessingJobsForAssessment,
  getProcessingSummary: mocks.getProcessingSummary,
  markAssessmentProcessingFailed: mocks.markAssessmentProcessingFailed,
}));

vi.mock("@/lib/integrations/cloud-run-jobs", () => ({
  runVideoWorkerJob: mocks.runVideoWorkerJob,
}));

vi.mock("@/lib/integrations/drive", () => ({
  assertProcessedAssetsReady: mocks.assertProcessedAssetsReady,
  ensureDriveExportJob: mocks.ensureDriveExportJob,
  markDriveExportFailed: mocks.markDriveExportFailed,
}));

describe("admin integration routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ user: { id: "admin-1" } });
  });

  it("queues processing jobs and starts the worker", async () => {
    const { POST } = await import("@/app/api/admin/assessments/[id]/processing/route");
    mocks.ensureProcessingJobsForAssessment.mockResolvedValue({ totalVideos: 2, createdJobs: 2 });
    mocks.runVideoWorkerJob.mockResolvedValue({ name: "operations/123" });
    mocks.getProcessingSummary.mockResolvedValue({
      totalVideos: 2,
      ready: 0,
      queued: 2,
      processing: 0,
      failed: 0,
      missing: 0,
      status: "queued",
    });

    const response = await POST(new Request("http://test") as never, { params: Promise.resolve({ id: "assessment-1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.ensureProcessingJobsForAssessment).toHaveBeenCalledWith("assessment-1");
    expect(mocks.runVideoWorkerJob).toHaveBeenCalledWith({ mode: "process", assessmentId: "assessment-1" });
  });

  it("rejects Drive export before all processed assets are ready", async () => {
    const { POST } = await import("@/app/api/admin/assessments/[id]/exports/drive/route");
    mocks.getProcessingSummary.mockResolvedValue({
      totalVideos: 2,
      ready: 1,
      queued: 0,
      processing: 0,
      failed: 0,
      missing: 1,
      status: "not_ready",
    });

    const response = await POST(new Request("http://test") as never, { params: Promise.resolve({ id: "assessment-1" }) });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("VIDEOS_NOT_PROCESSED");
    expect(mocks.runVideoWorkerJob).not.toHaveBeenCalled();
  });
});
