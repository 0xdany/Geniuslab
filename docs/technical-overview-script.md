# Technical Overview Script

Target length: 5-10 minutes.

## Architecture

This is a full-stack Next.js 16 App Router application deployed on Vercel. Neon PostgreSQL stores relational state through Drizzle ORM. Google Cloud Storage stores private video objects. Resend sends invitation and completion emails. Better Auth handles Google OAuth for admins.

The application has three surfaces:

- Admin dashboard for creating, filtering, reviewing, scoring, and downloading assessments.
- Candidate assessment flow for no-login video recording.
- External REST API under `/api/v1` for intake and video retrieval.

## Per-Candidate Assessments

Assessments are stored per candidate rather than as reusable templates. Each intake API call or manual creation stores its own candidate row, assessment row, and question rows. This preserves exactly what the upstream recruitment tool sent and avoids template synchronization logic.

## Recording Pipeline

Question text is never sent with the landing page. The candidate clicks `Start Question`, the server validates sequence and attempts, then returns only the current question. The client starts MediaRecorder immediately and reveals the question in the same interaction.

MediaRecorder uses MIME fallback in this order:

- `video/mp4;codecs=avc1.42E01E,mp4a.40.2`
- `video/mp4;codecs=h264,aac`
- `video/mp4`
- `video/webm;codecs=vp9,opus`
- `video/webm;codecs=vp8,opus`
- `video/webm`

Recording chunks are written to IndexedDB every 1-2 seconds. Chunks remain locally preserved until the server verifies the GCS object and finalizes the response.

## Storage And Playback

Videos are uploaded directly from the browser to private GCS objects through resumable upload sessions. The Next.js server creates scoped upload sessions and finalizes metadata. Admin playback uses short-lived signed inline read URLs. External API retrieval uses the configurable signed URL TTL, defaulting to 60 minutes. Downloads use separate signed attachment URLs or a server-streamed zip.

Object naming:

```text
assessments/{assessmentId}/questions/{questionNumber}/attempts/{attemptId}/recording.{ext}
```

## Auth And Security

- Admins sign in with Google OAuth.
- The first admin is bootstrapped from `INITIAL_ADMIN_EMAIL`.
- Candidates exchange a secure assessment token for an httpOnly candidate session cookie.
- API clients use bearer API keys stored as hashes.
- Video files are private and accessed only through signed temporary URLs or authenticated server streaming.

## Device Blocking

Candidate routes use `src/proxy.ts` for early user-agent/client-hint checks. The client adds a second layer using screen size, pointer type, and user agent detection. Mobile/tablet users are redirected before seeing landing metadata or questions.

## Scaling

Direct browser-to-GCS upload keeps large video bodies away from Vercel serverless functions, so the app mostly handles auth, metadata, validation, signed URLs, and finalization. For hundreds of concurrent candidates, keep Neon connection usage serverless-friendly and add background jobs for retries/transcoding if needed.

## Cost Management

Vercel hosts the app, while GCS is regional Standard storage with soft delete disabled. Future cost controls could include lifecycle deletion/archival rules, compression/transcoding, retention policies, and storage usage dashboards.

## Browser Compatibility

Safari and iOS playback are the reason MP4-compatible recording is preferred when supported. Chrome and Firefox may still record WebM depending on MediaRecorder support. The app keeps the original recorded file for download and shows an admin download fallback if inline playback fails.

## Tradeoffs

The MVP prioritizes the core required assessment workflow over optional YouTube/Drive integrations. Resumable upload and IndexedDB retry were chosen for reliability. Signed URLs were chosen for simple secure external video retrieval.

## Given More Time

- Add automated Playwright E2E coverage for full recording flows.
- Add queued email retries and Resend delivery webhooks.
- Add optional transcoding/compression.
- Add organization-level multi-tenancy.
- Add lifecycle policies and admin storage reporting.
