import { describe, expect, it } from "vitest";
import { isUnsupportedCandidateDevice } from "@/lib/device-detection";

describe("candidate device detection", () => {
  it("blocks mobile user agents", () => {
    const headers = new Headers({ "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148" });
    expect(isUnsupportedCandidateDevice(headers)).toBe(true);
  });

  it("allows desktop user agents", () => {
    const headers = new Headers({ "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" });
    expect(isUnsupportedCandidateDevice(headers)).toBe(false);
  });
});
