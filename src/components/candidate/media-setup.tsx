"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMediaDevices } from "@/hooks/use-media-devices";
import { AudioMeter } from "@/components/candidate/audio-meter";

export function MediaSetup({ onReady }: { onReady: (stream: MediaStream) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, error, request } = useMediaDevices();
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <Card>
      <h2 className="text-xl font-semibold">Camera and microphone check</h2>
      <p className="mt-2 text-sm text-muted-foreground">Turn on your camera and microphone before starting. They stay active during the assessment.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full rounded-md" />
        <div className="space-y-4">
          <Button type="button" onClick={() => void request()}>Enable camera and microphone</Button>
          {stream ? <AudioMeter stream={stream} /> : null}
          {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          {stream ? <Button type="button" onClick={() => onReady(stream)}>Camera and microphone are working</Button> : null}
        </div>
      </div>
    </Card>
  );
}
