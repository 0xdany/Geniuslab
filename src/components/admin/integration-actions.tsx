"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CloudUpload, FolderUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProcessingSummary = {
  totalVideos: number;
  ready: number;
  queued: number;
  processing: number;
  failed: number;
  missing: number;
  status: "not_ready" | "queued" | "processing" | "ready" | "failed";
};

type DriveExport = {
  status: "queued" | "exporting" | "completed" | "failed";
  driveFolderUrl?: string | null;
  errorMessage?: string | null;
} | null;

export function IntegrationActions({
  assessmentId,
  processing,
  driveExport,
}: {
  assessmentId: string;
  processing: ProcessingSummary;
  driveExport: DriveExport;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const hasVideos = processing.totalVideos > 0;
  const processingReady = hasVideos && processing.ready === processing.totalVideos;

  function runAction(path: string, successMessage: string) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(path, { method: "POST" });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(body?.error?.message || "The integration action could not be started.");
        router.refresh();
        return;
      }
      setMessage(successMessage);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border bg-muted/25 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="section-label">Integrations</p>
          <p className="mt-1 text-sm font-medium text-foreground">{processingLabel(processing)}</p>
          {driveExport ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Drive export: {driveExport.status}
              {driveExport.errorMessage ? ` - ${driveExport.errorMessage}` : ""}
            </p>
          ) : null}
          {message ? <p className="mt-2 text-xs text-muted-foreground">{message}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending || !hasVideos || processing.status === "processing" || processing.status === "queued"}
            onClick={() => runAction(`/api/admin/assessments/${assessmentId}/processing`, "Video processing queued.")}
          >
            {pending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />}
            Process videos
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || !processingReady || driveExport?.status === "queued" || driveExport?.status === "exporting"}
            onClick={() => runAction(`/api/admin/assessments/${assessmentId}/exports/drive`, "Drive export queued.")}
          >
            {pending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FolderUp className="mr-2 h-4 w-4" />}
            Export to Drive
          </Button>
          {driveExport?.driveFolderUrl ? (
            <a
              href={driveExport.driveFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-semibold hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              Open Drive folder
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function processingLabel(processing: ProcessingSummary) {
  if (processing.totalVideos === 0) return "No finalized videos are available yet.";
  if (processing.status === "ready") return `Processed ${processing.ready}/${processing.totalVideos} videos.`;
  if (processing.status === "processing") return `Processing ${processing.ready}/${processing.totalVideos} videos.`;
  if (processing.status === "queued") return `Queued ${processing.queued} video${processing.queued === 1 ? "" : "s"} for processing.`;
  if (processing.status === "failed") return `Processing needs attention: ${processing.failed} failed, ${processing.ready}/${processing.totalVideos} ready.`;
  return `Not processed: ${processing.totalVideos} video${processing.totalVideos === 1 ? "" : "s"} ready to queue.`;
}
