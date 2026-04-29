"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
    <nav className="flex items-center gap-1 sm:gap-2">
      {links.map((link) => {
        const isActive =
          pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));

        return (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "relative px-3 py-1.5 text-sm font-medium transition-colors rounded-md",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-nav"
                className="absolute inset-0 bg-primary/10 rounded-md -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
