import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { assessments, assessmentTokens, candidateSessions } from "@/db/schema";
import { randomToken, sha256 } from "@/lib/crypto";

export const candidateSessionCookie = "glv_candidate_session";

export async function exchangeAssessmentToken(rawToken: string) {
  const tokenHash = sha256(`assessment-token:${rawToken}`);
  const [token] = await db
    .select()
    .from(assessmentTokens)
    .where(and(eq(assessmentTokens.tokenHash, tokenHash), isNull(assessmentTokens.revokedAt), gt(assessmentTokens.expiresAt, new Date())))
    .limit(1);
  if (!token) return null;

  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, token.assessmentId)).limit(1);
  if (!assessment || ["completed", "reviewed", "expired"].includes(assessment.status)) return null;

  const rawSession = randomToken(32);
  const sessionHash = sha256(`candidate-session:${rawSession}`);
  await db.insert(candidateSessions).values({
    assessmentId: assessment.id,
    sessionHash,
    expiresAt: token.expiresAt,
  });
  await db.update(assessmentTokens).set({ usedAt: new Date() }).where(eq(assessmentTokens.id, token.id));

  const cookieStore = await cookies();
  cookieStore.set(candidateSessionCookie, rawSession, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: token.expiresAt,
    path: "/",
  });

  return { assessment, token };
}

export async function getCandidateSession() {
  const raw = (await cookies()).get(candidateSessionCookie)?.value;
  if (!raw) return null;
  const sessionHash = sha256(`candidate-session:${raw}`);
  const [session] = await db
    .select()
    .from(candidateSessions)
    .where(and(eq(candidateSessions.sessionHash, sessionHash), gt(candidateSessions.expiresAt, new Date())))
    .limit(1);
  if (!session) return null;
  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, session.assessmentId)).limit(1);
  if (!assessment) return null;
  return { session, assessment };
}

export async function clearCandidateSession() {
  (await cookies()).delete(candidateSessionCookie);
}
