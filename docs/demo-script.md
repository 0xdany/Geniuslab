# Recorded Product Demo Script

Target length: 15-20 minutes.

Audience: a non-technical hiring manager who will use Geniuslab to invite candidates, review video answers, and connect the workflow to an ATS or recruiting tool.

Presenter posture: calm, practical, and product-led. Do not over-explain internals in this recording. Use technical rationale only when it builds buyer confidence, for example security, reliability, and workflow speed.

## Demo Prep

Use production if possible. If production is not ready, say "I am showing the deployed review environment that matches this repository." Update `README.md` with the final deployment URL before submitting.

Have these ready before recording:

- Admin account signed in with the Google account configured in `INITIAL_ADMIN_EMAIL`.
- One candidate email inbox visible, with the invitation and completion messages.
- One completed assessment with real videos, so review playback and downloads work.
- One new API key generated during the recording, named `Demo ATS`.
- Terminal or Postman open with `APP_URL` and `API_KEY` set.
- Browser dev tools device toolbar or a real phone/tablet ready for the unsupported-device demo.
- `docs/api.md` open in the repo or deployed documentation view.

Use this sample candidate for the API demo:

```bash
export APP_URL="https://YOUR-DEPLOYMENT-URL"
export API_KEY="paste-the-key-created-in-admin"

curl -X POST "$APP_URL/api/v1/assessments/trigger" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-stage-transition-001" \
  -d '{
    "event": "stage_transition",
    "timestamp": "2026-04-29T10:21:00Z",
    "candidate": {
      "id": "demo-candidate-0429",
      "name": "Maya Chen",
      "email": "maya.chen@example.com",
      "phone": "+1-555-0134",
      "resumeUrl": "https://example.com/maya-chen-resume.pdf"
    },
    "assessment": {
      "title": "Customer Success Manager Video Screen",
      "description": "Please answer naturally. The hiring team is looking for clarity, judgment, and communication style.",
      "questions": [
        {
          "text": "Tell us about a customer conversation where you had to rebuild trust.",
          "maxDurationSeconds": 120,
          "maxAttempts": 1
        },
        {
          "text": "How would you explain a complex product limitation to a frustrated client?",
          "maxDurationSeconds": 180,
          "maxAttempts": 1
        }
      ]
    }
  }'
```

For video retrieval after the candidate submits:

```bash
curl "$APP_URL/api/v1/candidates/demo-candidate-0429/videos" \
  -H "Authorization: Bearer $API_KEY"
```

## Opening, 0:00-0:45

Show: deployed app home or admin dashboard.

Say:

"This is Geniuslab, a video assessment platform for hiring teams. I am going to show the full workflow from a hiring manager's point of view: creating assessments, inviting candidates, reviewing video responses, and connecting the system to external recruiting tools through an API."

"The product is intentionally built around one-off candidate assessments, not reusable templates. That means every candidate has an exact snapshot of the questions, instructions, and source payload that created their assessment. For hiring teams, that keeps the record clean and avoids ambiguity later."

Rationale to mention:

- Hiring managers care about confidence and traceability.
- Candidate-specific assessments are implemented in `src/lib/assessments.ts`, where each creation inserts a candidate, assessment, question rows, and a secure token.
- The relational model is in `src/db/schema/assessments.ts`.

## Admin Experience, 0:45-7:00

### 1. Sign In And Dashboard

Show: Google admin sign-in, then `/admin`.

Say:

"Admins sign in with Google, so hiring teams do not need a separate password system. The first admin is bootstrapped from an environment variable, and after that the dashboard becomes the operating queue for assessments."

"This top section is designed around action: who is waiting, who is recording, who needs review, and who has already been reviewed."

Show:

- Status cards: invited, in progress, completed, reviewed.
- Assessment table.
- Filters for title, status, source, date range, score range.
- Sort menu.

Say:

"For day-to-day review, the key is speed. I can filter to completed assessments, sort by submitted date or score, and separate assessments created manually from assessments created through the API."

Code grounding:

- Filters and sorting are applied server-side in `src/app/(admin)/admin/page.tsx`.
- Filter controls are in `src/components/admin/assessment-filters.tsx`.
- Table columns are in `src/components/admin/assessment-table.tsx`.

### 2. Generate An API Key

Show: `/admin/api-keys`.

Say:

"Now I will create an API key for a recruiting system. I am naming it Demo ATS. The key is shown once, because the application stores only a hash, not the raw secret."

Action:

- Enter `Demo ATS`.
- Click Generate.
- Copy the key into terminal.
- Show active credentials, prefix, status, last used, logs link.

Say:

"This is the credential an external system would use to trigger assessments or retrieve completed videos. I can revoke it later without affecting admin logins."

