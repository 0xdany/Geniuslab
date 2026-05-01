import { createReadStream, statSync } from "node:fs";
import { and, desc, eq, inArray } from "drizzle-orm";
import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { db } from "@/db/client";
import {
  assessments,
  candidates,
  driveExportFiles,
  driveExportJobs,
  processedVideoAssets,
} from "@/db/schema";
import { gcpProjectId, googleDriveExportFolderId } from "@/lib/env";
import { videoDownloadName } from "@/lib/downloads";
import { slugify } from "@/lib/ids";

let driveAuth: GoogleAuth | null = null;
let driveOAuthClient: OAuth2Client | null = null;

export type DriveExportMetadata = {
  assessment: {
    id: string;
    title: string;
    submittedAt?: string;
  };
  candidate: {
    id?: string;
    name: string;
    email: string;
  };
  videos: Array<{
    questionNumber: number;
    questionText: string;
    processedAssetId: string;
    videoObjectId: string;
    filename: string;
    thumbnailFilename: string;
    durationSeconds?: number | null;
  }>;
  exportedAt: string;
};

export async function ensureDriveExportJob(params: { assessmentId: string; createdByUserId: string }) {
  const targetParentFolderId = googleDriveExportFolderId();
  if (!targetParentFolderId) {
    throw new Error("GOOGLE_DRIVE_EXPORT_FOLDER_ID is required for Drive export.");
  }

  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, params.assessmentId)).limit(1);
  if (!assessment) throw new Error("Assessment was not found.");
  if (!["completed", "reviewed"].includes(assessment.status)) {
    throw new Error("Only completed or reviewed assessments can be exported.");
  }

  const [existing] = await db
    .select()
    .from(driveExportJobs)
    .where(and(eq(driveExportJobs.assessmentId, params.assessmentId), inArray(driveExportJobs.status, ["queued", "exporting", "completed"])))
    .orderBy(desc(driveExportJobs.createdAt))
    .limit(1);
  if (existing) return existing;

  const [job] = await db
    .insert(driveExportJobs)
    .values({
      assessmentId: params.assessmentId,
      targetParentFolderId,
      createdByUserId: params.createdByUserId,
      status: "queued",
    })
    .returning();
  return job;
}

export async function getLatestDriveExportJob(assessmentId: string) {
  const [job] = await db
    .select()
    .from(driveExportJobs)
    .where(eq(driveExportJobs.assessmentId, assessmentId))
    .orderBy(desc(driveExportJobs.createdAt))
    .limit(1);
  return job ?? null;
}

export async function claimDriveExportJob(jobId: string) {
  const [job] = await db.select().from(driveExportJobs).where(eq(driveExportJobs.id, jobId)).limit(1);
  if (!job) throw new Error("Drive export job was not found.");
  if (job.status === "completed") return job;
  await db
    .update(driveExportJobs)
    .set({ status: "exporting", startedAt: new Date(), errorMessage: null, updatedAt: new Date() })
    .where(eq(driveExportJobs.id, jobId));
  return { ...job, status: "exporting" as const };
}

export async function markDriveExportCompleted(params: { jobId: string; driveFolderId: string; driveFolderUrl?: string }) {
  await db
    .update(driveExportJobs)
    .set({
      status: "completed",
      driveFolderId: params.driveFolderId,
      driveFolderUrl: params.driveFolderUrl,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(driveExportJobs.id, params.jobId));
}

export async function markDriveExportFailed(jobId: string, errorMessage: string) {
  await db
    .update(driveExportJobs)
    .set({ status: "failed", errorMessage, completedAt: new Date(), updatedAt: new Date() })
    .where(eq(driveExportJobs.id, jobId));
}

export async function recordDriveExportFile(params: {
  exportJobId: string;
  processedAssetId?: string | null;
  kind: "video" | "thumbnail" | "metadata";
  filename: string;
  driveFileId: string;
  driveWebUrl?: string;
  mimeType: string;
  sizeBytes?: number;
}) {
  await db
    .insert(driveExportFiles)
    .values({
      exportJobId: params.exportJobId,
      processedAssetId: params.processedAssetId,
      kind: params.kind,
      filename: params.filename,
      driveFileId: params.driveFileId,
      driveWebUrl: params.driveWebUrl,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
    })
    .onConflictDoNothing();
}

export async function createDriveFolder(name: string, parentFolderId: string) {
  const response = await driveFetch("https://www.googleapis.com/drive/v3/files?fields=id,webViewLink&supportsAllDrives=true", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    }),
  });
  return await response.json() as { id: string; webViewLink?: string };
}

