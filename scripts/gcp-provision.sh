#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-geniuslab-494619}"
REGION="${REGION:-us-west1}"
BUCKET_NAME="${GCS_BUCKET:-geniuslab-494619-geniuslab-videos}"
STORAGE_SA="${STORAGE_SA:-geniuslab-video-storage}"
STORAGE_SA_EMAIL="${STORAGE_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "${PROJECT_ID}"

gcloud services enable \
  storage.googleapis.com \
  iamcredentials.googleapis.com \
  --project="${PROJECT_ID}"

gcloud iam service-accounts describe "${STORAGE_SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1 || \
  gcloud iam service-accounts create "${STORAGE_SA}" \
    --display-name="Geniuslab Video Storage" \
    --project="${PROJECT_ID}"

gcloud storage buckets describe "gs://${BUCKET_NAME}" --project="${PROJECT_ID}" >/dev/null 2>&1 || \
  gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --default-storage-class=STANDARD \
    --uniform-bucket-level-access \
    --public-access-prevention

soft_delete_patch="$(mktemp)"
printf '{"softDeletePolicy":{"retentionDurationSeconds":"0"}}' > "${soft_delete_patch}"
curl -fsS -X PATCH --data-binary @"${soft_delete_patch}" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}" >/dev/null
rm "${soft_delete_patch}"

gsutil cors set gcs-cors.json "gs://${BUCKET_NAME}"
gsutil iam ch "serviceAccount:${STORAGE_SA_EMAIL}:objectAdmin" "gs://${BUCKET_NAME}"

echo "Provisioned GCS video storage in ${PROJECT_ID}."
echo "For Vercel, create a service account key for ${STORAGE_SA_EMAIL} and set GCP_SERVICE_ACCOUNT_JSON."
