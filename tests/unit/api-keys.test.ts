import { describe, expect, it } from "vitest";
import { hashApiKey, makeApiKey } from "@/lib/api-keys";

describe("api keys", () => {
  it("creates prefixed keys and hashes deterministically", () => {
    const key = makeApiKey();
    expect(key.raw.startsWith("glv_")).toBe(true);
    expect(key.prefix).toBe(key.raw.slice(0, 12));
    expect(hashApiKey(key.raw)).toBe(key.keyHash);
    expect(key.keyHash).not.toContain(key.raw);
  });
});
