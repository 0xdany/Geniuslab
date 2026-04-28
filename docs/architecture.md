# Architecture

The platform stores each assessment per candidate. There are no reusable question templates; every API or manual assessment creates its own question rows. This keeps the downstream integration simple and preserves the exact questions sent by upstream hiring systems.

## Auth

- Admins authenticate with Google OAuth through Better Auth.
- The first admin is bootstrapped by `INITIAL_ADMIN_EMAIL`.
- Candidates do not have accounts. They exchange an unguessable assessment token for an httpOnly candidate session cookie.
- External systems authenticate with hashed API keys.

## Recording

The landing page never includes question text. The candidate clicks `Start Question`, the server validates sequence and attempts, then returns exactly one question. The client immediately starts MediaRecorder and reveals the question in the same state transition.

MediaRecorder uses MIME fallback and `start(1000)` to persist chunks to IndexedDB. Chunks stay local until the server verifies the uploaded GCS object and finalizes the response.

## Storage

Videos are private GCS objects:

```text
assessments/{assessmentId}/questions/{questionNumber}/attempts/{attemptId}/recording.{ext}
```

Admin playback, downloads, and external retrieval use signed URLs or server-side zip streaming.

## Scaling Notes

Direct browser-to-GCS upload avoids routing large video bodies through Vercel serverless functions. The app handles metadata, auth, signed URLs, and finalization checks. Neon stores relational state. For higher concurrency, add background processing for transcoding, queue email retries, and introduce lifecycle policies for old video retention.

## API And Auditability

External API requests use bearer API keys. Keys are stored hashed with a visible prefix, can be revoked, and record usage. Intake supports `Idempotency-Key` so upstream systems can retry safely without creating duplicate assessments. API request logs record success and failure outcomes for auditing.

## Email

Resend sends candidate invitation and completion emails from a verified domain. The app records provider acceptance as `sent` and provider/network failures as `failed`, which supports admin retry behavior. Delivery webhooks are intentionally outside the MVP.

## Error Handling

The app includes explicit states for unsupported devices, expired/submitted links, camera or microphone denial, unsupported recorder formats, upload failures with locally preserved chunks, incomplete video retrieval, and signed URL refresh by page reload.
