# Architecture

The platform stores each assessment per candidate. There are no reusable question templates; every API or manual assessment creates its own question rows. This keeps the downstream integration simple and preserves the exact questions sent by upstream hiring systems.

## Auth

- Admins authenticate with Google OAuth through Better Auth.
- The first admin is bootstrapped by `INITIAL_ADMIN_EMAIL`.
- Candidates do not have accounts. They exchange an unguessable assessment token for an httpOnly candidate session cookie.
- External systems authenticate with hashed API keys.

## Recording

The landing page never includes question text. The candidate clicks `Start Question`, the server validates sequence and attempts, then returns exactly one question. The client immediately starts MediaRecorder and reveals the question in the same state transition.

MediaRecorder prefers MP4/H.264-compatible formats when the browser supports them, then falls back to WebM. Files are kept in the original browser-recorded format; no transcoding is required. Recording uses `start(1000)` to persist chunks to IndexedDB, and chunks stay local until the server verifies the uploaded GCS object and finalizes the response.

## Storage

Videos are private GCS objects:

```text
assessments/{assessmentId}/questions/{questionNumber}/attempts/{attemptId}/recording.{ext}
```

Admin playback, downloads, and external retrieval use signed URLs or server-side zip streaming. Admin inline playback URLs are short-lived for page review, while external retrieval URLs use the configurable signed URL TTL. Signed URL values are never written to API request logs.

## Optional Processing And Drive Export

Completed assessments can be processed manually from the admin review page. The Next.js app creates idempotent processing job rows, then invokes a Cloud Run Job. The worker downloads each original GCS recording, runs FFmpeg, and writes additive derivatives back to GCS:

```text
processed/{assessmentId}/{videoObjectId}/playback.mp4
processed/{assessmentId}/{videoObjectId}/thumbnail.jpg
```

The review page prefers processed MP4 playback and thumbnail posters when they are ready, while original recordings remain the download/audit source. Google Drive export is also manual. It requires processed assets, creates one folder under the configured Drive parent folder, uploads MP4s and thumbnails, and writes a `metadata.json` file describing the assessment and question mapping.

## Scaling Notes

Direct browser-to-GCS upload avoids routing large video bodies through Vercel serverless functions. The app handles metadata, auth, signed URLs, and finalization checks. Neon stores relational state. CPU-heavy transcoding and Drive uploads run in Cloud Run Jobs instead of Vercel request handlers. For higher concurrency, queue email retries and introduce lifecycle policies for old video retention.

## API And Auditability

External API requests use bearer API keys. Keys are stored hashed with a visible prefix, can be revoked, and record usage. Intake supports `Idempotency-Key` so upstream systems can retry safely without creating duplicate assessments. API request logs record success and failure outcomes for auditing and are visible in the admin dashboard.

## Email

Resend sends candidate invitation and completion emails from a verified domain. The app records provider acceptance as `sent` and provider/network failures as `failed`, which supports admin retry behavior. Delivery webhooks are intentionally outside the MVP.

## Error Handling

The app includes explicit states for unsupported devices, expired/submitted links, camera or microphone denial, unsupported recorder formats, upload failures with locally preserved chunks, incomplete video retrieval, and signed URL refresh by page reload.
