import { NextResponse } from "next/server";
import { getCandidateSession } from "@/lib/candidate-session";
import { logCandidateEvent } from "@/lib/audit";
import { unauthorized } from "@/lib/permissions";

export async function POST() {
  const session = await getCandidateSession();
  if (!session) return unauthorized("Candidate session is required.");
  await logCandidateEvent(session.assessment.id, "media_check_confirmed");
  return NextResponse.json({ success: true });
}
