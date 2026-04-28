# GCP Storage Setup

The app is hosted on Vercel. GCP is used only for private video storage in Google Cloud Storage.

## Resources

- Project: `geniuslab-494619`
- Bucket: `geniuslab-494619-geniuslab-videos`
- Service account: `geniuslab-video-storage@geniuslab-494619.iam.gserviceaccount.com`

## Provision Storage

```bash
PROJECT_ID=geniuslab-494619
REGION=us-west1
BUCKET_NAME=geniuslab-494619-geniuslab-videos
STORAGE_SA=geniuslab-video-storage
STORAGE_SA_EMAIL="${STORAGE_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "${PROJECT_ID}"

gcloud services enable \
  storage.googleapis.com \
  iamcredentials.googleapis.com \
  --project="${PROJECT_ID}"

gcloud iam service-accounts create "${STORAGE_SA}" \
  --display-name="Geniuslab Video Storage" \
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
gsutil iam ch "serviceAccount:${STORAGE_SA_EMAIL}:objectAdmin" "gs://${BUCKET_NAME}"
```

If a resource already exists, skip that create command and continue with IAM/CORS.

## Vercel Credential

Vercel needs service account credentials because it is not running inside GCP.

Create a key:

```bash
gcloud iam service-accounts keys create ./geniuslab-video-storage-key.json \
  --iam-account="geniuslab-video-storage@geniuslab-494619.iam.gserviceaccount.com" \
  --project=geniuslab-494619
```

Add the JSON content to Vercel as:

```text
GCP_SERVICE_ACCOUNT_JSON
```

Also set:

```text
GCP_PROJECT_ID=geniuslab-494619
GCS_BUCKET=geniuslab-494619-geniuslab-videos
GOOGLE_SIGNING_SERVICE_ACCOUNT=geniuslab-video-storage@geniuslab-494619.iam.gserviceaccount.com
```

After adding the secret to Vercel, delete the local key file:

```bash
rm ./geniuslab-video-storage-key.json
```

## CORS For Vercel

Add your Vercel origin to `gcs-cors.json`, for example:

```json
"origin": [
  "http://localhost:3000",
  "https://your-app.vercel.app"
]
```

Then apply:

```bash
gsutil cors set gcs-cors.json gs://geniuslab-494619-geniuslab-videos
```

## What Is Not Used

This project no longer uses Cloud Run, Cloud Build, Artifact Registry, Cloud SQL, Compute Engine, GKE, Cloud CDN, or a load balancer.
