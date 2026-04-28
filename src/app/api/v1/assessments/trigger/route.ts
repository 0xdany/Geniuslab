import { NextRequest, NextResponse } from "next/server";
import { createAssessment } from "@/lib/assessments";
import { authenticateApiKey } from "@/lib/api-keys";
import { logApiRequest } from "@/lib/audit";
import { findIdempotentResponse, requestBodyHash, storeIdempotentResponse } from "@/lib/idempotency";
import { badRequest, unauthorized } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAppSettings } from "@/lib/settings";
import { intakePayloadSchema } from "@/lib/validation/intake";

export async function POST(request: NextRequest) {
  const path = "/api/v1/assessments/trigger";
  const apiKey = await authenticateApiKey(request.headers.get("authorization"));
  if (!apiKey) {
    await logApiRequest({ method: "POST", path, statusCode: 401, errorCode: "UNAUTHORIZED" });
    return unauthorized("A valid API key is required.");
  }

  const settings = await getAppSettings();
  const allowed = await checkRateLimit(`api:${apiKey.id}`, path, settings.apiRateLimitPerMinute);
  if (!allowed) {
    await logApiRequest({ apiKeyId: apiKey.id, method: "POST", path, statusCode: 429, errorCode: "RATE_LIMITED" });
    return badRequest("RATE_LIMITED", "Rate limit exceeded.", 429);
  }

  const body = await request.json().catch(() => null);
  const requestHash = requestBodyHash(body);
  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey) {
    const existing = await findIdempotentResponse(apiKey.id, idempotencyKey);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return badRequest("IDEMPOTENCY_CONFLICT", "This Idempotency-Key was used with a different request.", 409);
      }
      return NextResponse.json(existing.responseBody, { status: existing.statusCode });
    }
  }

  const parsed = intakePayloadSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid payload.";
    await logApiRequest({ apiKeyId: apiKey.id, method: "POST", path, statusCode: 422, requestHash, errorCode: "INVALID_PAYLOAD" });
    return badRequest("INVALID_PAYLOAD", message, 422);
  }

  try {
    const created = await createAssessment({
      candidate: {
        externalId: parsed.data.candidate.id,
        name: parsed.data.candidate.name,
        email: parsed.data.candidate.email,
        phone: parsed.data.candidate.phone,
        resumeUrl: parsed.data.candidate.resumeUrl,
      },
      assessment: parsed.data.assessment,
      source: {
        type: "api",
        apiKeyId: apiKey.id,
        event: parsed.data.event,
        payload: parsed.data,
      },
    });

    const responseBody = {
      success: true,
      assessment: {
        id: created.assessment.id,
        candidateId: parsed.data.candidate.id,
        candidateName: created.candidate.name,
        candidateEmail: created.candidate.email,
        assessmentLink: created.assessmentLink,
        status: created.assessment.status,
        createdAt: created.assessment.createdAt.toISOString(),
      },
    };

    if (idempotencyKey) {
      await storeIdempotentResponse({ apiKeyId: apiKey.id, key: idempotencyKey, requestHash, responseBody, statusCode: 201 });
    }
    await logApiRequest({ apiKeyId: apiKey.id, method: "POST", path, statusCode: 201, requestHash });
    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create assessment.";
    await logApiRequest({ apiKeyId: apiKey.id, method: "POST", path, statusCode: 422, requestHash, errorCode: "CREATE_FAILED" });
    return badRequest("CREATE_FAILED", message, 422);
  }
}
