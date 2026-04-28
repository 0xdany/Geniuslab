import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { apiKeyUsage, apiKeys } from "@/db/schema";
import { ApiKeyManager } from "@/components/admin/api-key-manager";
import { createApiKey } from "@/lib/api-keys";
import { requireAdmin } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const keys = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  const usage = await db.select().from(apiKeyUsage).orderBy(desc(apiKeyUsage.createdAt)).limit(25);

  async function createAction(formData: FormData) {
    "use server";
    const admin = await requireAdmin();
    const created = await createApiKey(String(formData.get("name") || "API key"), admin.user.id);
    redirect(`/admin/api-keys?created=${encodeURIComponent(created.rawKey)}`);
  }

  async function revokeAction(formData: FormData) {
    "use server";
    await requireAdmin();
    await db.update(apiKeys).set({ status: "revoked", revokedAt: new Date() }).where(eq(apiKeys.id, String(formData.get("id"))));
    redirect("/admin/api-keys");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">API keys</h1>
      <p className="mt-1 text-sm text-muted-foreground">Generate, revoke, and audit external integration keys.</p>
      <div className="mt-6">
        <ApiKeyManager keys={keys} usage={usage} createdKey={params.created} createAction={createAction} revokeAction={revokeAction} />
      </div>
    </div>
  );
}