Code grounding:

- UI: `src/components/admin/api-key-manager.tsx`.
- Key authentication: `src/lib/api-keys.ts`.
- Request logging: `src/lib/audit.ts` and `src/db/schema/audit.ts`.

### 3. Trigger An Assessment Through The API

Show: terminal or Postman.

Action:

- Run the `POST /api/v1/assessments/trigger` curl command.
- Show JSON response with `assessmentLink`, status `invited`, candidate name/email.
- Return to dashboard and show the new row.
- Open `/admin/api-logs` or the key's logs link.

Say:

"This is the integration point for an ATS. When a candidate reaches the right hiring stage, the upstream system sends candidate details and inline questions. Geniuslab creates a secure candidate link and sends the invitation email."

"I am also sending an `Idempotency-Key`. That matters because ATS webhooks are commonly retried. If the same request is delivered twice, we do not want two invitations for the same person."

Code grounding:

- API route: `src/app/api/v1/assessments/trigger/route.ts`.
- Payload validation: `src/lib/validation/intake.ts`.
- Idempotency: `src/lib/idempotency.ts`.
- Rate limit: `src/lib/rate-limit.ts`.
- Duplicate window: `src/lib/assessments.ts`.

### 4. Manually Create An Assessment

Show: `/admin/assessments/new`.

Action:

- Enter candidate name/email.
- Add title and short instructions.
- Enter questions inline.
- Point to `Max Retries` defaulting to `1`.
- Submit.

Say:

"A hiring manager can also create an assessment manually. The questions are entered inline here, and the default is one attempt. I like that default for screening because it keeps the response closer to a live interview, while still allowing the platform to support more attempts if a team wants that policy."

Code grounding:

- Form: `src/components/admin/manual-assessment-form.tsx`.
- Default max attempts: `defaultValue={1}` in the question controls.
- Persistence and invitation email: `src/lib/assessments.ts`.

## Candidate Experience, 7:00-12:30

### 5. Show The Invitation Email

Show: candidate inbox and invitation email.

Say:

"The candidate receives a professional invitation with the assessment name, number of questions, expiration, and a clear note that a laptop or desktop with camera and microphone is required."

Code grounding:

- Invitation template: `src/lib/email/templates/invitation.tsx`.
- Email sender: `src/lib/email/resend.tsx`.

### 6. Open The Assessment Link

Show: click invitation link.

Say:

"The landing page is intentionally reassuring but does not reveal question text. Candidates can see what they are about to do, but they cannot prepare answer scripts from the prompts before recording."

Show:

- Pre-assessment landing page.
- Question count or instructions.
- No question text.

Code grounding:

- Token exchange and session setup: `src/components/candidate/token-exchange.tsx`.
- Candidate landing data route: `src/app/api/candidate/landing/route.ts`.
- Question text is only returned by `src/app/api/candidate/questions/start/route.ts`.

### 7. Camera And Microphone Setup

Show: permission prompt and setup screen.

Say:

"Before a question can start, the candidate completes camera and microphone setup. This reduces failed submissions and gives candidates a moment to confirm that the browser is ready."

Code grounding:

- Setup component: `src/components/candidate/media-setup.tsx`.
- Media hooks: `src/hooks/use-media-devices.ts` and `src/hooks/use-recorder.ts`.

### 8. Question Reveal Flow

Show: the "Ready for question 1" state.

Action:

- Say the next sentence before clicking.
- Click `Start question 1`.
- Point out that the prompt appears and recording starts at the same moment.

Say:

"This is the most important candidate integrity moment. The question is not on the page until I click Start Question. That click calls the server, validates the sequence and attempt limit, creates an attempt, returns the text, and starts browser recording immediately."

"For the candidate, the interaction still feels simple: click start, answer the question, stop recording."

Code grounding:

- Client flow: `startQuestion()` in `src/components/candidate/question-recorder.tsx`.
- Server flow: `src/app/api/candidate/questions/start/route.ts`.
- Sequence enforcement: the route checks the next unlocked question and rejects out-of-order starts.

### 9. Record, Upload, And Submit

Action:

- Record a short answer.
- Stop recording.
- Show save/upload status.
- If default one attempt is shown, point out that the response is saved automatically.
- Complete remaining question(s).
- Click Submit assessment.
- Show confirmation page.
- Show completion confirmation email.

Say:

"The candidate does not need to understand uploads. The browser saves recording chunks locally while recording, then uploads the video after the response stops. If the network drops, this browser keeps a recovery copy and lets the candidate retry."

"After all questions are completed, submitting locks the assessment and sends a completion confirmation email."

Code grounding:

