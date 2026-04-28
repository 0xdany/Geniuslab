import { z } from "zod";

export const manualAssessmentSchema = z.object({
  candidateName: z.string().min(1),
  candidateEmail: z.string().email(),
  candidatePhone: z.string().optional(),
  resumeUrl: z.string().url().optional().or(z.literal("")),
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        maxDurationSeconds: z.coerce.number().int().positive().optional().or(z.literal("")),
        maxAttempts: z.coerce.number().int().positive().default(1),
      }),
    )
    .min(1),
});
