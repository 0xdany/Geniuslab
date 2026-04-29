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
      <header className="sticky top-0 z-50 w-full border-b border-border/40 glass">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="font-bold inline-block text-gradient">Geniuslab</span>
            </Link>
            <AdminNav />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
            <UserCircle className="w-4 h-4" />
            <span className="hidden sm:inline-block">{admin.user.email}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 relative">
        {children}
      </main>
    </div>
  );
}
