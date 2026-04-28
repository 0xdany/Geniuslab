import { describe, expect, it } from "vitest";
import { intakePayloadSchema } from "@/lib/validation/intake";

describe("intake payload validation", () => {
  it("accepts the required payload shape", () => {
    const parsed = intakePayloadSchema.safeParse({
      candidate: { id: "000000", name: "Jane Doe", email: "jane@example.com" },
      assessment: { title: "Software Engineer", questions: [{ text: "Tell us about yourself." }] },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects missing questions", () => {
    const parsed = intakePayloadSchema.safeParse({
      candidate: { id: "000000", name: "Jane Doe", email: "jane@example.com" },
      assessment: { title: "Software Engineer", questions: [] },
    });
    expect(parsed.success).toBe(false);
  });
});
