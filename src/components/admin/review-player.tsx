"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";

export function ReviewPlayer({ src, downloadUrl }: { src: string; downloadUrl?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  return (
    <div className="w-full flex flex-col bg-black">
      <div className="relative overflow-hidden bg-black flex items-center justify-center min-h-[300px]">
        <video
          ref={ref}
          src={src}
          controls
          playsInline
          preload="metadata"
          className="w-full max-h-[70vh] object-contain"
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
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3 bg-slate-900/80 px-6 py-4 rounded-2xl border border-white/10 shadow-xl">
              <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
              <span className="text-sm font-medium text-white/90">Loading video...</span>
            </div>
          </div>
        ) : null}
      </div>
      
      {error ? (
        <div className="border-t border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive-foreground">
          <p className="font-semibold mb-1">{error}</p>
          <p className="opacity-90">Some mobile Safari versions do not play WebM inline. Download the original file if playback does not start.</p>
          {downloadUrl ? (
            <a className="mt-2 inline-flex items-center font-medium text-destructive hover:underline" href={downloadUrl}>
              <Download className="mr-1 h-3 w-3" /> Download original recording
            </a>
          ) : null}
        </div>
      ) : null}
      
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-t border-white/10 bg-black text-white/80">
        <label className="text-sm font-medium flex items-center gap-3">
          Speed
          <div className="relative">
            <select
              value={speed}
              onChange={(event) => {
                setSpeed(event.target.value);
                if (ref.current) ref.current.playbackRate = Number(event.target.value);
              }}
              className="h-8 appearance-none rounded-md border border-white/20 bg-white/10 px-3 pr-8 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
            >
              {["0.5", "1", "1.25", "1.5", "2", "2.5", "3"].map((value) => (
                <option key={value} value={value} className="bg-slate-900 text-white">{value}x</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </label>
        
        {downloadUrl ? (
          <a 
            className="inline-flex items-center text-sm font-medium hover:text-white transition-colors opacity-80 hover:opacity-100" 
            href={downloadUrl}
          >
            <Download className="mr-2 h-4 w-4" /> Download
          </a>
        ) : null}
      </div>
    </div>
  );
}
