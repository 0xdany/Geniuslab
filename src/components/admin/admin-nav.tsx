"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ClipboardList, KeyRound, PlusCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { name: "Assessments", href: "/admin", icon: ClipboardList },
  { name: "New Assessment", href: "/admin/assessments/new", icon: PlusCircle },
  { name: "API Keys", href: "/admin/api-keys", icon: KeyRound },
  { name: "API Logs", href: "/admin/api-logs", icon: Activity },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex max-w-[58vw] items-center gap-1 overflow-x-auto rounded-full border border-border/80 bg-muted/30 p-1">
      {links.map((link) => {
        const isActive =
          pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));
        const Icon = link.icon;

        return (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "relative inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors",
              isActive
                ? "bg-white text-primary shadow-sm ring-1 ring-primary/15"
                : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
