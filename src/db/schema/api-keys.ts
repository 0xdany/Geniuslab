import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const apiKeyStatus = pgEnum("api_key_status", ["active", "revoked"]);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    prefix: text("prefix").notNull().unique(),
    keyHash: text("key_hash").notNull().unique(),
    status: apiKeyStatus("status").notNull().default("active"),
    createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("api_keys_prefix_idx").on(table.prefix), index("api_keys_status_idx").on(table.status)],
);

export const apiKeyUsage = pgTable("api_key_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id, { onDelete: "cascade" }),
  route: text("route").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apiIdempotencyKeys = pgTable(
  "api_idempotency_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    apiKeyId: uuid("api_key_id").references(() => apiKeys.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull(),
    requestHash: text("request_hash").notNull(),
    responseBody: jsonb("response_body").notNull(),
    statusCode: integer("status_code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("api_idempotency_lookup_idx").on(table.apiKeyId, table.keyHash),
    index("api_idempotency_created_idx").on(table.createdAt),
  ],
);

export const rateLimitEvents = pgTable(
  "rate_limit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bucketKey: text("bucket_key").notNull(),
    route: text("route").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("rate_limit_bucket_created_idx").on(table.bucketKey, table.createdAt)],
);
