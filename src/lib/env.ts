export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function appUrl() {
  const candidates = [
    process.env.APP_URL,
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  if (process.env.NODE_ENV === "production") {
    const productionUrl = candidates.find((value) => value && !isLocalhostUrl(value));
    if (productionUrl) return withProtocol(productionUrl);
  }

  return withProtocol(candidates.find(Boolean) || "http://localhost:3000");
}

function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function isLocalhostUrl(value: string) {
  try {
    const url = new URL(withProtocol(value));
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  } catch {
    return false;
  }
}

export const gcpProjectId = () => process.env.GCP_PROJECT_ID || "geniuslab-494619";
export const gcsBucketName = () => process.env.GCS_BUCKET || "geniuslab-494619-geniuslab-videos";
export const emailFrom = () => process.env.EMAIL_FROM || "Geniuslab <assessments@reachout.danyraihan.dev>";
