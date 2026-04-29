"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { name: "Assessments", href: "/admin" },
  { name: "New Assessment", href: "/admin/assessments/new" },
  { name: "API Keys", href: "/admin/api-keys" },
  { name: "API Logs", href: "/admin/api-logs" },
  { name: "Settings", href: "/admin/settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex max-w-[62vw] items-center gap-1 overflow-x-auto">
      {links.map((link) => {
        const isActive =
          pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));

        return (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "relative rounded-md px-3 py-2 text-sm font-semibold transition-colors",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
