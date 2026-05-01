import { GoogleAuth } from "google-auth-library";
import { gcpLocation, gcpProjectId, videoWorkerJobName } from "@/lib/env";

let auth: GoogleAuth | null = null;

type WorkerMode = "process" | "drive-export";

export async function runVideoWorkerJob(params: {
  mode: WorkerMode;
  assessmentId?: string;
  driveExportJobId?: string;
}) {
  const projectId = gcpProjectId();
  const location = gcpLocation();
  const jobName = videoWorkerJobName();
  const client = await getAuth().getClient();
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) throw new Error("Could not obtain Google Cloud access token.");

  const env = [
    { name: "WORKER_MODE", value: params.mode },
    params.assessmentId ? { name: "ASSESSMENT_ID", value: params.assessmentId } : null,
    params.driveExportJobId ? { name: "DRIVE_EXPORT_JOB_ID", value: params.driveExportJobId } : null,
  ].filter(Boolean);

  const response = await fetch(
    `https://run.googleapis.com/v2/projects/${projectId}/locations/${location}/jobs/${jobName}:run`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        overrides: {
          containerOverrides: [{ env }],
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Cloud Run job invocation failed with ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<{ name?: string }>;
}

function getAuth() {
  auth ??= new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    credentials: getServiceAccountCredentials(),
    projectId: gcpProjectId(),
  });
  return auth;
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
