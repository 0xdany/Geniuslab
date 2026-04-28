import { db } from "@/db/client";
import { adminAuditLogs, apiKeyUsage, apiRequestLogs, candidateEvents } from "@/db/schema";

export async function logApiRequest(input: {
  apiKeyId?: string;
  method: string;
  path: string;
  statusCode: number;
  requestHash?: string;
  errorCode?: string;
  metadata?: unknown;
}) {
  await db.insert(apiRequestLogs).values({
    apiKeyId: input.apiKeyId,
    method: input.method,
    path: input.path,
    statusCode: input.statusCode,
    requestHash: input.requestHash,
    errorCode: input.errorCode,
    metadata: input.metadata as Record<string, unknown>,
  });
  if (input.apiKeyId) {
    await db.insert(apiKeyUsage).values({
      apiKeyId: input.apiKeyId,
      route: input.path,
      method: input.method,
      statusCode: input.statusCode,
    });
  }
}

export async function logAdminAction(userId: string, action: string, entityType: string, entityId?: string, metadata?: unknown) {
  await db.insert(adminAuditLogs).values({ userId, action, entityType, entityId, metadata: metadata as Record<string, unknown> });
}

export async function logCandidateEvent(assessmentId: string, event: string, metadata?: unknown) {
  await db.insert(candidateEvents).values({ assessmentId, event, metadata: metadata as Record<string, unknown> });
}
