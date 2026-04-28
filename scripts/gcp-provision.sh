#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-geniuslab-494619}"
REGION="${REGION:-us-west1}"
SERVICE_NAME="${SERVICE_NAME:-geniuslab-video}"
ARTIFACT_REPO="${ARTIFACT_REPO:-geniuslab}"
BUCKET_NAME="${GCS_BUCKET:-geniuslab-494619-geniuslab-videos}"
RUNTIME_SA="${RUNTIME_SA:-geniuslab-video-runner}"
RUNTIME_SA_EMAIL="${RUNTIME_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "${PROJECT_ID}"

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com \
  iamcredentials.googleapis.com \
  --project="${PROJECT_ID}"

gcloud artifacts repositories describe "${ARTIFACT_REPO}" --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "${ARTIFACT_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Geniuslab Cloud Run images" \
    --project="${PROJECT_ID}"

gcloud iam service-accounts describe "${RUNTIME_SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1 || \
  gcloud iam service-accounts create "${RUNTIME_SA}" \
    --display-name="Geniuslab Video Cloud Run runtime" \
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
gsutil iam ch "serviceAccount:${RUNTIME_SA_EMAIL}:objectAdmin" "gs://${BUCKET_NAME}"

gcloud iam service-accounts add-iam-policy-binding "${RUNTIME_SA_EMAIL}" \
  --member="serviceAccount:${RUNTIME_SA_EMAIL}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project="${PROJECT_ID}"

echo "Provisioned ${SERVICE_NAME} prerequisites in ${PROJECT_ID}."
