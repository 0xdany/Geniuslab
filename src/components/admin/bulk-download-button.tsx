import { Download } from "lucide-react";

export function BulkDownloadButton({ assessmentId }: { assessmentId: string }) {
  return (
    <a
      href={`/api/admin/downloads/${assessmentId}/zip`}
      className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
    >
      <Download className="mr-2 size-4" />
      Download all videos
    </a>
  );
}
