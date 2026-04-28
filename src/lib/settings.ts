import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { appSettings } from "@/db/schema";

export async function getAppSettings() {
  const [settings] = await db.select().from(appSettings).where(eq(appSettings.id, "default")).limit(1);
  if (settings) return settings;
  const [created] = await db.insert(appSettings).values({ id: "default" }).returning();
  return created;
}
