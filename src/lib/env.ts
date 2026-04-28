export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function appUrl() {
  return process.env.APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

export const gcpProjectId = () => process.env.GCP_PROJECT_ID || "geniuslab-494619";
export const gcsBucketName = () => process.env.GCS_BUCKET || "geniuslab-494619-geniuslab-videos";
export const emailFrom = () => process.env.EMAIL_FROM || "Geniuslab <assessments@reachout.danyraihan.dev>";
