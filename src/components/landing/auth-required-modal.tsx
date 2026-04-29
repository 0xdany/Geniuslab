"use client";

import Link from "next/link";
import { LockKeyhole, X } from "lucide-react";
import { SignInButton } from "@/components/admin/sign-in-button";

export function AuthRequiredModal() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>

        <h2 className="mt-5 text-2xl font-bold tracking-tight">Sign in required</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The dashboard and integration settings are only available to authorized admins. Sign in with Google to continue.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <SignInButton />
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-semibold shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            Stay on homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
