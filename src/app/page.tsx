import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SignInButton } from "@/components/admin/sign-in-button";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { HeroCardSwap } from "@/components/landing/hero-card-swap";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          Hireboard<span className="text-primary">✦</span>
        </Link>
        <div className="flex items-center gap-3">
          <SignInButton />
          <Link
            href="/admin"
            className="hidden h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-semibold shadow-sm transition-colors hover:border-primary/30 hover:text-primary sm:inline-flex"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-10 lg:grid-cols-[0.92fr_1.08fr] lg:pt-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            Interview management for high-signal hiring
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[1.04] tracking-tight text-foreground sm:text-6xl">
            A calm, polished command center for video assessment.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Intake candidates from any hiring system, guide them through a stress-free recording flow, and review every response in one fast workspace.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin"
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Open workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/admin/api-keys"
              className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-white px-6 text-sm font-semibold shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
            >
              Manage integrations
            </Link>
          </div>
        </div>

        <HeroCardSwap />
      </section>
    </main>
  );
}
