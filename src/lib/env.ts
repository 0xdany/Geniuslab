export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function appUrl() {
  return withProtocol(
    process.env.APP_URL
      || process.env.VERCEL_PROJECT_PRODUCTION_URL
      || process.env.VERCEL_URL
      || "http://localhost:3000",
  );
}

function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export const gcpProjectId = () => process.env.GCP_PROJECT_ID || "geniuslab-494619";
export const gcsBucketName = () => process.env.GCS_BUCKET || "geniuslab-494619-geniuslab-videos";
export const emailFrom = () => process.env.EMAIL_FROM || "Geniuslab <assessments@reachout.danyraihan.dev>";
