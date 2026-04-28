"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

export function TokenExchange({ token }: { token: string }) {
  const [message, setMessage] = useState("Opening your secure assessment link...");
  useEffect(() => {
    fetch("/api/candidate/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error?.message || "This link is unavailable.");
        window.location.href = "/assessment";
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "This link is unavailable."));
  }, [token]);
  return <Card><h1 className="text-xl font-semibold">{message}</h1></Card>;
}
