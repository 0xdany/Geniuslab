# Demo Script

Target length: 15-20 minutes. Present it as a product walkthrough for a hiring manager.

1. Sign in as the admin Google account.
2. Generate an API key named `Demo ATS`.
3. Trigger an assessment with `POST /api/v1/assessments/trigger`.
4. Create a manual assessment and show the four default question slots.
5. Open the candidate link from the invitation email.
6. Show that the landing page does not reveal questions.
7. Complete camera/microphone setup.
8. Start a question and show that the question appears only as recording begins.
9. Stop recording and show upload status.
10. Submit the assessment and show the confirmation page/email.
11. Return to admin, filter completed assessments, and open the review page.
12. Play videos at different speeds, add score/notes, mark reviewed.
13. Download one video and then bulk download all videos.
14. Call the video retrieval API and show signed URLs.
15. Open the candidate link on a mobile viewport/device and show the unsupported-device block.

## Admin Segment

- Show API key generation and revocation.
- Show manual assessment creation with four default question slots and default one attempt.
- Show assessment list filters/sorting by status, title, date/source.
- Show completed vs reviewed status distinction.
- Show individual video download and bulk zip download.
- Show previous/next candidate review workflow if there are multiple completed candidates.

## Candidate Segment

- Open the invitation email.
- Open the secure link.
- Confirm no questions appear on the landing page.
- Complete camera/microphone setup.
- Start a question and narrate that the server releases the question only at recording start.
- Submit and show the confirmation email.

## Integration Segment

- Show `docs/api.md`.
- Run a valid intake API request.
- Run an invalid payload request.
- Run the video retrieval API for a completed assessment.
- Mention API key hashing, idempotency, rate limiting, and audit logs.

## Optional Scope Note

Google Drive and YouTube exports were intentionally deferred. The implementation prioritizes the required core assessment, recording, review, email, and API workflows.
