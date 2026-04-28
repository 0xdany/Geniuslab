import { describe, expect, it } from "vitest";
import { extensionForMimeType, recorderMimeCandidates } from "@/lib/media/mime-types";

describe("recorder mime types", () => {
  it("keeps webm before mp4 and maps extensions", () => {
    expect(recorderMimeCandidates[0]).toContain("webm");
    expect(extensionForMimeType("video/mp4")).toBe("mp4");
    expect(extensionForMimeType("video/webm;codecs=vp8,opus")).toBe("webm");
  });
});
