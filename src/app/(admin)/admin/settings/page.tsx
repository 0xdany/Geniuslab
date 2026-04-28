import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { appSettings } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAppSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getAppSettings();
  async function save(formData: FormData) {
    "use server";
    await requireAdmin();
    await db
      .update(appSettings)
      .set({
        linkExpirationDays: Number(formData.get("linkExpirationDays") || 7),
        duplicateWindowMinutes: Number(formData.get("duplicateWindowMinutes") || 10),
        signedUrlTtlMinutes: Number(formData.get("signedUrlTtlMinutes") || 60),
        apiRateLimitPerMinute: Number(formData.get("apiRateLimitPerMinute") || 60),
        updatedAt: new Date(),
      })
      .where(eq(appSettings.id, "default"));
    redirect("/admin/settings?saved=1");
  }
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card className="mt-6">
        <form action={save} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Link expiration days<Input name="linkExpirationDays" type="number" defaultValue={settings.linkExpirationDays} className="mt-1" /></label>
          <label className="text-sm font-medium">Duplicate window minutes<Input name="duplicateWindowMinutes" type="number" defaultValue={settings.duplicateWindowMinutes} className="mt-1" /></label>
          <label className="text-sm font-medium">Signed URL TTL minutes<Input name="signedUrlTtlMinutes" type="number" defaultValue={settings.signedUrlTtlMinutes} className="mt-1" /></label>
          <label className="text-sm font-medium">API rate limit per minute<Input name="apiRateLimitPerMinute" type="number" defaultValue={settings.apiRateLimitPerMinute} className="mt-1" /></label>
          <div className="md:col-span-2"><Button type="submit">Save settings</Button></div>
        </form>
      </Card>
    </div>
  );
}
