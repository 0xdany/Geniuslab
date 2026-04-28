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

  if (error) return <Card><h1 className="text-xl font-semibold">Assessment unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p></Card>;
  if (!landing) return <Card>Loading assessment...</Card>;
  if (!started) {
    const limitedQuestions = landing.questions.filter((question) => question.maxDurationSeconds);
    const totalSeconds = limitedQuestions.reduce((sum, question) => sum + (question.maxDurationSeconds ?? 0), 0);
    const attempts = Array.from(new Set(landing.questions.map((question) => question.maxAttempts))).join(", ");
    return (
      <Card className="space-y-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Video assessment</p>
          <h1 className="mt-1 text-2xl font-semibold">{landing.title}</h1>
          <p className="mt-3 text-muted-foreground">
            Hello {landing.candidateName}. {landing.description || "Please complete this assessment in a quiet place with a stable internet connection."}
          </p>
        </div>
        <dl className="grid gap-3 text-sm md:grid-cols-4">
          <div><dt className="font-medium">Questions</dt><dd>{landing.questionCount}</dd></div>
          <div><dt className="font-medium">Time</dt><dd>{totalSeconds ? `Up to ${formatDuration(totalSeconds)}` : "No fixed limit"}</dd></div>
          <div><dt className="font-medium">Expires</dt><dd>{new Date(landing.expiresAt).toLocaleString()}</dd></div>
          <div><dt className="font-medium">Attempts</dt><dd>{attempts} per question</dd></div>
        </dl>
        <div className="rounded-md border bg-muted p-4 text-sm leading-6">
          Questions are revealed one at a time only when recording begins. There is no preparation time between questions,
          and you cannot go back after you choose a final response.
        </div>
        <div>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => setStarted(true)}>
            Check camera and microphone
          </button>
        </div>
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
