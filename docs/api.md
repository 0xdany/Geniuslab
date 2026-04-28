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

The payload contains candidate fields plus assessment title, description, and inline questions. Questions are not reusable templates; every request creates a candidate-specific assessment.

Example:

```bash
curl -X POST "$APP_URL/api/v1/assessments/trigger" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: stage-transition-demo-001" \
  -d '{
    "event": "stage_transition",
    "timestamp": "2026-03-15T10:21:00Z",
    "candidate": {
      "id": "000000",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "phone": "+1-555-123-4567",
      "resumeUrl": "https://example.com/resume.pdf"
    },
    "assessment": {
      "title": "Software Engineer Video Assessment",
      "description": "Please answer each question concisely.",
      "questions": [
        {
          "text": "Tell us about yourself and your background.",
          "maxDurationSeconds": 120,
          "maxAttempts": 1
        },
        {
          "text": "Describe a challenging technical problem you solved recently.",
          "maxDurationSeconds": 180,
          "maxAttempts": 1
        }
      ]
    }
  }'
```

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

Supported errors include:

- `UNAUTHORIZED`
- `RATE_LIMITED`
- `INVALID_PAYLOAD`
- `IDEMPOTENCY_CONFLICT`
- `CREATE_FAILED`

The API rate limit defaults to 60 requests per minute per API key and is configurable from admin settings.

## Retrieve Videos

```http
GET /api/v1/assessments/{assessment_id}/videos
GET /api/v1/candidates/{candidate_id}/videos
```

Videos are returned only for `completed` or `reviewed` assessments.
The same API-key rate limit applies to retrieval requests. The default is 60 requests per minute per API key.
All retrieval attempts are recorded in the API audit log.
Signed URLs use the admin-configurable `signedUrlTtlMinutes` setting. The default is 60 minutes.
The audit log stores route/status/error metadata only; signed URL values are returned to the caller but are not stored in request logs.

Example:

```bash
curl "$APP_URL/api/v1/assessments/$ASSESSMENT_ID/videos" \
  -H "Authorization: Bearer $API_KEY"
```

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

Incomplete assessments return `ASSESSMENT_INCOMPLETE`. Missing assessments/candidates return `NOT_FOUND`. Missing or revoked API keys return `UNAUTHORIZED`.
