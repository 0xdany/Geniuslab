import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { assessments, videoObjects } from "./assessments";

export const processingJobStatus = pgEnum("processing_job_status", ["queued", "processing", "ready", "failed"]);
export const processedAssetStatus = pgEnum("processed_asset_status", ["processing", "ready", "failed"]);
export const driveExportStatus = pgEnum("drive_export_status", ["queued", "exporting", "completed", "failed"]);
export const driveExportFileKind = pgEnum("drive_export_file_kind", ["video", "thumbnail", "metadata"]);

export const videoProcessingJobs = pgTable(
  "video_processing_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    videoObjectId: uuid("video_object_id")
      .notNull()
      .references(() => videoObjects.id, { onDelete: "cascade" }),
    status: processingJobStatus("status").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("video_processing_jobs_video_object_idx").on(table.videoObjectId),
    index("video_processing_jobs_assessment_idx").on(table.assessmentId, table.status),
  ],
);

export const processedVideoAssets = pgTable(
  "processed_video_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    videoObjectId: uuid("video_object_id")
      .notNull()
      .references(() => videoObjects.id, { onDelete: "cascade" }),
    processingJobId: uuid("processing_job_id").references(() => videoProcessingJobs.id, { onDelete: "set null" }),
    status: processedAssetStatus("status").notNull().default("processing"),
    mp4ObjectName: text("mp4_object_name"),
    thumbnailObjectName: text("thumbnail_object_name"),
    mp4SizeBytes: integer("mp4_size_bytes"),
    thumbnailSizeBytes: integer("thumbnail_size_bytes"),
    durationSeconds: integer("duration_seconds"),
    metadata: jsonb("metadata"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("processed_video_assets_video_object_idx").on(table.videoObjectId),
    index("processed_video_assets_assessment_idx").on(table.assessmentId, table.status),
  ],
);

export const driveExportJobs = pgTable(
  "drive_export_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    status: driveExportStatus("status").notNull().default("queued"),
    targetParentFolderId: text("target_parent_folder_id").notNull(),
    driveFolderId: text("drive_folder_id"),
    driveFolderUrl: text("drive_folder_url"),
    createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("drive_export_jobs_assessment_idx").on(table.assessmentId, table.status)],
);

export const driveExportFiles = pgTable(
  "drive_export_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exportJobId: uuid("export_job_id")
      .notNull()
      .references(() => driveExportJobs.id, { onDelete: "cascade" }),
    processedAssetId: uuid("processed_asset_id").references(() => processedVideoAssets.id, { onDelete: "set null" }),
    kind: driveExportFileKind("kind").notNull(),
    filename: text("filename").notNull(),
    driveFileId: text("drive_file_id").notNull(),
    driveWebUrl: text("drive_web_url"),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("drive_export_files_job_idx").on(table.exportJobId),
    uniqueIndex("drive_export_files_job_file_idx").on(table.exportJobId, table.filename),
  ],
);
