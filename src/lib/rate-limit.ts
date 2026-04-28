import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { rateLimitEvents } from "@/db/schema";

export async function checkRateLimit(bucketKey: string, route: string, limitPerMinute: number) {
  const since = new Date(Date.now() - 60_000);
  const [row] = await db
    .select({ value: count() })
    .from(rateLimitEvents)
    .where(and(eq(rateLimitEvents.bucketKey, bucketKey), gt(rateLimitEvents.createdAt, since)));

  if ((row?.value ?? 0) >= limitPerMinute) {
    return false;
  }

  await db.insert(rateLimitEvents).values({ bucketKey, route });
  return true;
}
