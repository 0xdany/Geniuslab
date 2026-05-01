import { describe, expect, it, vi } from "vitest";
import {
  driveAssessmentFolderName,
  processedThumbnailExportName,
  processedVideoExportName,
} from "@/lib/integrations/drive";
import { processedObjectNames } from "@/lib/integrations/processing";

describe("integration helpers", () => {
  it("builds stable processed GCS object names", () => {
    vi.stubEnv("PROCESSED_VIDEO_PREFIX", "processed-test");
    expect(processedObjectNames("assessment-1", "video-1")).toEqual({
      mp4ObjectName: "processed-test/assessment-1/video-1/playback.mp4",
      thumbnailObjectName: "processed-test/assessment-1/video-1/thumbnail.jpg",
    });
    vi.unstubAllEnvs();
  });

  it("builds readable Drive export names", () => {
    expect(driveAssessmentFolderName("Jane Doe", "Software Engineer")).toBe("Jane_Doe_Software_Engineer");
    expect(processedVideoExportName("Jane Doe", "Software Engineer", 2)).toBe("Jane_Doe_Software_Engineer_Q2.mp4");
    expect(processedThumbnailExportName("Jane Doe", "Software Engineer", 2)).toBe("Jane_Doe_Software_Engineer_Q2_thumbnail.jpg");
  });
});
