"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MediaSetup } from "@/components/candidate/media-setup";
import { QuestionRecorder } from "@/components/candidate/question-recorder";
import { RecorderErrorBoundary } from "@/components/candidate/recorder-error-boundary";
import { CalendarClock, CheckCircle2, Clock3, ShieldCheck, Video } from "lucide-react";

type Landing = {
  id: string;
  title: string;
  description: string | null;
  candidateName: string;
  questionCount: number;
  completedCount: number;
  expiresAt: string;
  questions: Array<{ questionNumber: number; maxDurationSeconds: number | null; maxAttempts: number }>;
};

function formatDuration(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function CandidateAssessmentShell() {
  const [landing, setLanding] = useState<Landing | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/candidate/landing")
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error?.message || "Could not load assessment.");
        setLanding(data.assessment);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load assessment."));
  }, []);

  if (error) return <Card className="mx-auto max-w-2xl p-6"><h1 className="text-xl font-semibold">Assessment unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p></Card>;
  if (!landing) return <Card className="mx-auto max-w-2xl p-6">Loading assessment...</Card>;
  if (!started) {
    const limitedQuestions = landing.questions.filter((question) => question.maxDurationSeconds);
    const totalSeconds = limitedQuestions.reduce((sum, question) => sum + (question.maxDurationSeconds ?? 0), 0);
    const attempts = Array.from(new Set(landing.questions.map((question) => question.maxAttempts))).join(", ");
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">Hireboard<span className="text-primary">✦</span></div>
          <div className="hidden text-sm font-semibold text-muted-foreground sm:block">Secure video assessment</div>
        </div>
        <Card className="console-shell grid overflow-hidden lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="border-b bg-muted/45 p-8 lg:border-b-0 lg:border-r">
            <p className="section-label">Welcome</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">{landing.title}</h1>
            <p className="mt-5 leading-7 text-muted-foreground">
              Hello {landing.candidateName}. {landing.description || "Please complete this assessment in a quiet place with a stable internet connection."}
            </p>
            <div className="mt-8 space-y-3">
              {["Review instructions", "Check camera and microphone", "Record responses", "Submit assessment"].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold shadow-sm">
                  <span className={index === 0 ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white" : "flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"}>
                    {index + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </aside>
          <section className="p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="metric-panel">
                <Video className="h-5 w-5 text-primary" />
                <div className="mt-4 text-3xl font-bold">{landing.questionCount}</div>
                <p className="mt-1 text-sm font-medium text-muted-foreground">Questions</p>
              </div>
              <div className="metric-panel">
                <Clock3 className="h-5 w-5 text-indigo-600" />
                <div className="mt-4 text-3xl font-bold">{totalSeconds ? formatDuration(totalSeconds) : "Open"}</div>
                <p className="mt-1 text-sm font-medium text-muted-foreground">Maximum response time</p>
              </div>
              <div className="metric-panel">
                <CalendarClock className="h-5 w-5 text-amber-600" />
                <div className="mt-4 text-lg font-bold">{new Date(landing.expiresAt).toLocaleString()}</div>
                <p className="mt-1 text-sm font-medium text-muted-foreground">Link expires</p>
              </div>
              <div className="metric-panel">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div className="mt-4 text-3xl font-bold">{attempts}</div>
                <p className="mt-1 text-sm font-medium text-muted-foreground">Attempts per question</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-primary/15 bg-primary/5 p-5">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm leading-6 text-foreground">
                  Questions are revealed one at a time when recording begins. You cannot go back after choosing a final response.
                </p>
              </div>
            </div>

            <Button className="mt-8 h-12 px-6" onClick={() => setStarted(true)}>
              Check camera and microphone
            </Button>
          </section>
        </Card>
      </div>
    );
  }
  if (!stream) return <MediaSetup onReady={(next) => { setStream(next); void fetch("/api/candidate/media-check", { method: "POST" }); }} />;
  return (
    <RecorderErrorBoundary>
      <QuestionRecorder landing={landing} stream={stream} />
    </RecorderErrorBoundary>
  );
}
