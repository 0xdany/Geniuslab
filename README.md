# Geniuslab Video Assessment Platform

Full-stack video assessment platform for API-triggered and manually created candidate assessments.

Deployment target: Vercel for the Next.js app, with Google Cloud Storage retained for private video storage.

Deployment URL: https://geniuslab-dany.vercel.app/

## Stack

- Next.js 16 App Router, React 19, TypeScript, npm
- Better Auth with Google OAuth for admins
- Neon PostgreSQL with Drizzle ORM
- Google Cloud Storage for private video files
- Resend + React Email for invitation and completion emails
- Vercel hosting for the Next.js app
- Google Cloud project `geniuslab-494619` only for private video storage

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Required env vars are documented below and in `.env.example`. The first admin is bootstrapped from `INITIAL_ADMIN_EMAIL` when that Google account signs in.
See [`docs/admin-access.md`](docs/admin-access.md) for adding more admin emails after bootstrap.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Canonical public app origin used for auth callbacks, candidate links, emails, and signed upload CORS. Local fallback is `http://localhost:3000`. |
| `DATABASE_URL` | Neon PostgreSQL connection string. |
| `BETTER_AUTH_SECRET` | Random secret for Better Auth sessions. Generate with `openssl rand -base64 32`. |
| `INITIAL_ADMIN_EMAIL` | Google account that becomes the first admin. |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret. |
| `GCP_PROJECT_ID` | GCP project id, currently `geniuslab-494619`. |
| `GCP_LOCATION` | GCP region for the video worker Cloud Run Job. Defaults to `us-west1`. |
| `GCS_BUCKET` | Private video bucket, currently `geniuslab-494619-geniuslab-videos`. |
| `GOOGLE_SIGNING_SERVICE_ACCOUNT` | Service account used for signed GCS URLs. |
| `GCP_SERVICE_ACCOUNT_JSON` | Full or base64-encoded service account JSON for Vercel to access/sign GCS URLs. |
| `VIDEO_WORKER_JOB_NAME` | Cloud Run Job name used for FFmpeg processing and Drive export. Defaults to `geniuslab-video-worker`. |
| `PROCESSED_VIDEO_PREFIX` | GCS prefix for processed MP4 and thumbnail derivatives. Defaults to `processed`. |
| `GOOGLE_DRIVE_EXPORT_FOLDER_ID` | Google Drive folder ID where completed assessment export folders are created. Share this folder with the service account as Editor. |
| `GOOGLE_DRIVE_CLIENT_ID` | Optional OAuth client ID for exporting into a normal My Drive folder. Falls back to `GOOGLE_CLIENT_ID`. |
| `GOOGLE_DRIVE_CLIENT_SECRET` | Optional OAuth client secret for exporting into a normal My Drive folder. Falls back to `GOOGLE_CLIENT_SECRET`. |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | Optional OAuth refresh token for Drive uploads owned by a real Google user. Required for normal My Drive folders because service accounts have no Drive storage quota. |
| `RESEND_API_KEY` | Resend API key. |
| `EMAIL_FROM` | Verified Resend sender, e.g. `Geniuslab <assessments@reachout.danyraihan.dev>`. |
| `CRON_SECRET` | Bearer token for `/api/cron/expire-assessments`. |

Google OAuth redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://geniuslab-dany.vercel.app/api/auth/callback/google
```

Add a Codespaces callback URL too if using Codespaces:

```text
https://YOUR-CODESPACE-NAME-3000.app.github.dev/api/auth/callback/google
```

## Database Setup

Create a Neon database, set `DATABASE_URL`, then run:

```bash
npm run db:generate
npm run db:migrate
```

Seed demo data:

```bash
npm run db:seed
```

The seed creates 15 assessments across invited, in-progress, completed, reviewed, and expired states. For playable review
videos, complete one seeded or newly created assessment through the candidate flow so real private GCS objects are created
for the review and download screens.

Remove only seeded demo data:

```bash
psql "$DATABASE_URL" -f sql/remove-demo-data.sql
```

## Core Flows

- Admin creates API keys and manual one-off assessments.
- External systems call `POST /api/v1/assessments/trigger`.
- Candidates open secure links, pass desktop/device checks, verify camera/mic, and record questions one at a time.
- Question text is returned only from `/api/candidate/questions/start`.
- Recordings are chunked into IndexedDB during capture and uploaded through GCS resumable upload sessions.
- Admins review completed assessments, score responses, add notes, and download individual or zipped videos.
- External systems retrieve completed videos through signed temporary URLs.

## Deployment

Host the Next.js application on Vercel. Keep Neon for PostgreSQL and Google Cloud Storage for private video objects.

Set all variables from `.env.example` in Vercel Project Settings. On Vercel:

- `APP_URL` must be your Vercel URL, for example `https://geniuslab-dany.vercel.app`.
- Add the Vercel OAuth callback URL in Google Cloud Console.
- Add the Vercel origin to `gcs-cors.json`, then apply it to the bucket.
- Set `GCP_SERVICE_ACCOUNT_JSON` to a service account JSON with access to the video bucket.
- Set the video worker and Drive export variables if using optional integrations.
- If Vercel env vars are changed after a deployment, trigger a fresh production redeploy.

