import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Activity, KeyRound, Plus, ShieldAlert } from "lucide-react";

export function ApiKeyManager({
  keys,
  createdKey,
  createAction,
  revokeAction,
  usage,
}: {
  keys: Array<{ id: string; name: string; prefix: string; status: string; lastUsedAt: Date | null; createdAt: Date }>;
  createdKey?: string;
  createAction: (formData: FormData) => void | Promise<void>;
  revokeAction: (formData: FormData) => void | Promise<void>;
  usage: Array<{ id: string; apiKeyId: string | null; route: string; method: string; statusCode: number; createdAt: Date }>;
}) {
  return (
    <div className="space-y-5">
      {createdKey ? (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm">
          <div className="font-medium">New API key</div>
          <code className="mt-2 block break-all rounded bg-white p-3">{createdKey}</code>
          <p className="mt-2 text-green-800">Store it now. Only the hash is saved.</p>
        </div>
      ) : null}
      <form action={createAction} className="console-shell flex flex-col gap-3 p-4 sm:flex-row">
        <Input name="name" required placeholder="API key name, e.g. Demo ATS" />
        <Button type="submit"><Plus className="mr-2 h-4 w-4" />Generate</Button>
      </form>
      <div className="console-shell overflow-hidden">
        <div className="flex items-center gap-2 border-b bg-muted/35 px-5 py-4">
          <KeyRound className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Active credentials</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Prefix</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last used</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} className="border-t">
                <td className="px-4 py-3">{key.name}</td>
                <td className="px-4 py-3"><code>{key.prefix}</code></td>
                <td className="px-4 py-3"><Badge variant={key.status === "active" ? "default" : "secondary"}>{key.status}</Badge></td>
                <td className="px-4 py-3">{key.lastUsedAt ? key.lastUsedAt.toLocaleString() : "Never"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/api-logs?apiKeyId=${key.id}`}
                      className="inline-flex h-8 items-center rounded-md bg-white px-3 text-sm font-medium text-foreground ring-1 ring-border hover:bg-muted"
                    >
                      Logs
                    </Link>
                    {key.status === "active" ? (
                      <form action={revokeAction}>
                        <input type="hidden" name="id" value={key.id} />
                        <Button variant="outline" className="h-8"><ShieldAlert className="mr-2 h-4 w-4" />Revoke</Button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="console-shell overflow-hidden">
        <div className="border-b bg-muted/35 px-4 py-3">
          <h2 className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-primary" />Recent API usage</h2>
          <p className="text-sm text-muted-foreground">Latest authenticated requests across active and revoked keys.</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((event) => (
              <tr key={event.id} className="border-t">
                <td className="px-4 py-3">{event.createdAt.toLocaleString()}</td>
                <td className="px-4 py-3">{event.method}</td>
                <td className="px-4 py-3"><code>{event.route}</code></td>
                <td className="px-4 py-3">{event.statusCode}</td>
              </tr>
            ))}
            {usage.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No API usage yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
