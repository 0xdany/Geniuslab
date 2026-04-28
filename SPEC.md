## Video Assessment Platform with Automated Intake and Review Pipeline

---

## Overview

You are building a video assessment platform that allows organizations to send, collect, and review video-based assessments from candidates.

The system should support three primary experiences:

**Admin interface** for managing candidates, reviewing submissions, and (for testing) manually creating one-off assessments **Candidate-facing interface** for recording and submitting video responses **External intake API** for receiving candidates and questions from other systems and triggering assessments automatically

The core experience is:

External system (or admin manually) sends candidate details and a list of questions to the platform  
\-\> system creates an assessment for that candidate from the supplied questions  
\-\> system sends assessment invitation email to the candidate  
\-\> candidate opens the unique assessment link  
\-\> candidate records video answers for each question  
\-\> candidate submits their completed assessment  
\-\> admin reviews video submissions in the review interface  
\-\> admin scores and annotates each response

This assignment focuses on building a reliable video capture and review workflow with a clean integration layer for receiving candidates from external tools.

We are evaluating:

- Video recording and upload experience quality  
- Email delivery and assessment distribution  
- API design for external system integration  
- Admin review workflow usability  
- End-to-end reliability from intake to review  
- Realistic handling of video files and browser recording APIs

The candidate assessment experience must be polished and stress-free. Candidates taking an assessment are often nervous, and the interface should inspire confidence, not add friction.

The admin review experience must be efficient. Reviewers will watch many videos in sequence, and the interface should support that workflow.

A critical requirement is that the platform must be triggerable from external systems via a well-documented API. Organizations use different tools for recruitment, and this platform must integrate cleanly as a downstream service.

---

## Time Expectation

This assignment represents approximately 5 to 7 days of effort assuming effective use of AI coding tools.

---

## Platform & Stack Requirements

### Platform

Web application with admin dashboard, candidate-facing assessment pages, and a REST API for external integrations.

### Recommended Stack

| Layer | Recommendation |
| :---- | :---- |
| Frontend | React or any React-based framework (Next.js, Remix, etc.) |
| Backend | Node.js or Python |
| Database | Any persistent storage (Firebase, MongoDB, PostgreSQL, etc.) |
| Infrastructure | Google Cloud preferred, but equivalent architecture is acceptable |

### Suggested Integrations

| Capability | Options |
| :---- | :---- |
| Video Storage | Google Cloud Storage, AWS S3, Firebase Storage, Cloudinary, or similar |
| Email | SendGrid, Postmark, Amazon SES, Resend, or similar |
| Video Recording | Browser MediaRecorder API |
| Video Playback | HTML5 video, Video.js, Plyr, or similar |

### Optional Integration Capabilities

These are bonus features that demonstrate additional engineering depth:

| Capability | Options |
| :---- | :---- |
| YouTube Upload | YouTube Data API v3 |
| Cloud Storage | Google Drive API |
| File Processing | FFmpeg, Sharp, or similar |

### Coding Tools

AI-assisted development tools are encouraged:

- Claude Code  
- Cursor  
- or similar tools

Push your project to GitHub with clear setup instructions.

Before submitting:

1. Test the project in GitHub Codespaces to ensure it runs reproducibly in a clean environment.  
2. Provide a hosted URL where the project is actively deployed to streamline the review and testing process.

---

## Functional Requirements

### Assessment Creation

Assessments on this platform are not built from reusable templates. Each assessment is created on demand for a specific candidate, with the questions supplied at the moment of creation.

There are two ways to create an assessment:

#### 1\. Via the External Intake API (primary path)

This is the primary intended use of the platform. An external system (such as a recruitment pipeline tool or HR platform) sends a request to the intake API with the candidate's details and the full set of questions to be asked. The platform creates the assessment, sends the invitation email, and tracks the candidate's progress.

The payload from the upstream system contains everything needed to run the assessment — there is no need for the Video Platform admin to pre-configure question banks, templates, or matching logic.

See the **External Intake API** section below for the full payload specification.

#### 2\. Manually from the admin interface (testing and one-off use)

Admins can also create an assessment directly from the dashboard for testing or for ad-hoc cases. Manual creation requires the admin to enter:

