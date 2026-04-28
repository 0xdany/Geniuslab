import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const emailStatus = pgEnum("email_status", ["sent", "failed"]);
export const emailKind = pgEnum("email_kind", ["invitation", "completion"]);

export const emailMessages = pgTable("email_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id"),
  kind: emailKind("kind").notNull(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  providerMessageId: text("provider_message_id"),
  status: emailStatus("status").notNull(),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
