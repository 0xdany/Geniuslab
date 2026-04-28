import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { apiKeys } from "@/db/schema";
import { randomToken, safeEqual, sha256 } from "@/lib/crypto";

const API_KEY_PREFIX = "glv";

export function makeApiKey() {
  const secret = randomToken(32);
  const raw = `${API_KEY_PREFIX}_${secret}`;
  return {
    raw,
    prefix: raw.slice(0, 12),
    keyHash: hashApiKey(raw),
  };
}

export function hashApiKey(raw: string) {
  return sha256(`api-key:${raw}`);
}

export async function createApiKey(name: string, createdByUserId?: string) {
  const key = makeApiKey();
  const [record] = await db
    .insert(apiKeys)
    .values({
      name,
      prefix: key.prefix,
      keyHash: key.keyHash,
      createdByUserId,
    })
    .returning();
  return { record, rawKey: key.raw };
}

export async function authenticateApiKey(authorization: string | null) {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const prefix = token.slice(0, 12);
  const [candidate] = await db.select().from(apiKeys).where(eq(apiKeys.prefix, prefix)).limit(1);
  if (!candidate || candidate.status !== "active") return null;
  if (!safeEqual(candidate.keyHash, hashApiKey(token))) return null;
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, candidate.id));
  return candidate;
}
