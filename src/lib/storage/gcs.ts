import { Storage } from "@google-cloud/storage";
import { GoogleAuth } from "google-auth-library";
import { gcpProjectId, gcsBucketName } from "@/lib/env";

let storage: Storage | null = null;
let auth: GoogleAuth | null = null;

type ServiceAccountCredentials = {
  client_email?: string;
  private_key?: string;
};

export function getStorage() {
  const credentials = getServiceAccountCredentials();
  storage ??= new Storage({
    projectId: gcpProjectId(),
    credentials,
  });
  return storage;
}

export function getVideoBucket() {
  return getStorage().bucket(gcsBucketName());
}

export async function createResumableUploadSession(objectName: string, contentType: string, metadata: Record<string, string>) {
  const file = getVideoBucket().file(objectName);
  const [uri] = await file.createResumableUpload({
    origin: process.env.APP_URL || "http://localhost:3000",
    metadata: {
      contentType,
      metadata,
    },
  });
  return uri;
}

export async function getSignedReadUrl(objectName: string, expiresInSeconds: number, responseDisposition?: string) {
  const expires = Date.now() + expiresInSeconds * 1000;
  const file = getVideoBucket().file(objectName);
  const url = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires,
    responseDisposition,
  }).then(([signedUrl]) => signedUrl).catch((error) => {
    if (error instanceof Error && error.message.includes("client_email")) {
      return getIamSignedReadUrl(objectName, expires, responseDisposition);
    }
    throw error;
  });
  return { url, expiresAt: new Date(expires).toISOString() };
}

export async function verifyGcsObject(objectName: string) {
  const file = getVideoBucket().file(objectName);
  const [exists] = await file.exists();
  if (!exists) return null;
  const [metadata] = await file.getMetadata();
  return {
    sizeBytes: Number(metadata.size ?? 0),
    contentType: metadata.contentType || "application/octet-stream",
    generation: metadata.generation,
  };
}

async function getIamSignedReadUrl(objectName: string, expires: number, responseDisposition?: string) {
  const credentials = getServiceAccountCredentials();
  auth ??= new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    credentials,
    projectId: gcpProjectId(),
  });
  const client = await auth.getClient();
  const serviceAccountEmail = await auth.getCredentials().then((credentials) => credentials.client_email)
    || process.env.GOOGLE_SIGNING_SERVICE_ACCOUNT
    || credentials?.client_email
    || `geniuslab-video-storage@${gcpProjectId()}.iam.gserviceaccount.com`;
  const now = new Date();
  const datestamp = formatDate(now).slice(0, 8);
  const timestamp = formatDate(now);
  const credentialScope = `${datestamp}/auto/storage/goog4_request`;
  const credential = `${serviceAccountEmail}/${credentialScope}`;
  const encodedObject = objectName.split("/").map(encodeURIComponent).join("/");
  const host = "storage.googleapis.com";
  const query = new URLSearchParams({
    "X-Goog-Algorithm": "GOOG4-RSA-SHA256",
    "X-Goog-Credential": credential,
    "X-Goog-Date": timestamp,
    "X-Goog-Expires": String(Math.max(1, Math.floor((expires - Date.now()) / 1000))),
    "X-Goog-SignedHeaders": "host",
  });
  if (responseDisposition) query.set("response-content-disposition", responseDisposition);

  const canonicalQuery = [...query.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  const canonicalRequest = [
    "GET",
    `/${gcsBucketName()}/${encodedObject}`,
    canonicalQuery,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "GOOG4-RSA-SHA256",
    timestamp,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");
  const accessToken = await client.getAccessToken();
  const response = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(serviceAccountEmail)}:signBlob`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ payload: Buffer.from(stringToSign).toString("base64") }),
    },
  );
  if (!response.ok) {
    throw new Error(`IAM signBlob failed with ${response.status}: ${await response.text()}`);
  }
  const signed = await response.json() as { signedBlob: string };
  query.set("X-Goog-Signature", Buffer.from(signed.signedBlob, "base64").toString("hex"));
  return `https://${host}/${gcsBucketName()}/${encodedObject}?${query.toString()}`;
}

function formatDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hash).toString("hex");
}

function getServiceAccountCredentials(): ServiceAccountCredentials | undefined {
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return undefined;
  const parsed = parseJsonSecret(raw);
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GCP_SERVICE_ACCOUNT_JSON must include client_email and private_key.");
  }
  return parsed;
}

function parseJsonSecret(raw: string): ServiceAccountCredentials {
  const trimmed = raw.trim();
  const json = trimmed.startsWith("{") ? trimmed : Buffer.from(trimmed, "base64").toString("utf8");
  return JSON.parse(json) as ServiceAccountCredentials;
}
