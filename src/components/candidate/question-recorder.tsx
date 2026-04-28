"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCountdown } from "@/hooks/use-countdown";
import { useRecorder } from "@/hooks/use-recorder";
import {
  clearPendingRecording,
  clearRecordingChunks,
  listPendingRecordings,
  loadRecordingChunks,
  savePendingRecording,
} from "@/hooks/use-upload-queue";
import { UploadRecoveryBanner } from "@/components/candidate/upload-recovery-banner";

type Landing = {
  id: string;
  title: string;
  questionCount: number;
  completedCount?: number;
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

type StoppedAttempt = {
  question: ActiveQuestion;
  attemptId: string;
  mimeType: string;
  durationSeconds: number;
  uploaded: boolean;
};

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function QuestionRecorder({ landing, stream }: { landing: Landing; stream: MediaStream }) {
  const recorder = useRecorder(stream);
  const [active, setActive] = useState<ActiveQuestion | null>(null);
  const [stoppedAttempt, setStoppedAttempt] = useState<StoppedAttempt | null>(null);
  const [completed, setCompleted] = useState(landing.completedCount ?? 0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (!recorder.recording || !startedAt) return;
    const tick = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => window.clearInterval(tick);
  }, [recorder.recording, startedAt]);

  useEffect(() => {
    let mounted = true;
    listPendingRecordings()
      .then((pending) => {
        if (!mounted || active || stoppedAttempt) return;
        const recovered = pending.find(
          (item) => item.questionNumber > completed && item.questionNumber <= landing.questionCount,
        );
        if (!recovered) return;
        setStoppedAttempt({
          question: {
            id: recovered.questionId,
            questionNumber: recovered.questionNumber,
            text: recovered.questionText,
            maxDurationSeconds: recovered.maxDurationSeconds,
            maxAttempts: recovered.maxAttempts,
            attemptId: recovered.attemptId,
            attemptNumber: recovered.attemptNumber,
          },
          attemptId: recovered.attemptId,
          mimeType: recovered.mimeType,
          durationSeconds: recovered.durationSeconds ?? 1,
          uploaded: recovered.uploaded ?? false,
        });
        setStatus("We found a saved recording in this browser. You can retry the upload before continuing.");
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [active, completed, landing.questionCount, stoppedAttempt]);

  const finishQuestion = useCallback(async (attemptId: string) => {
    const response = await fetch("/api/candidate/responses/finalize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ attemptId }),
    }).then((res) => res.json());
    if (!response.success) throw new Error(response.error?.message || "Could not save this response.");
    await clearRecordingChunks(attemptId);
    await clearPendingRecording(attemptId);
    setCompleted((value) => value + 1);
    setActive(null);
    setStoppedAttempt(null);
    setStartedAt(null);
    setElapsed(0);
    setStatus("Response saved. You can continue when you are ready.");
  }, []);

  const handleUseSavedResponse = useCallback(async (attemptId: string) => {
    setBusy(true);
    try {
      await finishQuestion(attemptId);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not use this response yet. Try uploading again.");
    } finally {
      setBusy(false);
    }
  }, [finishQuestion]);

  const uploadAttempt = useCallback(async (attempt: StoppedAttempt, finalizeResponse: boolean) => {
    setBusy(true);
    setStatus("Saving your recording. If the connection drops, this browser keeps a local recovery copy.");
    try {
      const chunks = await loadRecordingChunks(attempt.attemptId);
      const blob = new Blob(chunks, { type: attempt.mimeType });
      if (!blob.size) throw new Error("No saved recording chunks were found in this browser.");
      const uploadSession = await fetch("/api/candidate/responses/upload-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.attemptId,
          mimeType: attempt.mimeType,
          fileExtension: attempt.mimeType.includes("mp4") ? "mp4" : "webm",
          browserName: navigator.userAgent,
          browserVersion: navigator.userAgent,
        }),
      }).then((res) => res.json());
      if (!uploadSession.success) throw new Error(uploadSession.error?.message || "Could not create upload session.");
      const upload = await fetch(uploadSession.uploadUrl, {
        method: "PUT",
        headers: { "content-type": attempt.mimeType },
        body: blob,
      });
      if (!upload.ok) throw new Error(`Upload failed with ${upload.status}.`);
      const complete = await fetch("/api/candidate/responses/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.attemptId,
          uploadSessionId: uploadSession.uploadSessionId,
          durationSeconds: attempt.durationSeconds,
          finalizeResponse,
        }),
      }).then((res) => res.json());
      if (!complete.success) throw new Error(complete.error?.message || "Could not finalize recording.");
      if (finalizeResponse) {
        await clearRecordingChunks(attempt.attemptId);
        await clearPendingRecording(attempt.attemptId);
        setCompleted((value) => value + 1);
        setStoppedAttempt(null);
        setStatus("Response saved. You can continue when you are ready.");
      } else {
        await savePendingRecording({
          attemptId: attempt.attemptId,
          questionId: attempt.question.id,
          questionNumber: attempt.question.questionNumber,
          questionText: attempt.question.text,
          maxDurationSeconds: attempt.question.maxDurationSeconds,
          maxAttempts: attempt.question.maxAttempts,
          attemptNumber: attempt.question.attemptNumber,
          mimeType: attempt.mimeType,
          durationSeconds: attempt.durationSeconds,
          uploaded: true,
        });
        setStoppedAttempt({ ...attempt, uploaded: true });
        setStatus("Recording saved. You can use this response or record another attempt.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed. Your saved recording is still available to retry.");
    } finally {
      setBusy(false);
    }
  }, []);

  const stop = useCallback(async () => {
    if (!active) return;
    setBusy(true);
    setStatus("Stopping recording and preparing your saved response...");
    try {
      const stopped = await recorder.stop(active.attemptId);
      const attempt: StoppedAttempt = {
        question: active,
        attemptId: active.attemptId,
        mimeType: stopped.mimeType,
        durationSeconds: stopped.durationSeconds,
        uploaded: false,
      };
      await savePendingRecording({
        attemptId: active.attemptId,
        questionId: active.id,
        questionNumber: active.questionNumber,
        questionText: active.text,
        maxDurationSeconds: active.maxDurationSeconds,
        maxAttempts: active.maxAttempts,
        attemptNumber: active.attemptNumber,
        mimeType: stopped.mimeType,
        durationSeconds: stopped.durationSeconds,
        uploaded: false,
      });
      setActive(null);
      setStoppedAttempt(attempt);
      setStartedAt(null);
      setElapsed(stopped.durationSeconds);
      const mustFinalize = active.maxAttempts === 1 || active.attemptNumber >= active.maxAttempts;
      await uploadAttempt(attempt, mustFinalize);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Recording could not be stopped safely.");
    } finally {
      setBusy(false);
    }
  }, [active, recorder, uploadAttempt]);

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
      const recording = await recorder.start(question.attemptId);
      await savePendingRecording({
        attemptId: question.attemptId,
        questionId: question.id,
        questionNumber: question.questionNumber,
        questionText: question.text,
        maxDurationSeconds: question.maxDurationSeconds,
        maxAttempts: question.maxAttempts,
        attemptNumber: question.attemptNumber,
        mimeType: recording.mimeType,
      });
      setStoppedAttempt(null);
      setStartedAt(Date.now());
      setElapsed(0);
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
  const visibleQuestion = active ?? stoppedAttempt?.question ?? null;
  const remaining = active?.maxDurationSeconds ? Math.max(0, active.maxDurationSeconds - elapsed) : null;
  const attemptsRemaining = stoppedAttempt
    ? stoppedAttempt.question.maxAttempts - stoppedAttempt.question.attemptNumber
    : 0;

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{landing.title}</h2>
          <p className="text-sm text-muted-foreground">
            Question {Math.min(completed + 1, landing.questionCount)} of {landing.questionCount}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {recorder.recording ? <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">REC</span> : null}
          {recorder.recording ? <span className="text-sm font-medium">{formatSeconds(elapsed)}</span> : null}
          {remaining !== null ? <span className="text-sm text-muted-foreground">{formatSeconds(remaining)} left</span> : null}
        </div>
      </div>
      {status ? <div className="mt-4"><UploadRecoveryBanner message={status} /></div> : null}
      {recorder.error ? <div className="mt-4"><UploadRecoveryBanner message={recorder.error} /></div> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <section className="min-h-48 rounded-lg border bg-muted p-5">
          {visibleQuestion ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Question {visibleQuestion.questionNumber}</p>
              <h3 className="mt-2 text-2xl font-semibold leading-snug">{visibleQuestion.text}</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Attempt {visibleQuestion.attemptNumber} of {visibleQuestion.maxAttempts}
              </p>
              {stoppedAttempt && !stoppedAttempt.uploaded ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Your recording is saved locally in this browser until the upload succeeds.
                </p>
              ) : null}
              {stoppedAttempt?.uploaded && attemptsRemaining > 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  You have {attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"} remaining. Use this response when you are satisfied.
                </p>
              ) : null}
            </div>
          ) : done ? (
            <div>
              <h3 className="text-2xl font-semibold">All responses are recorded</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Submit your assessment to lock your responses and send your confirmation.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-semibold">Ready for question {completed + 1}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The question appears at the same moment recording starts. Take a breath, then begin when ready.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-white p-3">
          <div className="relative overflow-hidden rounded-md">
            <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
            {recorder.recording ? (
              <div className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
                Recording
              </div>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Keep your face centered and speak naturally. Your camera and microphone stay active so there is no extra setup between questions.
          </p>
        </section>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {active ? <Button disabled={busy} onClick={() => void stop()}>Stop recording</Button> : null}
        {!active && !stoppedAttempt && !done ? <Button disabled={busy} onClick={() => void startQuestion()}>Start question {completed + 1}</Button> : null}
        {stoppedAttempt && !stoppedAttempt.uploaded ? (
          <Button disabled={busy} onClick={() => void uploadAttempt(stoppedAttempt, stoppedAttempt.question.maxAttempts === 1 || stoppedAttempt.question.attemptNumber >= stoppedAttempt.question.maxAttempts)}>
            Retry upload
          </Button>
        ) : null}
        {stoppedAttempt?.uploaded ? (
          <Button disabled={busy} onClick={() => void handleUseSavedResponse(stoppedAttempt.attemptId)}>
            Use this response
          </Button>
        ) : null}
        {stoppedAttempt?.uploaded && attemptsRemaining > 0 ? (
          <Button
            disabled={busy}
            className="bg-white text-foreground ring-1 ring-border hover:bg-muted"
            onClick={() => {
              void clearRecordingChunks(stoppedAttempt.attemptId);
              void clearPendingRecording(stoppedAttempt.attemptId);
              setStoppedAttempt(null);
              void startQuestion();
            }}
          >
            Record another attempt
          </Button>
        ) : null}
        {done ? <Button disabled={busy} onClick={() => void submitAssessment()}>Submit assessment</Button> : null}
      </div>
    </Card>
  );
}
