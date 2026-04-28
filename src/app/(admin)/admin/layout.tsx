import Link from "next/link";
import { requireAdmin } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-semibold">
            Geniuslab Review
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/assessments/new">New assessment</Link>
            <Link href="/admin/api-keys">API keys</Link>
            <Link href="/admin/api-logs">API logs</Link>
            <Link href="/admin/settings">Settings</Link>
            <span className="text-muted-foreground">{admin.user.email}</span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
