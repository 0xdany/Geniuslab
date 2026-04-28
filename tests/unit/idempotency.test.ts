import { describe, expect, it } from "vitest";
import { requestBodyHash } from "@/lib/idempotency";

describe("idempotency request hashing", () => {
  it("is stable for reordered object keys", () => {
    expect(requestBodyHash({ b: 2, a: { d: 4, c: 3 } })).toBe(requestBodyHash({ a: { c: 3, d: 4 }, b: 2 }));
  });
});
