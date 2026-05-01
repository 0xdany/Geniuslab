# QA Checklist

Use this checklist before recording the final demo.

## Candidate Flow

- Desktop Chrome can open an assessment link, pass camera/microphone setup, record every question, upload, and submit.
- Desktop Firefox can record and submit at least one assessment.
- Desktop Safari can record and submit at least one assessment, or the browser limitation is documented during the technical overview.
- Mobile/tablet access redirects to the unsupported-device page before questions or landing metadata are shown.
- Landing page never shows question text.
- Starting a question reveals text only after `/api/candidate/questions/start` returns and recording begins.
- Camera denied, microphone denied, unsupported recorder format, and upload failure states show useful messages.
- Completed links no longer allow replay or edits.
- Expired links show a clear expired state.

## Admin Flow

- Google OAuth login works for `INITIAL_ADMIN_EMAIL`.
- Manual creation starts with four question slots and can add/remove questions while keeping at least one.
- Assessment list filters by status/title/source/date and shows source/status/score.
- Completed assessments show inline video preview, playback speed controls, score, notes, individual download, and bulk zip download.
- On a completed assessment, click **Process videos** and confirm the integration status moves to queued/processing, then ready after the Cloud Run worker finishes.
- When processing is ready, reload the review page and confirm playback uses the processed MP4 with a thumbnail poster while the download link still downloads the original recording.
- Click **Export to Drive** and confirm the configured Google Drive folder receives one assessment folder with MP4 files, thumbnails, and `metadata.json`.
- Marking an assessment reviewed changes status from `completed` to `reviewed`.
- Failed email rows can be retried from the admin API/action.

## Integration Flow

- Generate and revoke an API key in the admin UI.
- Trigger `POST /api/v1/assessments/trigger` with a valid payload.
- Verify invalid payloads return structured `success: false` errors.
- Verify missing/revoked API key returns `401`.
- Verify rate limits return `429` when exceeded.
- Verify `Idempotency-Key` replays the original response for identical retry payloads.
- Verify `GET /api/v1/assessments/{id}/videos` returns signed URLs for completed assessments.
- Verify incomplete/nonexistent video retrieval requests return clear errors.

## Email

- Invitation email is accepted by Resend and arrives in the candidate inbox.
- Completion email is accepted by Resend and arrives after submission.
- `EMAIL_FROM` uses a verified domain, currently `reachout.danyraihan.dev`.

## Deployment

- `npm install` succeeds in a clean environment.
- `npm run build` succeeds.
- `npm run lint` succeeds.
- `npm test` succeeds.
- `npm run db:migrate` succeeds against Neon.
- Vercel URL serves the deployed app.
- GCS CORS includes local, deployed, and any Codespaces origins used for video upload testing.
