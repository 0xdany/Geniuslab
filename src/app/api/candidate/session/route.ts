import { NextRequest, NextResponse } from "next/server";
import { exchangeAssessmentToken } from "@/lib/candidate-session";
import { badRequest } from "@/lib/permissions";
import { expireAssessmentIfNeeded } from "@/lib/status";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  if (!token) return badRequest("TOKEN_REQUIRED", "Assessment token is required.", 400);
  const exchanged = await exchangeAssessmentToken(token);
  if (!exchanged) return badRequest("INVALID_OR_EXPIRED_LINK", "This assessment link is invalid, expired, or already submitted.", 410);
  await expireAssessmentIfNeeded(exchanged.assessment.id);
  return NextResponse.json({ success: true, assessmentId: exchanged.assessment.id });
}
