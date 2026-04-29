import Link from "next/link";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/admin-nav";
import { UserCircle } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-background";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center space-x-2 text-xl font-bold tracking-tight">
              <span>Geniuslab<span className="text-primary">✦</span></span>
            </Link>
            <AdminNav />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-muted/45 px-3 py-1.5 text-sm text-muted-foreground">
            <UserCircle className="w-4 h-4" />
            <span className="hidden max-w-[240px] truncate sm:inline-block">{admin.user.email}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 relative">
        {children}
      </main>
    </div>
  );
}