- Candidate name  
- Candidate email  
- Assessment title (a label for this specific assessment)  
- Optional description or instructions for the candidate  
- An inline list of questions, where each question has:  
  - Question text  
  - Optional maximum recording duration (e.g., 5 minutes)  
  - Maximum number of recording attempts (default: 1, configurable per question)

When the manual creation form opens, it must start with **4 question slots by default**. The admin can add additional questions or remove some, with the only constraint being that at least one question must remain.

There is no template library to save and reuse question sets — each manual assessment is created from scratch. The platform deliberately avoids managing question content, since that responsibility lives in upstream systems.

The default of 1 attempt reflects that, in most cases, candidates do not get a second chance to answer. The admin (or the upstream system, when triggering via API) can increase this value per question if needed.

Manual creation must follow the same flow as API-triggered creation: when the admin submits the form, the assessment is created, an invitation email is sent to the candidate, and the assessment appears in the dashboard like any other.

---

### External Intake API

The platform must expose a REST API that external systems can call to trigger sending an assessment to a candidate.

This is the primary integration point. External tools such as applicant tracking systems, HR platforms, or automation workflows should be able to send candidate information to this platform and have an assessment automatically dispatched.

#### API Endpoint

```
POST /api/v1/assessments/trigger
```

#### Authentication

Requests must be authenticated using an API key in the Authorization header.

```
Authorization: Bearer {api_key}
```

Admins must be able to generate and manage API keys from the admin interface.

#### Request Payload

The API must accept the following payload format. This format is designed to be compatible with common recruitment pipeline tools.

The upstream system supplies both the candidate information **and** the full set of questions for the assessment. The Video Platform does not store reusable templates — every assessment is built from the questions provided in the payload.

```json
{
  "event": "stage_transition",
  "timestamp": "2026-03-15T10:21:00Z",
  "candidate": {
    "id": "000000",
    "name": "Jane Doe",
    "email": "jane.doe@email.com",
    "phone": "+1-555-123-4567",
    "resumeUrl": "https://storage.example.com/resumes/abc123.pdf"
  },

  "assessment": {
    "title": "Software Engineer Video Assessment",
    "description": "Please answer each question concisely. You will have one attempt per question.",
    "questions": [
      {
        "text": "Tell us about yourself and your background.",
        "maxDurationSeconds": 120,
        "maxAttempts": 1
      },
      {
        "text": "Describe a challenging technical problem you have solved recently.",
        "maxDurationSeconds": 180,
        "maxAttempts": 1
      },
      {
        "text": "Why are you interested in this role?",
        "maxDurationSeconds": 120,
        "maxAttempts": 1
      }
    ]
  }
}
```

**Required fields:**

- `candidate.id`  
- `candidate.name`  
- `candidate.email`  
- `assessment.title`  
- `assessment.questions` (must contain at least one question)  
- For each question: `text`

**Optional fields:**

- `candidate.phone`  
- `candidate.resumeUrl`  
    
- `assessment.description`  
- For each question: `maxDurationSeconds` (no limit if omitted), `maxAttempts` (defaults to 1 if omitted)

#### API Behavior

When a valid request is received:

1. Validate the payload (candidate fields, assessment structure, at least one valid question)  
2. Create an assessment instance for the candidate using the questions provided in the payload  
3. Generate a unique, secure assessment link  
4. Send an invitation email to the candidate  
5. Return a response confirming the assessment was created

#### Response Format

**Success (201 Created):**

```json
{
  "success": true,
  "assessment": {
    "id": "assess_abc123",
    "candidateId": "000000",
    "candidateName": "Jane Doe",
    "candidateEmail": "jane.doe@email.com",
    "assessmentLink": "https://your-platform.com/assess/abc123",
    "status": "invited",
    "createdAt": "2026-03-15T10:21:05Z"
  }
}
```

