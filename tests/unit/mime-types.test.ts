import { describe, expect, it } from "vitest";
import { extensionForMimeType, recorderMimeCandidates } from "@/lib/media/mime-types";

describe("recorder mime types", () => {
  it("prefers mp4 for Safari-friendly playback and maps extensions", () => {
    expect(recorderMimeCandidates[0]).toContain("mp4");
    expect(recorderMimeCandidates.some((type) => type.includes("webm"))).toBe(true);
    expect(extensionForMimeType("video/mp4")).toBe("mp4");
    expect(extensionForMimeType("video/webm;codecs=vp8,opus")).toBe("webm");
  });
});
