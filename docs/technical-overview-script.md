# Recorded Technical Overview Script

Target length: 5-10 minutes.

Audience: technical evaluator. Keep this structured, decisive, and tied to design tradeoffs. This recording should explain why the system is shaped this way, not repeat the product demo.

## Opening, 0:00-0:30

Say:

"This is the technical overview for Geniuslab. It is a full-stack Next.js application with three surfaces: an authenticated admin dashboard, a secure candidate recording flow, and an external REST API for assessment intake and video retrieval."

"The main architectural goal is to support a complete hiring workflow while keeping videos private, candidate links controlled, and integrations predictable."

## System Architecture, 0:30-1:30

Say:

"The app uses Next.js App Router on Vercel. Relational state lives in Neon PostgreSQL through Drizzle ORM. Videos are stored as private Google Cloud Storage objects. Resend sends invitation and completion emails. Better Auth handles Google OAuth for admins."

"The app server owns authorization, validation, metadata, audit logging, and signed URL generation. It does not proxy completed video uploads through the app server. The browser uploads recordings directly to Google Cloud Storage using resumable upload sessions."

Code grounding:

- Stack and setup: `README.md`.
- Database schema: `src/db/schema/assessments.ts`, `src/db/schema/api-keys.ts`, `src/db/schema/audit.ts`, `src/db/schema/email.ts`.
- GCS storage: `src/lib/storage/gcs.ts`.
- Email: `src/lib/email/resend.tsx`.
- Admin auth: `src/lib/auth.ts` and `src/lib/admin-access.ts`.

Web rationale:

- Vercel Functions have request/response body limits, so direct-to-storage upload avoids pushing large video blobs through serverless functions: https://vercel.com/docs/functions/limitations
- Google Cloud Storage resumable uploads are designed for uploading object data through a session URI: https://cloud.google.com/storage/docs/resumable-uploads

## Per-Candidate Assessments, 1:30-2:25

Say:

"A key design decision is that assessments are stored per candidate, not as reusable templates. Each API request or manual creation inserts its own candidate, assessment, question rows, source metadata, and token."

"That choice makes the data model a little more repetitive, but it is the safer fit for hiring operations. If an ATS sends different questions for a candidate, or a hiring manager edits a one-off prompt, the system preserves exactly what that candidate saw. There is no later question of which template version applied."

"It also simplifies external integration. The intake API can accept candidate info and inline questions in a single request, then return the assessment link immediately."

Code grounding:

- Creation flow: `src/lib/assessments.ts`.
- Assessment, candidate, question, token tables: `src/db/schema/assessments.ts`.
- Intake route: `src/app/api/v1/assessments/trigger/route.ts`.

Tradeoff:

"The tradeoff is less reuse at the database level. Given more time, I would add optional template authoring for admin convenience, but still snapshot the generated candidate assessment at send time."

## Video Recording And Storage Pipeline, 2:25-3:45

Say:

"Recording happens in the browser through MediaRecorder. The app selects the best supported MIME type, preferring MP4-compatible options and falling back to WebM where necessary. That is important because MediaRecorder support varies by browser and format."

"During recording, chunks are written locally every second. When the candidate stops, the app creates an upload session, uploads the assembled blob directly to Google Cloud Storage, verifies the object, records metadata, and finalizes the response."

"The storage object path includes assessment id, question number, and attempt id, which makes cleanup, audit, and retrieval straightforward."

Code grounding:

- MIME fallback: `src/lib/media/mime-types.ts`.
- Recorder: `src/hooks/use-recorder.ts`.
- Local recovery queue: `src/hooks/use-upload-queue.ts`.
- Candidate upload session route: `src/app/api/candidate/responses/upload-session/route.ts`.
- Upload completion: `src/app/api/candidate/responses/complete/route.ts`.
- GCS session and verification: `src/lib/storage/gcs.ts`.

Web rationale:

- MDN documents `MediaRecorder.isTypeSupported()` as the way to check whether a browser should be able to record a MIME type: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static
- GCS resumable uploads support a session URI used for uploading the actual object data: https://cloud.google.com/storage/docs/resumable-uploads

## Question Reveal Flow, 3:45-4:35

Say:

"Question text is deliberately not included on the landing page. The candidate sees setup information and progress, but the actual prompt is released only when they click Start Question."

"That click calls the server. The server checks the candidate session, verifies the assessment is not locked, enforces question order, checks attempt limits, creates the attempt row, and returns only the next question. The client then starts MediaRecorder and renders the question in the same interaction."

"This does not claim to make cheating impossible. The product claim is narrower and more credible: it prevents advance preparation from the assessment landing page and makes each answer closer to a live prompt."

Code grounding:

- Client start flow: `src/components/candidate/question-recorder.tsx`.
- Server sequence and attempt enforcement: `src/app/api/candidate/questions/start/route.ts`.
- Landing route without question text: `src/app/api/candidate/landing/route.ts`.

## Device Blocking, 4:35-5:10

Say:

"The candidate flow blocks phones and tablets. There is a server-side check in the Next.js proxy using user agent and client hints, plus a client-side backup using pointer type, screen size, and user agent."

