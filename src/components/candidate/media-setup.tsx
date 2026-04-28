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
    <Card className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Camera and microphone check</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We will show your camera preview here first. Once everything looks and sounds right, the same stream stays active for the assessment.
        </p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full rounded-md object-cover" />
        <div className="space-y-4">
          <Button type="button" onClick={() => void request()}>
            Enable camera and microphone
          </Button>
          {stream ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Microphone level</p>
              <AudioMeter stream={stream} />
              <p className="text-sm text-muted-foreground">Speak normally and make sure the bar moves.</p>
            </div>
          ) : null}
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
              Camera or microphone access was blocked. Use your browser&apos;s site settings to allow both devices, then try again.
              <span className="mt-1 block text-xs">{error}</span>
            </div>
          ) : null}
          {stream ? <Button type="button" onClick={() => onReady(stream)}>Everything is working</Button> : null}
        </div>
      </div>
    </Card>
  );
}
