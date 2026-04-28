"use client";

import { useRef, useState } from "react";

export function ReviewPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState("1");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <video
        ref={ref}
        src={src}
        controls
        preload="metadata"
        className="aspect-video w-full rounded-md"
        onLoadedMetadata={() => setError(null)}
        onError={() => {
          const mediaError = ref.current?.error;
          setError(mediaError ? `Video preview failed to load. Media error code ${mediaError.code}.` : "Video preview failed to load.");
        }}
      />
      {error ? <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{error}</div> : null}
      <select
        value={speed}
        onChange={(event) => {
          setSpeed(event.target.value);
          if (ref.current) ref.current.playbackRate = Number(event.target.value);
        }}
        className="h-9 rounded-md border bg-white px-2 text-sm"
      >
        {["0.5", "1", "1.25", "1.5", "2", "2.5", "3"].map((value) => (
          <option key={value} value={value}>{value}x</option>
        ))}
      </select>
    </div>
  );
}
