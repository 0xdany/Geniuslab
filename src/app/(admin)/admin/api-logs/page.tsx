import Link from "next/link";
import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { apiKeys, apiRequestLogs } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function ApiLogsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const keys = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  const filters = [
    params.apiKeyId ? eq(apiRequestLogs.apiKeyId, params.apiKeyId) : undefined,
    params.method ? eq(apiRequestLogs.method, params.method.toUpperCase()) : undefined,
    params.path ? ilike(apiRequestLogs.path, `%${params.path}%`) : undefined,
    params.statusCode ? eq(apiRequestLogs.statusCode, Number(params.statusCode)) : undefined,
    params.errorCode ? ilike(apiRequestLogs.errorCode, `%${params.errorCode}%`) : undefined,
    params.from ? gte(apiRequestLogs.createdAt, new Date(params.from)) : undefined,
    params.to ? lte(apiRequestLogs.createdAt, new Date(params.to)) : undefined,
  ].filter(Boolean);

  const logs = await db
    .select({
      id: apiRequestLogs.id,
      apiKeyId: apiRequestLogs.apiKeyId,
      method: apiRequestLogs.method,
      path: apiRequestLogs.path,
      statusCode: apiRequestLogs.statusCode,
      errorCode: apiRequestLogs.errorCode,
      createdAt: apiRequestLogs.createdAt,
      keyName: apiKeys.name,
      keyPrefix: apiKeys.prefix,
    })
    .from(apiRequestLogs)
    .leftJoin(apiKeys, eq(apiKeys.id, apiRequestLogs.apiKeyId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(apiRequestLogs.createdAt))
    .limit(100);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">API request logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Audit intake and video retrieval requests. Signed video URLs are never stored in these logs.
        </p>
      </div>

      <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4 lg:grid-cols-8">
        <select name="apiKeyId" defaultValue={params.apiKeyId || ""} className="h-10 rounded-md border bg-white px-3 text-sm">
          <option value="">All API keys</option>
          {keys.map((key) => (
            <option key={key.id} value={key.id}>{key.name}</option>
          ))}
        </select>
        <select name="method" defaultValue={params.method || ""} className="h-10 rounded-md border bg-white px-3 text-sm">
          <option value="">All methods</option>
          {["GET", "POST", "PUT", "DELETE"].map((method) => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
        <Input name="path" placeholder="Route contains" defaultValue={params.path} />
        <Input name="statusCode" type="number" placeholder="Status" defaultValue={params.statusCode} />
        <Input name="errorCode" placeholder="Error code" defaultValue={params.errorCode} />
        <Input name="from" type="date" defaultValue={params.from} />
        <Input name="to" type="date" defaultValue={params.to} />
        <Button type="submit">Filter</Button>
      </form>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">API key</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-3 whitespace-nowrap">{log.createdAt.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {log.apiKeyId ? (
                    <Link href={`/admin/api-logs?apiKeyId=${log.apiKeyId}`} className="font-medium text-primary">
                      {log.keyName || "Unknown key"}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Unauthenticated</span>
                  )}
                  {log.keyPrefix ? <div className="text-xs text-muted-foreground">{log.keyPrefix}</div> : null}
                </td>
                <td className="px-4 py-3">{log.method}</td>
                <td className="px-4 py-3"><code>{log.path}</code></td>
                <td className="px-4 py-3">{log.statusCode}</td>
                <td className="px-4 py-3">{log.errorCode || "-"}</td>
              </tr>
            ))}
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No API requests match these filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
