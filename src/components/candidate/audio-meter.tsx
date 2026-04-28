"use client";

import { useEffect, useState } from "react";

export function AudioMeter({ stream }: { stream: MediaStream | null }) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!stream) return;
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      setLevel(Math.round((data.reduce((sum, value) => sum + value, 0) / data.length / 255) * 100));
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      void context.close();
    };
  }, [stream]);
  return (
    <div className="h-3 overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, level * 3)}%` }} />
    </div>
  );
}
