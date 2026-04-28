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

Direct browser-to-GCS upload avoids routing large video bodies through Cloud Run. Cloud Run handles metadata, auth, signed URLs, and finalization checks. Neon stores relational state. For higher concurrency, add background processing for transcoding, queue email retries, and introduce lifecycle policies for old video retention.
