import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { apiIdempotencyKeys } from "@/db/schema";
import { sha256, stableJsonHash } from "@/lib/crypto";

export function idempotencyKeyHash(key: string) {
  return sha256(`idempotency:${key}`);
}

export function requestBodyHash(body: unknown) {
  return stableJsonHash(body);
}

export async function findIdempotentResponse(apiKeyId: string, key: string) {
  const [record] = await db
    .select()
    .from(apiIdempotencyKeys)
    .where(and(eq(apiIdempotencyKeys.apiKeyId, apiKeyId), eq(apiIdempotencyKeys.keyHash, idempotencyKeyHash(key))))
    .limit(1);
  return record ?? null;
}

export async function storeIdempotentResponse(params: {
  apiKeyId: string;
  key: string;
  requestHash: string;
  responseBody: unknown;
  statusCode: number;
}) {
  await db.insert(apiIdempotencyKeys).values({
    apiKeyId: params.apiKeyId,
    keyHash: idempotencyKeyHash(params.key),
    requestHash: params.requestHash,
    responseBody: params.responseBody as Record<string, unknown>,
    statusCode: params.statusCode,
  });
}