export async function uploadPathToDrive(params: {
  filePath: string;
  filename: string;
  mimeType: string;
  parentFolderId: string;
}) {
  const sizeBytes = statSync(params.filePath).size;
  const sessionUrl = await createDriveUploadSession(params.filename, params.mimeType, sizeBytes, params.parentFolderId);
  const response = await driveFetch(sessionUrl, {
    method: "PUT",
    headers: {
      "content-length": String(sizeBytes),
      "content-type": params.mimeType,
    },
    body: createReadStream(params.filePath),
    duplex: "half",
  } as unknown as RequestInit & { duplex: "half" });
  const uploaded = await response.json() as { id: string; webViewLink?: string };
  return { ...uploaded, sizeBytes };
}

export async function uploadJsonToDrive(params: {
  filename: string;
  parentFolderId: string;
  value: unknown;
}) {
  const buffer = Buffer.from(JSON.stringify(params.value, null, 2));
  const sessionUrl = await createDriveUploadSession(params.filename, "application/json", buffer.byteLength, params.parentFolderId);
  const response = await driveFetch(sessionUrl, {
    method: "PUT",
    headers: {
      "content-length": String(buffer.byteLength),
      "content-type": "application/json",
    },
    body: buffer,
  });
  const uploaded = await response.json() as { id: string; webViewLink?: string };
  return { ...uploaded, sizeBytes: buffer.byteLength };
}

export async function getDriveExportContext(assessmentId: string) {
  const [row] = await db
    .select({
      assessmentId: assessments.id,
      assessmentTitle: assessments.title,
      submittedAt: assessments.submittedAt,
      candidateExternalId: candidates.externalId,
      candidateName: candidates.name,
      candidateEmail: candidates.email,
    })
    .from(assessments)
    .innerJoin(candidates, eq(candidates.id, assessments.candidateId))
    .where(eq(assessments.id, assessmentId))
    .limit(1);
  if (!row) throw new Error("Assessment was not found.");
  return row;
}

export function driveAssessmentFolderName(candidateName: string, assessmentTitle: string) {
  return `${slugify(candidateName)}_${slugify(assessmentTitle)}`;
}

export function processedVideoExportName(candidateName: string, assessmentTitle: string, questionNumber: number) {
  return videoDownloadName(candidateName, assessmentTitle, questionNumber, "mp4");
}

export function processedThumbnailExportName(candidateName: string, assessmentTitle: string, questionNumber: number) {
  return `${slugify(candidateName)}_${slugify(assessmentTitle)}_Q${questionNumber}_thumbnail.jpg`;
}

export async function assertProcessedAssetsReady(assessmentId: string) {
  const rows = await db
    .select({ id: processedVideoAssets.id })
    .from(processedVideoAssets)
    .where(and(eq(processedVideoAssets.assessmentId, assessmentId), eq(processedVideoAssets.status, "ready")));
  const [assessment] = await db.select({ id: assessments.id }).from(assessments).where(eq(assessments.id, assessmentId)).limit(1);
  if (!assessment) throw new Error("Assessment was not found.");
  if (rows.length === 0) throw new Error("Process videos before exporting to Drive.");
}

async function createDriveUploadSession(filename: string, mimeType: string, sizeBytes: number, parentFolderId: string) {
  const response = await driveFetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "x-upload-content-type": mimeType,
        "x-upload-content-length": String(sizeBytes),
      },
      body: JSON.stringify({
        name: filename,
        mimeType,
        parents: [parentFolderId],
      }),
    },
  );
  const location = response.headers.get("location");
  if (!location) throw new Error("Drive did not return a resumable upload session URL.");
  return location;
}

async function driveFetch(url: string, init: RequestInit) {
  const client = await getDriveClient();
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) throw new Error("Could not obtain Google Drive access token.");
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      authorization: `Bearer ${accessToken.token}`,
      "x-goog-user-project": gcpProjectId(),
    },
  });
  if (!response.ok) {
    throw new Error(`Google Drive request failed with ${response.status}: ${await response.text()}`);
  }
  return response;
}

async function getDriveClient() {
  const oauthClient = getDriveOAuthClient();
  if (oauthClient) return oauthClient;
  return getDriveAuth().getClient();
}

function getDriveOAuthClient() {
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  if (!refreshToken) return null;
  driveOAuthClient ??= new OAuth2Client({
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  });
  driveOAuthClient.setCredentials({ refresh_token: refreshToken });
  return driveOAuthClient;
}

function getDriveAuth() {
  driveAuth ??= new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive.file"],
    credentials: getServiceAccountCredentials(),
  });
  return driveAuth;
}

type ServiceAccountCredentials = {
  client_email?: string;
  private_key?: string;
};

function getServiceAccountCredentials(): ServiceAccountCredentials | undefined {
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const json = trimmed.startsWith("{") ? trimmed : Buffer.from(trimmed, "base64").toString("utf8");
  return JSON.parse(json) as ServiceAccountCredentials;
}
