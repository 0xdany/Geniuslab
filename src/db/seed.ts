import "dotenv/config";
import { db } from "@/db/client";
import {
  adminProfiles,
  apiKeys,
  appSettings,
  assessmentQuestions,
  assessmentReviews,
  assessments,
  assessmentTokens,
  candidates,
  emailMessages,
  questionAttempts,
  questionResponses,
  responseReviews,
  user,
  videoObjects,
} from "@/db/schema";
import { makeApiKey } from "@/lib/api-keys";
import { addDays } from "@/lib/ids";
import { sha256 } from "@/lib/crypto";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to seed.");
  await db.insert(appSettings).values({ id: "default" }).onConflictDoNothing();

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@example.com";
  await db
    .insert(user)
    .values({ id: "seed-admin", name: "Demo Admin", email: adminEmail, emailVerified: true })
    .onConflictDoNothing();
  await db.insert(adminProfiles).values({ userId: "seed-admin", role: "admin" }).onConflictDoNothing();

  const demoKey = makeApiKey();
  await db
    .insert(apiKeys)
    .values({ name: "Demo ATS", prefix: demoKey.prefix, keyHash: demoKey.keyHash, status: "active", createdByUserId: "seed-admin" })
    .onConflictDoNothing();
  console.log(`Demo ATS API key: ${demoKey.raw}`);

  const statuses = [
    "invited",
    "invited",
    "invited",
    "in_progress",
    "in_progress",
    "completed",
    "completed",
    "completed",
    "completed",
    "completed",
    "reviewed",
    "reviewed",
    "reviewed",
    "expired",
    "expired",
  ] as const;

  for (let i = 0; i < statuses.length; i++) {
    const [candidate] = await db
      .insert(candidates)
      .values({
        externalId: `demo-${i + 1}`,
        name: `Demo Candidate ${i + 1}`,
        email: `candidate${i + 1}@example.com`,
        phone: i % 2 === 0 ? "+1-555-0100" : null,
        resumeUrl: "https://example.com/resume.pdf",
      })
      .returning();
    const status = statuses[i];
    const [assessment] = await db
      .insert(assessments)
      .values({
        candidateId: candidate.id,
        title: i % 2 === 0 ? "Software Engineer Video Assessment" : "Product Manager Video Assessment",
        description: "Please answer each question clearly and concisely.",
        status,
        sourceType: i % 3 === 0 ? "api" : "manual",
        sourceCandidateId: candidate.externalId,
        expiresAt: status === "expired" ? addDays(new Date(), -1) : addDays(new Date(), 7),
        submittedAt: ["completed", "reviewed"].includes(status) ? new Date() : null,
        reviewedAt: status === "reviewed" ? new Date() : null,
        overallScore: status === "reviewed" ? "4.00" : null,
        createdByUserId: "seed-admin",
      })
      .returning();
    await db
      .insert(assessmentTokens)
      .values({ assessmentId: assessment.id, tokenHash: sha256(`assessment-token:seed-${assessment.id}`), expiresAt: assessment.expiresAt })
      .onConflictDoNothing();

    for (let questionNumber = 1; questionNumber <= 3; questionNumber++) {
      const [question] = await db
        .insert(assessmentQuestions)
        .values({
          assessmentId: assessment.id,
          questionNumber,
          text: ["Tell us about yourself.", "Describe a recent challenge.", "Why are you interested in this role?"][questionNumber - 1],
          maxDurationSeconds: 120,
          maxAttempts: 1,
        })
        .returning();
      if (["completed", "reviewed"].includes(status)) {
        const [attempt] = await db
          .insert(questionAttempts)
          .values({
            assessmentId: assessment.id,
            questionId: question.id,
            attemptNumber: 1,
            status: "finalized",
            durationSeconds: 12 + questionNumber,
            mimeType: "video/webm",
            fileExtension: "webm",
            browserName: "Seed",
            browserVersion: "1",
          })
          .returning();
        const objectName = `assessments/${assessment.id}/questions/${questionNumber}/attempts/${attempt.id}/recording.webm`;
        await db.insert(videoObjects).values({
          assessmentId: assessment.id,
          questionId: question.id,
          attemptId: attempt.id,
          gcsObjectName: objectName,
          mimeType: "video/webm",
          fileExtension: "webm",
          sizeBytes: 1024,
          durationSeconds: 12 + questionNumber,
          finalizedAt: new Date(),
        });
        const [response] = await db
          .insert(questionResponses)
          .values({ assessmentId: assessment.id, questionId: question.id, finalizedAttemptId: attempt.id, lockedAt: new Date() })
          .returning();
        if (status === "reviewed") {
          await db.insert(responseReviews).values({ responseId: response.id, reviewerUserId: "seed-admin", score: 4, notes: "Clear answer.", reviewed: true });
        }
      }
    }
    if (status === "reviewed") {
      await db.insert(assessmentReviews).values({ assessmentId: assessment.id, reviewerUserId: "seed-admin", overallScore: "4.00", summaryNotes: "Strong submission.", markedReviewedAt: new Date() });
    }
  }

  await db.insert(emailMessages).values({
    assessmentId: null,
    kind: "invitation",
    toEmail: "failed@example.com",
    subject: "Demo failed email",
    status: "failed",
    errorMessage: "Demo failure for retry UI.",
  });

  console.log("Seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
