"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMediaDevices } from "@/hooks/use-media-devices";
import { AudioMeter } from "@/components/candidate/audio-meter";
import { Camera, Mic, ShieldCheck } from "lucide-react";

export function MediaSetup({ onReady }: { onReady: (stream: MediaStream) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, error, request } = useMediaDevices();
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight">Geniuslab<span className="text-primary">✦</span></div>
        <div className="section-label hidden sm:block">Device check</div>
      </div>
      <Card className="console-shell grid overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
        <section className="bg-slate-950 p-4">
          <div className="relative overflow-hidden rounded-md">
            <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
            {!stream ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center text-white">
                  <Camera className="mx-auto h-10 w-10 text-white/60" />
                  <p className="mt-3 text-sm font-semibold text-white/80">Camera preview appears here</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
        <section className="p-8">
          <p className="section-label">Before you begin</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Camera and microphone check</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Once everything looks and sounds right, the same stream stays active for the assessment.
          </p>
          <div className="mt-6 space-y-4">
            <Button type="button" className="h-11" onClick={() => void request()}>
              <Camera className="mr-2 h-4 w-4" />
              Enable camera and microphone
            </Button>
          {stream ? (
            <div className="rounded-lg border bg-muted/35 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><Mic className="h-4 w-4 text-primary" /> Microphone level</p>
              <AudioMeter stream={stream} />
              <p className="mt-2 text-sm text-muted-foreground">Speak normally and make sure the bar moves.</p>
            </div>
          ) : null}
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
              Camera or microphone access was blocked. Use your browser&apos;s site settings to allow both devices, then try again.
              <span className="mt-1 block text-xs">{error}</span>
            </div>
          ) : null}
          {stream ? (
            <Button type="button" className="h-11" onClick={() => onReady(stream)}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Everything is working
            </Button>
          ) : null}
          </div>
        </section>
      </Card>
    </div>
  );
}
