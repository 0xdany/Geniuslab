import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function ApiKeyManager({
  keys,
  createdKey,
  createAction,
  revokeAction,
}: {
  keys: Array<{ id: string; name: string; prefix: string; status: string; lastUsedAt: Date | null; createdAt: Date }>;
  createdKey?: string;
  createAction: (formData: FormData) => void | Promise<void>;
  revokeAction: (formData: FormData) => void | Promise<void>;
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
      <form action={createAction} className="flex gap-3 rounded-lg border bg-white p-4">
        <Input name="name" required placeholder="API key name, e.g. Demo ATS" />
        <Button type="submit">Generate</Button>
      </form>
      <div className="overflow-hidden rounded-lg border bg-white">
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
                <td className="px-4 py-3"><Badge>{key.status}</Badge></td>
                <td className="px-4 py-3">{key.lastUsedAt ? key.lastUsedAt.toLocaleString() : "Never"}</td>
                <td className="px-4 py-3 text-right">
                  {key.status === "active" ? (
                    <form action={revokeAction}>
                      <input type="hidden" name="id" value={key.id} />
                      <Button className="h-8 bg-white text-foreground ring-1 ring-border hover:bg-muted">Revoke</Button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
