import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey().default("default"),
  linkExpirationDays: integer("link_expiration_days").notNull().default(7),
  duplicateWindowMinutes: integer("duplicate_window_minutes").notNull().default(10),
  signedUrlTtlMinutes: integer("signed_url_ttl_minutes").notNull().default(60),
  apiRateLimitPerMinute: integer("api_rate_limit_per_minute").notNull().default(60),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
