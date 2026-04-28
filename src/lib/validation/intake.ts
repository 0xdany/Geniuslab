import { z } from "zod";

export const intakePayloadSchema = z.object({
  event: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  candidate: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    resumeUrl: z.string().url().optional(),
  }),
  assessment: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    questions: z
      .array(
        z.object({
          text: z.string().min(1),
          maxDurationSeconds: z.number().int().positive().optional(),
          maxAttempts: z.number().int().positive().default(1),
        }),
      )
      .min(1),
  }),
});

export type IntakePayload = z.infer<typeof intakePayloadSchema>;
