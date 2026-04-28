import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { apiKeys } from "./api-keys";
import { user } from "./auth";

export const assessmentStatus = pgEnum("assessment_status", [
  "invited",
  "in_progress",
  "completed",
  "reviewed",
  "expired",
]);
export const sourceType = pgEnum("source_type", ["manual", "api"]);
export const attemptStatus = pgEnum("attempt_status", [
  "recording",
  "upload_pending",
  "uploaded",
  "finalized",
  "discarded",
  "failed",
]);
export const uploadStatus = pgEnum("upload_status", ["created", "uploading", "uploaded", "finalized", "failed"]);

export const adminProfiles = pgTable("admin_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminInvites = pgTable("admin_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  invitedByUserId: text("invited_by_user_id").references(() => user.id, { onDelete: "set null" }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    resumeUrl: text("resume_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("candidates_external_id_idx").on(table.externalId), index("candidates_email_idx").on(table.email)],
);

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: assessmentStatus("status").notNull().default("invited"),
    sourceType: sourceType("source_type").notNull(),
    sourceApiKeyId: uuid("source_api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
    sourceEvent: text("source_event"),
    sourceCandidateId: text("source_candidate_id"),
    sourcePayloadHash: text("source_payload_hash"),
    sourcePayloadSnapshotJson: jsonb("source_payload_snapshot_json"),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    overallScore: numeric("overall_score", { precision: 5, scale: 2 }),
    summaryNotes: text("summary_notes"),
    createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("assessments_status_idx").on(table.status),
    index("assessments_title_idx").on(table.title),
    index("assessments_source_idx").on(table.sourceType),
    index("assessments_expires_idx").on(table.expiresAt),
  ],
);

export const assessmentTokens = pgTable(
  "assessment_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("assessment_tokens_lookup_idx").on(table.tokenHash)],
);

export const candidateSessions = pgTable(
  "candidate_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    sessionHash: text("session_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("candidate_sessions_lookup_idx").on(table.sessionHash)],
);

export const assessmentQuestions = pgTable(
  "assessment_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    questionNumber: integer("question_number").notNull(),
    text: text("text").notNull(),
    maxDurationSeconds: integer("max_duration_seconds"),
    maxAttempts: integer("max_attempts").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("assessment_questions_assessment_idx").on(table.assessmentId, table.questionNumber)],
);

export const questionAttempts = pgTable(
  "question_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => assessmentQuestions.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    status: attemptStatus("status").notNull().default("recording"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    stoppedAt: timestamp("stopped_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    failureReason: text("failure_reason"),
    mimeType: text("mime_type"),
    fileExtension: text("file_extension"),
    browserName: text("browser_name"),
    browserVersion: text("browser_version"),
  },
  (table) => [index("question_attempts_question_idx").on(table.questionId, table.attemptNumber)],
);

export const questionResponses = pgTable("question_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => assessmentQuestions.id, { onDelete: "cascade" }),
  finalizedAttemptId: uuid("finalized_attempt_id").references(() => questionAttempts.id, { onDelete: "set null" }),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const videoObjects = pgTable("video_objects", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => assessmentQuestions.id, { onDelete: "cascade" }),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => questionAttempts.id, { onDelete: "cascade" }),
  gcsObjectName: text("gcs_object_name").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  fileExtension: text("file_extension").notNull(),
  sizeBytes: integer("size_bytes"),
  durationSeconds: integer("duration_seconds"),
  browserName: text("browser_name"),
  browserVersion: text("browser_version"),
  finalizedAt: timestamp("finalized_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const uploadSessions = pgTable("upload_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => questionAttempts.id, { onDelete: "cascade" }),
  gcsObjectName: text("gcs_object_name").notNull(),
  sessionUriHash: text("session_uri_hash").notNull(),
  status: uploadStatus("status").notNull().default("created"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  finalizedAt: timestamp("finalized_at", { withTimezone: true }),
});

export const responseReviews = pgTable("response_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  responseId: uuid("response_id")
    .notNull()
    .references(() => questionResponses.id, { onDelete: "cascade" }),
  reviewerUserId: text("reviewer_user_id").references(() => user.id, { onDelete: "set null" }),
  score: integer("score"),
  notes: text("notes"),
  reviewed: boolean("reviewed").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessmentReviews = pgTable("assessment_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  reviewerUserId: text("reviewer_user_id").references(() => user.id, { onDelete: "set null" }),
  overallScore: numeric("overall_score", { precision: 5, scale: 2 }),
  summaryNotes: text("summary_notes"),
  markedReviewedAt: timestamp("marked_reviewed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
