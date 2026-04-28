# API Documentation

All external endpoints use:

```http
Authorization: Bearer {api_key}
```

API keys are generated in the admin dashboard and stored hashed.

## Trigger Assessment

```http
POST /api/v1/assessments/trigger
Idempotency-Key: optional-retry-key
```

The payload follows `SPEC.md`: candidate fields plus assessment title, description, and inline questions.

Success:

```json
{
  "success": true,
  "assessment": {
    "id": "uuid",
    "candidateId": "external-id",
    "candidateName": "Jane Doe",
    "candidateEmail": "jane@example.com",
    "assessmentLink": "https://app/assess/token",
    "status": "invited",
    "createdAt": "2026-03-15T10:21:05.000Z"
  }
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "candidate.email is required"
  }
}
```

Supported errors include `UNAUTHORIZED`, `RATE_LIMITED`, `INVALID_PAYLOAD`, `IDEMPOTENCY_CONFLICT`, and `CREATE_FAILED`.

## Retrieve Videos

```http
GET /api/v1/assessments/{assessment_id}/videos
GET /api/v1/candidates/{candidate_id}/videos
```

Videos are returned only for `completed` or `reviewed` assessments.

```json
{
  "success": true,
  "candidate": {
    "id": "000000",
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "assessment": {
    "id": "uuid",
    "title": "Software Engineer Video Assessment",
    "submittedAt": "2026-03-16T14:02:00.000Z"
  },
  "videos": [
    {
      "questionNumber": 1,
      "questionText": "Tell us about yourself.",
      "videoUrl": "https://storage.googleapis.com/signed-url",
      "expiresAt": "2026-03-16T15:02:00.000Z",
      "duration": 92
    }
  ]
}
```

Signed URLs are time-limited. They should not be logged or shared.
