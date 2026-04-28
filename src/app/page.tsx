import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SignInButton } from "@/components/admin/sign-in-button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Geniuslab</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Video assessment platform</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Intake candidates from external systems, send secure assessment links, capture spontaneous video responses, and
          review submissions efficiently.
        </p>
      </div>
      <Card className="max-w-xl">
        <h2 className="text-xl font-semibold">Admin access</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with the Google account configured as <code>INITIAL_ADMIN_EMAIL</code>, or an invited admin account.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <SignInButton />
          <Link href="/admin" className="text-sm font-medium text-primary">
            Open dashboard
          </Link>
        </div>
      </Card>
    </main>
  );
}
