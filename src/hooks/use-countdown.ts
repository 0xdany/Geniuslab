"use client";

import { useEffect } from "react";

export function useCountdown(active: boolean, seconds?: number | null, onEnd?: () => void) {
  useEffect(() => {
    if (!active || !seconds) return;
    const id = window.setTimeout(() => onEnd?.(), seconds * 1000);
    return () => window.clearTimeout(id);
  }, [active, onEnd, seconds]);
  return seconds ?? null;
}
