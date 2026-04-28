"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FailedEmailTable({
  emails,
}: {
  emails: Array<{ id: string; toEmail: string; subject: string; errorMessage: string | null }>;
}) {
  const [retrying, setRetrying] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function retry(id: string) {
    setRetrying(id);
    setDone(null);
    try {
      const response = await fetch("/api/admin/emails/retry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emailMessageId: id }),
      });
      if (!response.ok) throw new Error("Retry failed.");
      setDone(id);
    } finally {
      setRetrying(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Recipient</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Error</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {emails.map((email) => (
            <tr key={email.id} className="border-t">
              <td className="px-3 py-2">{email.toEmail}</td>
              <td className="px-3 py-2">{email.subject}</td>
              <td className="px-3 py-2 text-muted-foreground">{done === email.id ? "Retry sent." : email.errorMessage}</td>
              <td className="px-3 py-2 text-right">
                <Button className="h-8" disabled={retrying === email.id} onClick={() => void retry(email.id)}>
                  {retrying === email.id ? "Retrying..." : "Retry"}
                </Button>
              </td>
            </tr>
          ))}
          {emails.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No failed emails.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
