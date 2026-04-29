import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SignInButton } from "@/components/admin/sign-in-button";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/animation-wrapper";

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-12">
      <AnimatedBackground />
      
      <StaggerContainer className="relative z-10 flex flex-col items-center text-center mb-16">
        <StaggerItem>
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
            ✨ Geniuslab Platform
          </div>
        </StaggerItem>
        <StaggerItem>
          <h1 className="mt-3 text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
            Next-gen video <span className="text-gradient">assessment</span>
          </h1>
        </StaggerItem>
        <StaggerItem>
          <p className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Intake candidates from external systems, send secure assessment links, capture spontaneous video responses, and
            review submissions efficiently in one unified platform.
          </p>
        </StaggerItem>
      </StaggerContainer>

      <FadeIn delay={0.4} className="flex justify-center relative z-10">
        <Card className="max-w-xl w-full border-primary/20 shadow-2xl shadow-primary/10 bg-white/60 dark:bg-black/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription className="text-base mt-2">
              Sign in with your configured Google account or an invited admin email to manage assessments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
              <SignInButton />
              <div className="h-px w-full sm:h-8 sm:w-px bg-border my-2 sm:my-0"></div>
              <Link 
                href="/admin" 
                className="group relative inline-flex h-10 items-center justify-center rounded-md border border-input bg-transparent px-8 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                Open Dashboard
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </main>
  );
}
