"use client";

import { useCallback, useState } from "react";

export function useMediaDevices() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async () => {
    setError(null);
    try {
      const next = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(next);
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Camera or microphone permission was denied.");
      return null;
    }
  }, []);

  return { stream, error, request };
}