See [`docs/gcp-storage.md`](docs/gcp-storage.md) for storage-only GCP setup.

### Optional Video Worker And Drive Export

The optional processing/export flow keeps heavy work out of Vercel. The admin app creates DB job rows and invokes a Cloud Run Job; the worker runs FFmpeg, writes processed GCS assets, and can export processed videos to Google Drive.

Enable the Drive API:

```bash
gcloud services enable drive.googleapis.com --project=geniuslab-494619
```

For a Workspace Shared Drive, create or choose a folder, copy its folder ID from the URL, and share it with the service account email from `GOOGLE_SIGNING_SERVICE_ACCOUNT` as Editor. Set that ID as `GOOGLE_DRIVE_EXPORT_FOLDER_ID`.

For a normal My Drive folder, use Google OAuth instead. Set `GOOGLE_DRIVE_REFRESH_TOKEN` plus `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET` so the worker uploads as that Google user; service accounts cannot own files in My Drive because they have no Drive storage quota.

Build and deploy the worker image:

```bash
gcloud builds submit \
  --config worker/video/cloudbuild.yaml \
  --substitutions _IMAGE=us-west1-docker.pkg.dev/geniuslab-494619/geniuslab/geniuslab-video-worker \
  --project=geniuslab-494619

gcloud run jobs create geniuslab-video-worker \
  --image us-west1-docker.pkg.dev/geniuslab-494619/geniuslab/geniuslab-video-worker \
  --region us-west1 \
  --project=geniuslab-494619 \
  --set-env-vars GCP_PROJECT_ID=geniuslab-494619,GCP_LOCATION=us-west1,GCS_BUCKET=geniuslab-494619-geniuslab-videos,PROCESSED_VIDEO_PREFIX=processed,GOOGLE_DRIVE_EXPORT_FOLDER_ID=YOUR_DRIVE_FOLDER_ID \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,GCP_SERVICE_ACCOUNT_JSON=GCP_SERVICE_ACCOUNT_JSON:latest
```

If you are not using Secret Manager, set `DATABASE_URL` and `GCP_SERVICE_ACCOUNT_JSON` using your deployment mechanism for Cloud Run Jobs. Grant the Vercel/app service account permission to run the Cloud Run Job, and grant the worker service account access to the video bucket and target Drive folder.

YouTube upload is intentionally deferred. The processed MP4 assets created here are the right source for a future YouTube export if that becomes worth the OAuth, quota, and policy overhead.

## API Docs

See [`docs/api.md`](docs/api.md).

## Admin Access

See [`docs/admin-access.md`](docs/admin-access.md) for first-admin setup and inviting additional admin emails.

## Demo

See [`docs/demo-script.md`](docs/demo-script.md).

## GitHub Codespaces

This repo includes `.devcontainer/devcontainer.json` for Codespaces.

The devcontainer uses `mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm`. Node 22 is intentionally used because it is available as a Codespaces devcontainer image and satisfies the app/runtime requirements.

1. Create a Codespace from the repository.
2. Add the values from `.env.example` as Codespaces repository secrets, or create `.env` inside the Codespace.
3. Run:

   ```bash
   npm install
   npm run db:migrate
   npm run dev
   ```

4. Open forwarded port `3000`.
5. Add the forwarded Codespaces URL to Google OAuth redirect URIs.
6. Add the forwarded Codespaces origin to `gcs-cors.json`, then run:

   ```bash
   gsutil cors set gcs-cors.json gs://geniuslab-494619-geniuslab-videos
   ```

Codespaces URLs are unique per Codespace. The Vercel deployment is the preferred review URL; Codespaces is included to prove reproducible local setup.

## Verification

```bash
npm run lint
npm test
npm run build
```

Additional checklists:

- [`docs/qa-checklist.md`](docs/qa-checklist.md)
- [`docs/technical-overview-script.md`](docs/technical-overview-script.md)

## GCP Storage Cleanup

```bash
gsutil rm -r gs://geniuslab-494619-geniuslab-videos
gcloud iam service-accounts delete geniuslab-video-storage@geniuslab-494619.iam.gserviceaccount.com --project=geniuslab-494619
```
