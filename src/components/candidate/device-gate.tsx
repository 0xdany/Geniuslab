"use client";

import { useEffect } from "react";

export function DeviceGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const coarse = matchMedia("(pointer: coarse)").matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 768;
    const mobileUa = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
    if ((coarse && small) || mobileUa) {
      window.location.assign("/assessment/unsupported");
    }
  }, []);
  return <>{children}</>;
}
