"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCountdown } from "@/hooks/use-countdown";
import { useRecorder } from "@/hooks/use-recorder";
import { UploadRecoveryBanner } from "@/components/candidate/upload-recovery-banner";

type Landing = {
  id: string;
  title: string;
  questionCount: number;
  questions: Array<{ questionNumber: number; maxDurationSeconds: number | null; maxAttempts: number }>;
};

type ActiveQuestion = {
  id: string;
  questionNumber: number;
  text: string;
  maxDurationSeconds: number | null;
  maxAttempts: number;
  attemptId: string;
  attemptNumber: number;
};

export function QuestionRecorder({ landing, stream }: { landing: Landing; stream: MediaStream }) {
  const recorder = useRecorder(stream);
  const [active, setActive] = useState<ActiveQuestion | null>(null);
  const [completed, setCompleted] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const stop = useCallback(async () => {
    if (!active) return;
    setBusy(true);
    setStatus("Uploading your saved recording. If the network drops, the recording remains preserved in this browser.");
    try {
      const stopped = await recorder.stop(active.attemptId);
      const uploadSession = await fetch("/api/candidate/responses/upload-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptId: active.attemptId,
          mimeType: stopped.mimeType,
          fileExtension: stopped.mimeType.includes("mp4") ? "mp4" : "webm",
          browserName: navigator.userAgent,
          browserVersion: navigator.userAgent,
        }),
      }).then((res) => res.json());
      if (!uploadSession.success) throw new Error(uploadSession.error?.message || "Could not create upload session.");
      const upload = await fetch(uploadSession.uploadUrl, {
        method: "PUT",
        headers: { "content-type": stopped.mimeType, "content-length": String(stopped.blob.size) },
        body: stopped.blob,
      });
      if (!upload.ok) throw new Error(`Upload failed with ${upload.status}.`);
      const complete = await fetch("/api/candidate/responses/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptId: active.attemptId,
          uploadSessionId: uploadSession.uploadSessionId,
          durationSeconds: stopped.durationSeconds,
        }),
      }).then((res) => res.json());
      if (!complete.success) throw new Error(complete.error?.message || "Could not finalize recording.");
      await recorder.clearRecordingChunks(active.attemptId);
      setCompleted((value) => value + 1);
      setActive(null);
      setStatus("Response saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed. Your recording chunks are preserved for retry.");
    } finally {
      setBusy(false);
    }
  }, [active, recorder]);

  useCountdown(recorder.recording, active?.maxDurationSeconds, () => void stop());

  async function startQuestion() {
    const nextNumber = completed + 1;
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/candidate/questions/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionNumber: nextNumber }),
      }).then((res) => res.json());
      if (!response.success) throw new Error(response.error?.message || "Could not start question.");
      const question = response.question as ActiveQuestion;
      await recorder.start(question.attemptId);
      setActive(question);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not start recording.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAssessment() {
    setBusy(true);
    const response = await fetch("/api/candidate/submit", { method: "POST" }).then((res) => res.json());
    if (response.success) window.location.href = "/assessment/complete";
    else setStatus(response.error?.message || "Could not submit assessment.");
    setBusy(false);
  }

  const done = completed >= landing.questionCount;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{landing.title}</h2>
          <p className="text-sm text-muted-foreground">Question {Math.min(completed + 1, landing.questionCount)} of {landing.questionCount}</p>
        </div>
        {recorder.recording ? <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">REC</span> : null}
      </div>
      {status ? <div className="mt-4"><UploadRecoveryBanner message={status} /></div> : null}
      {recorder.error ? <div className="mt-4"><UploadRecoveryBanner message={recorder.error} /></div> : null}
      <div className="mt-6 min-h-40 rounded-lg border bg-muted p-5">
        {active ? (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Question {active.questionNumber}</p>
            <h3 className="mt-2 text-2xl font-semibold">{active.text}</h3>
            <p className="mt-3 text-sm text-muted-foreground">Attempt {active.attemptNumber} of {active.maxAttempts}</p>
          </div>
        ) : done ? (
          <div>
            <h3 className="text-2xl font-semibold">All responses are recorded</h3>
            <p className="mt-2 text-sm text-muted-foreground">Submit your assessment to lock your responses and send confirmation.</p>
          </div>
        ) : (
          <div>
            <h3 className="text-2xl font-semibold">Ready for question {completed + 1}</h3>
            <p className="mt-2 text-sm text-muted-foreground">The question will appear when recording starts.</p>
          </div>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-3">
        {active ? <Button disabled={busy} onClick={() => void stop()}>Stop recording</Button> : null}
        {!active && !done ? <Button disabled={busy} onClick={() => void startQuestion()}>Start question {completed + 1}</Button> : null}
        {done ? <Button disabled={busy} onClick={() => void submitAssessment()}>Submit assessment</Button> : null}
      </div>
    </Card>
  );
}