"This is partly product quality and partly technical risk management. Mobile browsers vary more in camera permissions, recording formats, backgrounding behavior, and upload reliability. For this assessment workflow, desktop is the controlled baseline."

Code grounding:

- Server redirect: `src/proxy.ts`.
- Client guard: `src/components/candidate/device-gate.tsx`.
- Detection helper and tests: `src/lib/device-detection.ts` and `tests/unit/device-detection.test.ts`.

## Link Security And Authentication, 5:10-6:05

Say:

"There are three authentication models. Admins use Google OAuth through Better Auth. Candidates do not create accounts; they receive a high-entropy assessment token in the invitation link, and the server exchanges that token for an httpOnly candidate session. API clients use bearer API keys."

"Raw assessment tokens and API keys are not stored directly. Tokens are hashed, API keys are stored hashed, and videos are never public. Playback and retrieval happen through short-lived signed URLs or authenticated server streaming."

Code grounding:

- Token creation: `src/lib/assessments.ts`.
- Candidate sessions: `src/lib/candidate-session.ts`.
- API key auth: `src/lib/api-keys.ts`.
- Admin access: `src/lib/admin-access.ts`.
- Signed URLs: `src/lib/storage/gcs.ts`.

## Intake API And Video Retrieval API, 6:05-7:00

Say:

"The API is intentionally small: one endpoint to trigger assessments and two ways to retrieve videos, by assessment id or by external candidate id."

"The intake endpoint validates payloads, applies API-key rate limits, supports idempotency, logs requests, creates the candidate-specific assessment, and sends the email. The retrieval endpoints only return videos for completed or reviewed assessments and return temporary signed URLs with an expiration time."

"Those choices make the API natural for an ATS: send a stage-transition event in, later pull video links out."

Code grounding:

- Trigger endpoint: `src/app/api/v1/assessments/trigger/route.ts`.
- Validation: `src/lib/validation/intake.ts`.
- Rate limiting: `src/lib/rate-limit.ts`.
- Idempotency: `src/lib/idempotency.ts`.
- Retrieval by assessment: `src/app/api/v1/assessments/[id]/videos/route.ts`.
- Retrieval by candidate: `src/app/api/v1/candidates/[candidateId]/videos/route.ts`.
- API docs: `docs/api.md`.

## Email Delivery, 7:00-7:35

Say:

"Email is part of the product experience, not just a notification. The invitation explains what the candidate needs, that questions appear one at a time, and when the link expires. The completion email confirms that the submission was received."

"The app records email events so failed sends can be surfaced and retried from the admin area."

Code grounding:

- Invitation template: `src/lib/email/templates/invitation.tsx`.
- Completion template: `src/lib/email/templates/completion.tsx`.
- Email sender and logs: `src/lib/email/resend.tsx`, `src/db/schema/email.ts`, `src/components/admin/failed-email-table.tsx`.

## Review, Playback, And Downloads, 7:35-8:15

Say:

"Admin review uses short-lived signed read URLs for inline playback and separate attachment URLs for downloads. Bulk download streams a zip from private storage after admin authorization."

"This keeps the review workflow fast while preserving the private-storage model. The reviewer can play at different speeds, score per question, add notes, add an overall review, mark reviewed, and move to the previous or next candidate."

Code grounding:

- Review page: `src/app/(admin)/admin/assessments/[id]/page.tsx`.
- Player: `src/components/admin/review-player.tsx`.
- Bulk zip: `src/app/api/admin/downloads/[assessmentId]/zip/route.ts`.
- Download names: `src/lib/downloads.ts`.

## Scaling And Cost, 8:15-9:15

Say:

"For hundreds of concurrent candidates, the most important scaling decision is direct browser-to-GCS upload. Vercel handles lightweight requests: auth checks, validation, metadata writes, upload session creation, and finalization. The large media body goes directly from the candidate browser to object storage."

"The next scaling steps would be connection pooling discipline for Neon, background jobs for retryable work, delivery webhooks for email status, and an optional processing queue for transcoding or compression."

"Storage costs can be managed through retention policies, lifecycle rules, compression or transcoding, storage dashboards, and deleting expired or rejected assessments after a customer-defined period. For the submission version, I kept private original recordings because correctness and retrievability matter more than early optimization."

## Browser Compatibility, 9:15-9:45

Say:

"Browser compatibility is handled by checking MediaRecorder MIME support at runtime and keeping the original recording format. MP4 is preferred where available, WebM is used where that is what the browser supports, and the admin UI gives a download fallback if inline playback fails."

"Given more time, I would add server-side transcoding to produce a normalized playback format while retaining originals for audit."

Web rationale:

- MediaRecorder format support depends on the user agent, so runtime MIME checks are the right pattern: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static

## Closing, 9:45-10:00

Say:

"The main tradeoff in this implementation is choosing a focused, reliable core over optional integrations. The required loop is complete: create or receive an assessment, invite the candidate, record securely on desktop, store private videos, review and score them, and expose completed videos through authenticated APIs."

"Given more time, I would add Playwright coverage for the full recording flow, queued email retries with delivery webhooks, optional transcoding, organization-level multi-tenancy, and optional Google Drive or YouTube export jobs triggered after video finalization."
