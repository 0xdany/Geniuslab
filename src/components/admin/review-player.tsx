"use client";

import { useRef, useState } from "react";

export function ReviewPlayer({ src, downloadUrl }: { src: string; downloadUrl?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-md bg-slate-900">
        <video
          ref={ref}
          src={src}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full"
          onCanPlay={() => setLoading(false)}
          onLoadedMetadata={() => {
            setLoading(false);
            setError(null);
          }}
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            const mediaError = ref.current?.error;
            setError(mediaError ? `Video preview failed to load. Media error code ${mediaError.code}.` : "Video preview failed to load.");
          }}
        />
        {loading ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-black/55 px-3 py-2 text-sm text-white">
            Loading video preview...
          </div>
        ) : null}
      </div>
      {error ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          <p>{error}</p>
          <p>Some mobile Safari versions do not play WebM inline. Download the original file if playback does not start.</p>
          {downloadUrl ? <a className="font-medium text-primary" href={downloadUrl}>Download original recording</a> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">
          Speed
          <select
            value={speed}
            onChange={(event) => {
              setSpeed(event.target.value);
              if (ref.current) ref.current.playbackRate = Number(event.target.value);
            }}
            className="ml-2 h-9 rounded-md border bg-white px-2 text-sm"
          >
            {["0.5", "1", "1.25", "1.5", "2", "2.5", "3"].map((value) => (
              <option key={value} value={value}>{value}x</option>
            ))}
          </select>
        </label>
        {downloadUrl ? <a className="text-sm font-medium text-primary" href={downloadUrl}>Download original</a> : null}
      </div>
    </div>
  );
}
