# GCP Provisioning

This project uses GCP only for serverless compute and private object storage. Keep PostgreSQL in Neon.

```bash
PROJECT_ID=geniuslab-494619
REGION=us-west1
SERVICE_NAME=geniuslab-video
ARTIFACT_REPO=geniuslab
BUCKET_NAME=geniuslab-494619-geniuslab-videos
RUNTIME_SA=geniuslab-video-runner
RUNTIME_SA_EMAIL="${RUNTIME_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "${PROJECT_ID}"

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com \
  iamcredentials.googleapis.com \
  --project="${PROJECT_ID}"

gcloud artifacts repositories create "${ARTIFACT_REPO}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="Geniuslab Cloud Run images" \
  --project="${PROJECT_ID}"

gcloud iam service-accounts create "${RUNTIME_SA}" \
  --display-name="Geniuslab Video Cloud Run runtime" \
  --project="${PROJECT_ID}"

gcloud storage buckets create "gs://${BUCKET_NAME}" \
  --project="${PROJECT_ID}" \
  --location="${REGION}" \
  --default-storage-class=STANDARD \
  --uniform-bucket-level-access \
  --public-access-prevention

tmp=$(mktemp)
printf '{"softDeletePolicy":{"retentionDurationSeconds":"0"}}' > "$tmp"
curl -fsS -X PATCH --data-binary @"$tmp" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}"
rm "$tmp"

gsutil cors set gcs-cors.json "gs://${BUCKET_NAME}"
gsutil iam ch "serviceAccount:${RUNTIME_SA_EMAIL}:objectAdmin" "gs://${BUCKET_NAME}"

gcloud iam service-accounts add-iam-policy-binding "${RUNTIME_SA_EMAIL}" \
  --member="serviceAccount:${RUNTIME_SA_EMAIL}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project="${PROJECT_ID}"
```

Deploy:

```bash
gcloud run deploy geniuslab-video \
  --source . \
  --region=us-west1 \
  --project=geniuslab-494619 \
  --service-account=geniuslab-video-runner@geniuslab-494619.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=3 \
  --cpu=1 \
  --memory=512Mi \
  --timeout=300

SERVICE_URL=$(gcloud run services describe geniuslab-video \
  --region=us-west1 \
  --project=geniuslab-494619 \
  --format='value(status.url)')

gcloud run services update geniuslab-video \
  --region=us-west1 \
  --project=geniuslab-494619 \
  --set-env-vars="APP_URL=${SERVICE_URL},BETTER_AUTH_URL=${SERVICE_URL},GCP_PROJECT_ID=geniuslab-494619,GCS_BUCKET=geniuslab-494619-geniuslab-videos,NODE_ENV=production"
```

Set secrets as Cloud Run environment variables for the demo footprint:

- `APP_URL`
- `BETTER_AUTH_URL`
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `INITIAL_ADMIN_EMAIL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GCP_PROJECT_ID`
- `GCS_BUCKET`
- `GOOGLE_SIGNING_SERVICE_ACCOUNT`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `CRON_SECRET`

Current deployed URL:

```text
https://geniuslab-video-278560556951.us-west1.run.app
```

Cost guardrails: Cloud Run min instances stay at `0`, max instances at `3`, and there is no always-on compute.
