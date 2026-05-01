CREATE TYPE "public"."drive_export_file_kind" AS ENUM('video', 'thumbnail', 'metadata');--> statement-breakpoint
CREATE TYPE "public"."drive_export_status" AS ENUM('queued', 'exporting', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."processed_asset_status" AS ENUM('processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."processing_job_status" AS ENUM('queued', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "drive_export_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"export_job_id" uuid NOT NULL,
	"processed_asset_id" uuid,
	"kind" "drive_export_file_kind" NOT NULL,
	"filename" text NOT NULL,
	"drive_file_id" text NOT NULL,
	"drive_web_url" text,
	"mime_type" text NOT NULL,
	"size_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drive_export_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"status" "drive_export_status" DEFAULT 'queued' NOT NULL,
	"target_parent_folder_id" text NOT NULL,
	"drive_folder_id" text,
	"drive_folder_url" text,
	"created_by_user_id" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_video_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"video_object_id" uuid NOT NULL,
	"processing_job_id" uuid,
	"status" "processed_asset_status" DEFAULT 'processing' NOT NULL,
	"mp4_object_name" text,
	"thumbnail_object_name" text,
	"mp4_size_bytes" integer,
	"thumbnail_size_bytes" integer,
	"duration_seconds" integer,
	"metadata" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_processing_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"video_object_id" uuid NOT NULL,
	"status" "processing_job_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drive_export_files" ADD CONSTRAINT "drive_export_files_export_job_id_drive_export_jobs_id_fk" FOREIGN KEY ("export_job_id") REFERENCES "public"."drive_export_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_export_files" ADD CONSTRAINT "drive_export_files_processed_asset_id_processed_video_assets_id_fk" FOREIGN KEY ("processed_asset_id") REFERENCES "public"."processed_video_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_export_jobs" ADD CONSTRAINT "drive_export_jobs_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_export_jobs" ADD CONSTRAINT "drive_export_jobs_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_video_assets" ADD CONSTRAINT "processed_video_assets_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_video_assets" ADD CONSTRAINT "processed_video_assets_video_object_id_video_objects_id_fk" FOREIGN KEY ("video_object_id") REFERENCES "public"."video_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_video_assets" ADD CONSTRAINT "processed_video_assets_processing_job_id_video_processing_jobs_id_fk" FOREIGN KEY ("processing_job_id") REFERENCES "public"."video_processing_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_processing_jobs" ADD CONSTRAINT "video_processing_jobs_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_processing_jobs" ADD CONSTRAINT "video_processing_jobs_video_object_id_video_objects_id_fk" FOREIGN KEY ("video_object_id") REFERENCES "public"."video_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drive_export_files_job_idx" ON "drive_export_files" USING btree ("export_job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "drive_export_files_job_file_idx" ON "drive_export_files" USING btree ("export_job_id","filename");--> statement-breakpoint
CREATE INDEX "drive_export_jobs_assessment_idx" ON "drive_export_jobs" USING btree ("assessment_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "processed_video_assets_video_object_idx" ON "processed_video_assets" USING btree ("video_object_id");--> statement-breakpoint
CREATE INDEX "processed_video_assets_assessment_idx" ON "processed_video_assets" USING btree ("assessment_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "video_processing_jobs_video_object_idx" ON "video_processing_jobs" USING btree ("video_object_id");--> statement-breakpoint
CREATE INDEX "video_processing_jobs_assessment_idx" ON "video_processing_jobs" USING btree ("assessment_id","status");