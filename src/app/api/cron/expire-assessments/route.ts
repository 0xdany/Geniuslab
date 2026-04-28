import { NextRequest, NextResponse } from "next/server";
import { expireStaleAssessments } from "@/lib/status";
import { unauthorized } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected && request.headers.get("authorization") !== `Bearer ${expected}`) {
    return unauthorized("Invalid cron secret.");
  }
  const expired = await expireStaleAssessments();
  return NextResponse.json({ success: true, expiredCount: expired.length });
}
