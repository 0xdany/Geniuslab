# Geniuslab Video Assessment Platform

Full-stack video assessment platform for API-triggered and manually created candidate assessments.

Deployment target: Vercel for the Next.js app, with Google Cloud Storage retained for private video storage.

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

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Public app origin. Local default is `http://localhost:3000`. |
| `BETTER_AUTH_URL` | Auth callback origin. Usually same as `APP_URL`. |
| `DATABASE_URL` | Neon PostgreSQL connection string. |
| `BETTER_AUTH_SECRET` | Random secret for Better Auth sessions. Generate with `openssl rand -base64 32`. |
| `INITIAL_ADMIN_EMAIL` | Google account that becomes the first admin. |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret. |
| `GCP_PROJECT_ID` | GCP project id, currently `geniuslab-494619`. |
| `GCS_BUCKET` | Private video bucket, currently `geniuslab-494619-geniuslab-videos`. |
| `GOOGLE_SIGNING_SERVICE_ACCOUNT` | Service account used for signed GCS URLs. |
| `GCP_SERVICE_ACCOUNT_JSON` | Full or base64-encoded service account JSON for Vercel to access/sign GCS URLs. |
| `RESEND_API_KEY` | Resend API key. |
| `EMAIL_FROM` | Verified Resend sender, e.g. `Geniuslab <assessments@reachout.danyraihan.dev>`. |
| `CRON_SECRET` | Bearer token for `/api/cron/expire-assessments`. |

Google OAuth redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/callback/google
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

- `APP_URL` and `BETTER_AUTH_URL` must be your Vercel URL.
- Add the Vercel OAuth callback URL in Google Cloud Console.
- Add the Vercel origin to `gcs-cors.json`, then apply it to the bucket.
- Set `GCP_SERVICE_ACCOUNT_JSON` to a service account JSON with access to the video bucket.

See [`docs/gcp-storage.md`](docs/gcp-storage.md) for storage-only GCP setup.

## API Docs

See [`docs/api.md`](docs/api.md).

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
