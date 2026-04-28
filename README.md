# Geniuslab Video Assessment Platform

Full-stack video assessment platform for API-triggered and manually created candidate assessments.

Deployed demo: `https://geniuslab-video-278560556951.us-west1.run.app`

## Stack

- Next.js 16 App Router, React 19, TypeScript, npm
- Better Auth with Google OAuth for admins
- Neon PostgreSQL with Drizzle ORM
- Google Cloud Storage for private video files
- Resend + React Email for invitation and completion emails
- Cloud Run serverless deployment in GCP project `geniuslab-494619`

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Required env vars are documented in `.env.example`. The first admin is bootstrapped from `INITIAL_ADMIN_EMAIL` when that Google account signs in.

## Core Flows

- Admin creates API keys and manual one-off assessments.
- External systems call `POST /api/v1/assessments/trigger`.
- Candidates open secure links, pass desktop/device checks, verify camera/mic, and record questions one at a time.
- Question text is returned only from `/api/candidate/questions/start`.
- Recordings are chunked into IndexedDB during capture and uploaded through GCS resumable upload sessions.
- Admins review completed assessments, score responses, add notes, and download individual or zipped videos.
- External systems retrieve completed videos through signed temporary URLs.

## GCP Low-Cost Deployment

See [`docs/gcp-provisioning.md`](docs/gcp-provisioning.md). The deployment uses Cloud Run with `min-instances=0`, `max-instances=3`, private regional GCS storage, and no Cloud SQL, GKE, VM, CDN, load balancer, VPC connector, or scheduler requirement.

## API Docs

See [`docs/api.md`](docs/api.md).

## Demo

See [`docs/demo-script.md`](docs/demo-script.md).

## Cleanup

```bash
gcloud run services delete geniuslab-video --region=us-west1 --project=geniuslab-494619
gcloud artifacts repositories delete geniuslab --location=us-west1 --project=geniuslab-494619
gcloud storage rm -r gs://geniuslab-494619-geniuslab-videos
gcloud iam service-accounts delete geniuslab-video-runner@geniuslab-494619.iam.gserviceaccount.com --project=geniuslab-494619
```
