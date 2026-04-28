import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { adminInvites, appSettings, emailMessages } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FailedEmailTable } from "@/components/admin/failed-email-table";
import { getAppSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getAppSettings();
  const invites = await db.select().from(adminInvites).orderBy(desc(adminInvites.createdAt));
  const failedEmails = await db
    .select()
    .from(emailMessages)
    .where(eq(emailMessages.status, "failed"))
    .orderBy(desc(emailMessages.createdAt))
    .limit(20);
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
  async function inviteAdmin(formData: FormData) {
    "use server";
    const admin = await requireAdmin();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    if (!email) redirect("/admin/settings");
    await db
      .insert(adminInvites)
      .values({ email, invitedByUserId: admin.user.id })
      .onConflictDoNothing();
    redirect("/admin/settings?invited=1");
  }
  return (
    <div className="max-w-3xl space-y-6">
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
      <Card>
        <h2 className="text-lg font-semibold">Admin invites</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Invited Google accounts receive admin access the first time they sign in.
        </p>
        <form action={inviteAdmin} className="mt-4 flex gap-3">
          <Input name="email" type="email" required placeholder="teammate@example.com" />
          <Button type="submit">Invite admin</Button>
        </form>
        <div className="mt-4 overflow-hidden rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Accepted</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} className="border-t">
                  <td className="px-3 py-2">{invite.email}</td>
                  <td className="px-3 py-2">{invite.createdAt.toLocaleString()}</td>
                  <td className="px-3 py-2">{invite.acceptedAt ? invite.acceptedAt.toLocaleString() : "Pending"}</td>
                </tr>
              ))}
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">No admin invites yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">Failed emails</h2>
        <p className="mt-1 text-sm text-muted-foreground">Retry invitation or completion emails after provider errors are fixed.</p>
        <div className="mt-4">
          <FailedEmailTable emails={failedEmails.filter((email) => email.assessmentId).map((email) => ({
            id: email.id,
            toEmail: email.toEmail,
            subject: email.subject,
            errorMessage: email.errorMessage,
          }))} />
        </div>
      </Card>
    </div>
  );
}