**Error (400/401/422):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "candidate.email is required"
  }
}
```

#### Reliability Requirements

- Validate all incoming payloads and return clear error messages (missing required fields, malformed questions, invalid email, etc.)  
- Prevent obvious duplicate assessments for the same candidate email within a configurable short window (to avoid double-clicks or retried requests creating two assessments)  
- Rate limit the API endpoint  
- Log all incoming requests (success and failure) for auditing  
- API key management: generate, revoke, view usage history

#### API Documentation

The API must include clear documentation (in the README or a dedicated page) covering:

- Authentication setup  
- Payload format with examples  
- Response formats  
- Error codes  
- Rate limits  
- Integration guide for connecting external systems

---

### Video Retrieval API

In addition to the intake API, the platform must expose a REST API for retrieving completed assessment videos for a given candidate.

This allows external systems to programmatically access video submissions without needing to log into the admin dashboard.

#### Endpoint

```
GET /api/v1/assessments/{assessment_id}/videos
```

Or, if querying by candidate identifier:

```
GET /api/v1/candidates/{candidate_id}/videos
```

The candidate may design the URL structure as appropriate, but the endpoint must live under the same `/api/v1/` namespace as the intake API.

#### Authentication

The video retrieval API must use the same API key authentication as the intake API.

```
Authorization: Bearer {api_key}
```

#### Response Behavior

The API may return videos in either of the following ways. Candidates choose the approach they think is most appropriate.

**Option A:** Return signed/temporary URLs where each video can be viewed in a browser or downloaded directly.

```json
{
  "success": true,
  "candidate": {
    "id": "000000",
    "name": "Jane Doe",
    "email": "jane.doe@email.com"
  },
  "assessment": {
    "id": "assess_abc123",
    "title": "Software Engineer Assessment",
    "submittedAt": "2026-03-16T14:02:00Z"
  },
  "videos": [
    {
      "questionNumber": 1,
      "questionText": "Tell us about yourself.",
      "videoUrl": "https://storage.example.com/signed/abc123_q1.mp4?token=...",
      "expiresAt": "2026-03-16T15:02:00Z",
      "duration": 92
    },
    {
      "questionNumber": 2,
      "questionText": "Why are you interested in this role?",
      "videoUrl": "https://storage.example.com/signed/abc123_q2.mp4?token=...",
      "expiresAt": "2026-03-16T15:02:00Z",
      "duration": 110
    }
  ]
}
```

**Option B:** Stream the video file(s) directly as the response (single video per call, or zip archive for all videos at once).

#### Reliability Requirements

- Returned URLs (Option A) must be securely signed and time-limited  
- Unauthorized requests must return clear error responses  
- Requests for nonexistent or incomplete assessments must return appropriate error codes  
- Log all retrieval requests for auditing  
- Rate limit consistent with the intake API

#### API Documentation

This endpoint must be documented alongside the intake API, including:

- Endpoint URL and method  
- Authentication  
- Request and response examples  
- Behavior for in-progress vs. completed assessments  
- URL expiration policy (if returning signed URLs)

---

### Assessment Email System

When an assessment is triggered (manually or via API), the platform must send an invitation email to the candidate.

#### Invitation Email

The email must include:

- Candidate's name  
- Assessment title  
- Clear instructions on what to expect  
- Number of questions  
- Time expectations (if time limits are configured)  
- A unique, secure link to their assessment  
- Deadline for completion (if configured by admin)

#### Email Requirements

- Use a real email provider (SendGrid, Postmark, SES, Resend, or similar)  
- Emails must actually be delivered (not logged to console)  
- Email send status must be tracked: **sent** (the provider accepted the request) or **failed** (the provider returned an error). Tracking actual delivery confirmation via provider webhooks is not required.  
- The email must be well-designed, professional, and mobile-readable  
- Failed email sends must be logged and retryable from the admin interface

#### Additional Emails

**Completion confirmation**:

- Send the candidate a brief confirmation email when they successfully submit their assessment

---

### Candidate Assessment Interface

This is the candidate-facing experience. Candidates access their assessment through the unique link sent via email.

#### Access and Authentication

- Assessment links must be unique and secure (unguessable tokens)  
- No account creation or login required for candidates  
- Links must expire after a configurable global period (set in admin settings — e.g., "links expire 7 days after creation") or after submission, whichever comes first  
- The expiration period is a single global setting that applies to all assessments, configurable from the admin interface  
- Expired or already-submitted links must show a clear message

#### Device Requirements

The assessment must be completed on a laptop or desktop computer. Mobile phones and tablets are not permitted.

- The platform must detect when the candidate is accessing the assessment from a smartphone or tablet  
- Detected mobile and tablet users must be hard-blocked from proceeding  
- A clear, friendly message must explain that the assessment requires a laptop or desktop computer and cannot be completed on a phone or tablet  
- The block must apply before the assessment landing page is accessible — candidates on a non-supported device must never see the questions or recording interface

Detection should be reasonably reliable (user agent, screen size, touch capability, or a combination). Candidates should not be able to trivially bypass the block by toggling browser settings.

#### Pre-Assessment Landing Page

When a candidate (on a supported device) opens their assessment link, they see a landing page that includes:

- Assessment title  
- Candidate name (personalized greeting)  
- General instructions and what to expect  
- Total number of questions  
- Time expectations (if time limits are configured)  
- Number of attempts allowed per question (so candidates know whether they get retries)  
- A clear notice that questions will be revealed one at a time and only when recording begins  
- A clear notice that there is no preparation time between questions  
- A "Begin Assessment" or equivalent action button

**The question texts must not be visible on this landing page.** Candidates must not be able to read the questions before they start.

#### Camera and Microphone Setup

Before the assessment begins, the candidate must complete a camera and microphone check.

Requirements:

- Camera and microphone must be turned on and previewed before the assessment can begin  
- The candidate sees a live preview of their webcam feed  
- The candidate sees a visible audio level indicator confirming the microphone is working  
- If permission is denied or the device is not detected, show clear instructions on how to enable access  
- The candidate must explicitly confirm their camera and microphone are working before proceeding  
- Once confirmed, the camera and microphone remain active throughout the assessment

The candidate cannot proceed to the questions until the camera and microphone are verified as working.

#### Question Flow

The assessment follows a strict, no-preparation question flow.

**Core rules:**

- Only one question is presented at a time  
- The question text is hidden until recording for that question begins  
- Once a question is recorded, it is locked and the candidate moves to the next question  
- The candidate cannot skip ahead, go back, or preview upcoming questions

**Step-by-step flow:**

1. Candidate completes the camera and microphone setup  
2. Candidate sees a "Start Question 1" button (no question text visible)  
3. Candidate clicks "Start Question 1"  
4. **At the same instant:** the question text appears AND recording begins automatically  
5. Candidate answers the question on the spot, with no preparation time  
6. Recording stops when the candidate clicks "Stop Recording" or when the time limit is reached  
7. If the question allows multiple attempts and the candidate has attempts remaining, they may re-record (the question text remains visible during retries)  
8. Once the candidate finalizes their response (or attempts are exhausted), the question is locked  
9. Candidate sees a "Start Question 2" button (no question text visible)  
10. The pattern repeats until all questions are completed

**This flow is intentional.** The platform exists to capture genuine, spontaneous responses. Candidates must not be able to read a question and prepare an answer before recording. Questions should not be available client side. They should be kept server side.

#### Recording Behavior

- Use the browser MediaRecorder API (or equivalent)  
- Capture webcam video and microphone audio  
- Display a clear recording indicator (red dot, "REC" label, or similar)  
- Show elapsed time during recording  
- Auto-stop when the time limit is reached (if configured)  
- Show remaining attempts (if max attempts \> 1\)  
- For the default case of 1 attempt, the recording is final once stopped

#### Submission

- After the final question is recorded, the candidate sees a confirmation screen  
- Candidates must explicitly submit their completed assessment  
- After submission, show a confirmation page  
- After submission, the assessment link no longer allows changes or replay  
- A confirmation email is sent to the candidate

#### Candidate UX Standards

The assessment interface will be judged on:

- Clarity and simplicity (candidates should not be confused about what to do)  
- Camera and microphone permission handling (clear prompts, helpful error messages if denied)  
- Reliable enforcement of the no-preparation question flow  
- Recording reliability (no lost recordings due to browser issues)  
- Clear, friendly handling of unsupported devices  
- Accessibility considerations  
- Stress-free experience (calm design, encouraging copy, clear progress)

The interface must be calm and confidence-inspiring despite the strict no-preparation rules. Candidates should feel the platform is fair, even if the format is challenging.

---

### Admin Review Interface

Admins must be able to review all submitted assessments through an efficient review interface. The interface should be **Mobile friendly**.

#### Assessment List

The admin must see a list of all assessments with:

- Candidate name  
- Candidate email  
- Assessment title  
- Current status (see the status definitions below)  
- Submission date  
- Overall score (if scored)  
- Source (manual, API, with source metadata if available)

**Status definitions:**

The platform tracks the following statuses, in roughly sequential order:

- **invited** — assessment created and invitation email sent, candidate has not yet opened the link  
- **in progress** — candidate has opened the link and started recording but has not yet submitted  
- **completed** — candidate has submitted all responses, but no admin has reviewed it yet  
- **reviewed** — an admin has marked the assessment as reviewed (this is a separate status that comes *after* completed; an admin must take action to move an assessment from completed to reviewed)  
- **expired** — the assessment link expired before submission

**completed** and **reviewed** are distinct statuses. A submitted assessment stays in **completed** until an admin explicitly marks it as reviewed.

**Filtering** by:

- Status  
- Assessment title (matches the title string stored on each assessment — useful when upstream systems consistently send the same title for the same role, e.g., "Software Engineer Assessment", so all candidates for that role can be filtered together)  
- Date range  
- Source (manual vs. API-triggered)  
- Score range

**Sorting** by:

- Submission date  
- Candidate name  
- Status  
- Score

#### Individual Assessment Review

When reviewing a specific candidate's assessment:

- Display candidate information (name, email, phone, resume link if provided)  
- Show all question responses in order  
- For each response:  
  - Display the question text  
  - Video player with playback controls (play, pause, seek, speed control)  
  - Recording duration  
  - **Download button to download the individual question's video file**  
  - Score input (e.g., 1-5 stars or numeric scale)  
  - Notes field for reviewer comments  
- **Bulk download button to download all of a candidate's question videos at once (single click)**  
- Overall score and summary notes section  
- Navigation between candidates (previous/next) without returning to the list

#### Video Download Behavior

- Individual question downloads must save the video file directly with a meaningful filename (e.g., `{CandidateName}_Q{Number}.{ext}`)  
- The bulk download button must deliver all of a candidate's videos in a single user action — implementation can be a zip archive, sequential downloads, or another approach the candidate determines is appropriate  
- Downloaded videos must be in their original recorded format (no transcoding required)  
- Filenames in the bulk download should follow a consistent naming convention so admins can identify each video

#### Review Workflow

- Mark individual responses as reviewed  
- Mark entire assessments as reviewed  
- Overall assessment scoring (aggregate or manual)  
- The review interface should support watching multiple candidates efficiently (keyboard shortcuts for play/pause and navigation are valued)

---

### Video Storage and Playback

The platform must handle video file storage and playback reliably.

#### Storage Requirements

- Store recorded and uploaded videos in Google cloud storage   
- Generate signed or temporary URLs for secure playback  
- Videos must not be publicly accessible without authentication or a valid assessment link

#### Playback Requirements

- Smooth video playback in the admin review interface  
- Support playback speed adjustment (0.5x, 1x, 1.25x, 1.5x, 2x, 2.5x, 3x)  
- Handle various video formats gracefully  
- Show loading states and handle buffering

#### Considerations

- Video files can be large. Upload handling must include progress indication and interruption recovery where possible  
- Consider video compression or format standardization on upload  
- When an assessment is deleted, its video files must also be removed from storage

---

### Authentication and Authorization

#### Admin Authentication

- Admin users must log in using Google OAuth  
- Secure session management (httpOnly cookies or secure token storage)  
- Session expiration and renewal  
- Admin user management (invite new admins)  
- The **first admin** must be bootstrapped via an environment variable (e.g., `INITIAL_ADMIN_EMAIL`). When that email logs in via Google OAuth for the first time, they are automatically granted admin access. This solves the bootstrap problem of needing an existing admin to invite the first one.

#### Candidate Authentication

- Candidates do not create accounts  
- Access is controlled via unique, secure assessment links (token-based)  
- Tokens must be unguessable and time-limited

#### API Authentication

- External systems authenticate via API keys  
- API keys are managed by admins (generate, revoke, view history)  
- API keys must be stored securely (hashed, not in plaintext)

---

### Error Handling

The system must gracefully handle:

- Camera or microphone permission denied by candidate  
- Camera or microphone disconnected mid-assessment  
- Recording failure mid-question (browser crash, tab close)  
- Video upload failure (network interruption during the recording's upload to storage)  
- Unsupported device detection (mobile or tablet)  
- Email delivery failure  
- External API payload validation errors  
- Video retrieval API requests for nonexistent or incomplete assessments  
- Expired assessment links  
- Admin reviewing while candidate is still recording  
- API rate limit exceeded  
- Storage quota issues

The system should ensure:

- Candidates never lose a completed recording due to upload failure. The platform must include a mechanism that automatically retries failed video uploads. Implementation is left to the candidate's discretion (e.g., in-memory retry with exponential backoff, IndexedDB-backed queue, server-side resumable upload, etc.) — what matters is that a transient network failure does not destroy a successfully recorded video.  
- Admins always see accurate assessment status  
- API consumers receive clear, actionable error responses  
- Partial assessment progress is preserved if the candidate leaves and returns

---

## Optional Features

The following features are not required but demonstrate additional engineering capability. Implement any that interest you.

### YouTube Integration

Build a pipeline for admins to export assessment videos to YouTube.

#### Requirements

- Authenticate with YouTube Data API v3 (OAuth)  
- Bulk upload selected assessment videos to YouTube  
- Auto-generate video titles using candidate metadata

**Title format:**

```
{Candidate Name} - {Assessment Title} - Q{Question Number}
```

Example:

```
Jane Doe - Software Engineer Assessment - Q1
```

- Auto-generate video descriptions including:  
  - Candidate name  
  - Question text  
  - Assessment date  
  - Link to resume (if available)  
- Assign videos to YouTube playlists (organized by assessment title, role, or cohort)  
- Show upload progress and status for bulk operations  
- Handle YouTube API rate limits and quotas gracefully

### Google Drive Integration

Build a pipeline for organizing candidate resumes and materials in Google Drive.

#### Requirements

- Authenticate with Google Drive API (OAuth)  
- When a candidate's resume URL is provided (via API intake or manual upload), download and upload the resume to a designated Google Drive folder  
- Organize Drive folders by assessment title or time period  
- Link the Drive file back to the candidate's assessment record  
- Show Drive links in the admin review interface

---

## QA Expectations

Candidates must explicitly consider the following scenarios.

Testing should include:

- Recording video across different browsers (Chrome, Firefox, Safari) on laptop and desktop  
- Verifying mobile and tablet detection blocks the assessment with a clear message  
- Verifying the question reveal flow works correctly (questions hidden until recording starts)  
- Verifying the camera and microphone setup screen blocks progress until both are confirmed working  
- Triggering assessments via the API with valid and invalid payloads (including missing required fields, malformed questions, and varying numbers of questions)  
- Manually creating assessments from the admin interface  
- Retrieving videos via the video retrieval API  
- Email delivery verification (check actual inbox)  
- Assessment link expiration behavior  
- Admin reviewing assessments in various states (invited, in progress, completed)  
- Video playback reliability in the review interface  
- Individual video downloads from the admin review interface  
- Bulk video downloads (all questions for a candidate in a single click)  
- API key generation, usage, and revocation  
- Multiple candidates completing assessments concurrently  
- Responsive Admin interface on mobile and tablet devices

A strong submission includes:

- Seed data with at least 10-15 sample assessments in various states (invited, in progress, completed, expired)  
- Pre-recorded sample videos so the review interface can be demonstrated meaningfully  
- A seeding script or documented process for populating test data

If creating extensive sample video data is not practical, candidates should explain their approach to testing and demonstrate the interface with whatever sample data they can provide.

---

## Deliverables

### GitHub Repository

Provide a repository containing:

- Clean project structure  
- Clear README with:  
  - Architecture overview  
  - Local development setup instructions  
  - Environment variable configuration  
  - Database setup instructions  
  - API documentation (endpoint, auth, payload, responses)  
  - Seeding instructions for test data  
- `.env.example` file with all required variables documented

The project must run in GitHub Codespaces.

### Deployed Application

Provide a live, deployed version of the application.

- Admin dashboard, candidate assessment interface, and API must all be accessible  
- Include the deployment URL in the README  
- Ensure the deployed version matches the repository code

### Recorded Demo

Submit a recorded demo (15-20 minutes) showing:

- Admin experience  
  - Generating an API key  
  - Triggering an assessment via the API with a sample payload containing candidate info and questions (using curl, Postman, or similar)  
  - Manually creating an assessment from the admin interface (entering questions inline, with default of 1 attempt shown)  
  - Viewing the assessment list with filters and sorting  
  - Reviewing a completed assessment (watching videos, scoring, adding notes)  
  - Downloading an individual question video  
  - Bulk downloading all videos for a candidate  
  - Navigating between candidates during review  
- Candidate experience  
  - Opening the assessment link from the email  
  - Viewing the pre-assessment landing page (with no question text visible)  
  - Completing the camera and microphone setup  
  - Demonstrating the question reveal flow (clicking "Start Question" reveals the text and starts recording at the same instant)  
  - Recording a video response in the browser  
  - Submitting the completed assessment  
  - Viewing the confirmation page  
- Device blocking  
  - Demonstrating that opening the assessment link on a phone or tablet shows the unsupported device message and blocks access  
- Email system  
  - Showing the invitation email received by the candidate  
  - Showing the completion confirmation email  
- Integration  
  - Demonstrating the intake API with a sample request  
  - Demonstrating the video retrieval API returning videos for a candidate  
  - Showing the API documentation  
  - Showing API key management and request logs  
- Optional features (if implemented)  
  - YouTube bulk upload workflow  
  - Google Drive integration

Present the demo as if showing the product to a non-technical hiring manager who will use this tool to manage candidate assessments.

### System Architecture Overview

Submit a recorded technical overview (5 \- 10 minutes) explaining:

- Overall system architecture  
- Why the platform stores assessments per-candidate (not as reusable templates) and how this shapes the data model  
- Video recording and storage pipeline  
- Question reveal flow and how preparation is prevented  
- Device detection and unsupported device blocking  
- Assessment link security model  
- Intake API and video retrieval API design decisions  
- Email delivery system  
- Authentication flows (admin, candidate, API)  
- Video playback and download strategy

Also explain:

- How the system would handle scaling to hundreds of concurrent candidates recording video  
- How video storage costs could be managed at scale  
- Browser compatibility considerations for MediaRecorder API  
- Key architectural tradeoffs made during development  
- What you would change or add given more time  
- If optional features were implemented, explain the integration architecture

---

## Evaluation Criteria

### Product Understanding

We evaluate:

- Candidate assessment UX (clarity, simplicity, confidence-inspiring)  
- Admin review workflow efficiency  
- Email communication quality  
- Practical decisions about recording constraints and fallbacks

### Engineering Judgment

We evaluate:

- Video recording implementation reliability  
- API design quality and documentation  
- External integration patterns  
- Email delivery implementation  
- Security of assessment links and API keys  
- Storage architecture for video files  
- Code organization and maintainability  
- Error handling completeness

### API and Integration Quality

We specifically evaluate:

- API endpoint design (RESTful, well-documented)  
- Payload validation and error responses  
- Authentication implementation  
- Rate limiting and abuse prevention  
- Logging and auditability  
- How naturally the platform could integrate with external recruitment tools

### End-to-End Experience Quality

We care about:

- Complete, working flow from assessment creation to candidate submission to admin review  
- Reliable video recording across browsers  
- Emails that actually arrive and look professional  
- API that external systems can integrate with confidently  
- No broken or dead-end flows  
- Production-level deployment

---

This exercise evaluates your ability to build a multi-stakeholder platform that serves both internal users (admins reviewing assessments) and external users (candidates recording responses), connected by a reliable integration layer that enables automation from upstream systems.

The best submissions will deliver a candidate experience that feels professional and reassuring, an admin review workflow that is fast and efficient, and an API that external tools can integrate with confidently.

