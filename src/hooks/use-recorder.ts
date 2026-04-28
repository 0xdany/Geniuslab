"use client";

import { useRef, useState } from "react";
import { extensionForMimeType, pickSupportedRecorderMimeType } from "@/lib/media/mime-types";
import { clearRecordingChunks, loadRecordingChunks, saveRecordingChunk } from "@/hooks/use-upload-queue";

export function useRecorder(stream: MediaStream | null) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const startedAtRef = useRef<number>(0);
  const chunkIndexRef = useRef(0);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(attemptId: string) {
    if (!stream) throw new Error("Camera and microphone are not ready.");
    const mimeType = pickSupportedRecorderMimeType();
    if (!mimeType) throw new Error("This browser does not support the required recording formats.");
    setError(null);
    chunkIndexRef.current = 0;
    startedAtRef.current = Date.now();
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        void saveRecordingChunk(attemptId, chunkIndexRef.current++, event.data);
      }
    };
    recorder.onerror = () => setError("Recording failed. Your saved chunks will be preserved for retry.");
    recorder.start(1000);
    recorderRef.current = recorder;
    setRecording(true);
    return { mimeType, fileExtension: extensionForMimeType(mimeType) };
  }

  async function stop(attemptId: string) {
    const recorder = recorderRef.current;
    if (!recorder) throw new Error("Recorder is not active.");
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    setRecording(false);
    const chunks = await loadRecordingChunks(attemptId);
    const mimeType = recorder.mimeType || "video/webm";
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
    return { blob: new Blob(chunks, { type: mimeType }), mimeType, durationSeconds };
  }

  return { recording, error, start, stop, clearRecordingChunks };
}
