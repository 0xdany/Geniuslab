import Link from "next/link";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/admin-nav";
import { UserCircle } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { SignOutButton } from "@/components/admin/sign-out-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-white/95 shadow-[0_1px_20px_rgba(29,31,42,0.04)] backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-5">
            <Link href="/admin" className="flex shrink-0 items-center gap-1 pr-1 text-xl font-bold tracking-tight">
              <span>Hireboard</span>
              <span className="text-primary">✦</span>
            </Link>
            <AdminNav />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-10 items-center gap-2 rounded-full border border-border/80 bg-white px-3 text-sm text-muted-foreground shadow-sm">
              <UserCircle className="h-4 w-4" />
              <span className="hidden max-w-[240px] truncate sm:inline-block">{admin.user.email}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 relative">
        {children}
      </main>
    </div>
  );
}