- Local chunk saving: `src/hooks/use-upload-queue.ts`.
- Recorder chunks every second: `src/hooks/use-recorder.ts`.
- Upload session: `src/app/api/candidate/responses/upload-session/route.ts`.
- Upload completion/finalization: `src/app/api/candidate/responses/complete/route.ts` and `src/app/api/candidate/responses/finalize/route.ts`.
- Submit route: `src/app/api/candidate/submit/route.ts`.
- Completion template: `src/lib/email/templates/completion.tsx`.

## Review Workflow, 12:30-16:00

Show: return to `/admin`, filter to `completed`, open the candidate.

Say:

"Once the candidate submits, the assessment moves into the review queue. The reviewer can watch every response, score each answer, leave notes, and add an overall score and summary."

Show:

- Candidate profile and assessment details.
- Video player.
- Playback speed selector.
- Per-question score and notes.
- Overall review form.
- Mark reviewed.

Say:

"Playback uses short-lived signed URLs, so the videos remain private in storage. Reviewers get convenient browser playback and a download fallback if a format does not preview cleanly."

Show:

- Click individual Download on one video.
- Click bulk download for all candidate videos.
- Use Prev/Next to navigate between candidates.

Say:

"For hiring teams reviewing many submissions, the important details are all on one page: prompt, video, scoring, notes, bulk download, and previous-next navigation through the review queue."

Code grounding:

- Review page: `src/app/(admin)/admin/assessments/[id]/page.tsx`.
- Player: `src/components/admin/review-player.tsx`.
- Individual download filename: `src/lib/downloads.ts`.
- Bulk zip route: `src/app/api/admin/downloads/[assessmentId]/zip/route.ts`.
- Previous/next review queue: review page query over completed/reviewed assessments.

## Device Blocking, 16:00-17:00

Show: open candidate link in mobile viewport or on a phone/tablet.

Say:

"The candidate recording flow is desktop-only. If someone opens the link on a phone or tablet, they are blocked before they can begin. This avoids low-quality recordings, unsupported browser behavior, and accidental mobile submissions."

Show:

- Unsupported device page.

Code grounding:

- Server-side early redirect: `src/proxy.ts`.
- Client-side backup check: `src/components/candidate/device-gate.tsx`.
- Detection helper: `src/lib/device-detection.ts`.

## Integration And Documentation, 17:00-19:30

Show: `docs/api.md` and README.

Say:

"The API documentation is written for the external system owner. It describes authentication, endpoints, payloads, success responses, and predictable error codes."

Action:

- Show `POST /api/v1/assessments/trigger`.
- Show invalid payload example or mention `INVALID_PAYLOAD`.
- Run video retrieval API after candidate submission.
- Show JSON with signed video URLs and expiration.
- Show API logs in admin.

Say:

"The retrieval API returns videos only after an assessment is completed or reviewed. It returns temporary signed URLs, not permanent public files. That gives external recruiting tools access to the media without making the storage bucket public."

Code grounding:

- Assessment video API: `src/app/api/v1/assessments/[id]/videos/route.ts`.
- Candidate video API: `src/app/api/v1/candidates/[candidateId]/videos/route.ts`.
- Signed URLs: `src/lib/storage/gcs.ts`.
- API docs: `docs/api.md`.

## Close, 19:30-20:00

Say:

"To summarize, Geniuslab supports the full loop: admins create or receive assessments through the API, candidates complete a guided desktop recording flow, reviewers score and download submissions, and external systems can retrieve completed videos through authenticated APIs. The product choices here are focused on hiring-team efficiency, candidate clarity, and keeping video access private."

Optional scope note:

"I intentionally prioritized the required end-to-end workflow over optional YouTube and Google Drive exports. Those integrations would fit naturally after the same video finalization event that currently powers review and retrieval."

## What Not To Say

Avoid:

- "This is just an MVP."
- "I did not have time for..."
- "Hopefully the upload works."
- "The API is simple."
- "The candidate cannot cheat."

Use instead:

- "The first version prioritizes the required production workflow."
- "The upload path is designed to keep large files out of the app server."
- "The question reveal flow reduces preparation time by releasing the prompt only when recording starts."
- "The API is intentionally small and predictable for ATS integration."

## Web-Backed Rationale

Use these only if asked or in the technical overview:

- MediaRecorder support varies by browser and MIME type, so the app checks supported types before recording. See MDN `MediaRecorder.isTypeSupported()`: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static
- Google Cloud Storage resumable uploads return a session URI for uploading the object data, which fits the app's browser-to-storage upload path. See Google Cloud Storage resumable uploads: https://cloud.google.com/storage/docs/resumable-uploads
- Vercel Functions have request and response body limits, so large videos should not be proxied through serverless handlers. See Vercel Functions limits: https://vercel.com/docs/functions/limitations
