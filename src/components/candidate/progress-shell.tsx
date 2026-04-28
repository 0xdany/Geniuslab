"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MediaSetup } from "@/components/candidate/media-setup";
import { QuestionRecorder } from "@/components/candidate/question-recorder";
import { RecorderErrorBoundary } from "@/components/candidate/recorder-error-boundary";

type Landing = {
  id: string;
  title: string;
  description: string | null;
  candidateName: string;
  questionCount: number;
  expiresAt: string;
  questions: Array<{ questionNumber: number; maxDurationSeconds: number | null; maxAttempts: number }>;
};

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

  if (error) return <Card><h1 className="text-xl font-semibold">Assessment unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p></Card>;
  if (!landing) return <Card>Loading assessment...</Card>;
  if (!started) {
    return (
      <Card>
        <h1 className="text-2xl font-semibold">Hello {landing.candidateName}</h1>
        <p className="mt-2 text-muted-foreground">{landing.description || "Please complete this assessment in a quiet place."}</p>
        <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
          <div><dt className="font-medium">Questions</dt><dd>{landing.questionCount}</dd></div>
          <div><dt className="font-medium">Expires</dt><dd>{new Date(landing.expiresAt).toLocaleString()}</dd></div>
          <div><dt className="font-medium">Attempts</dt><dd>{landing.questions.map((q) => q.maxAttempts).join(", ")}</dd></div>
        </dl>
        <div className="mt-5 rounded-md border bg-muted p-4 text-sm">
          Questions are revealed one at a time only when recording begins. There is no preparation time between questions.
        </div>
        <div className="mt-5"><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => setStarted(true)}>Begin assessment setup</button></div>
      </Card>
    );
  }
  if (!stream) return <MediaSetup onReady={(next) => { setStream(next); void fetch("/api/candidate/media-check", { method: "POST" }); }} />;
  return (
    <RecorderErrorBoundary>
      <QuestionRecorder landing={landing} stream={stream} />
    </RecorderErrorBoundary>
  );
}
