import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Mail } from "lucide-react";

export type AssessmentListRow = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  title: string;
  status: string;
  sourceType: string;
  submittedAt: Date | null;
  createdAt: Date;
  overallScore: string | null;
};

export function AssessmentTable({ rows }: { rows: AssessmentListRow[] }) {
  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b bg-muted/45 text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <tr>
            <th className="px-5 py-4">Candidate</th>
            <th className="px-5 py-4">Assessment</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Source</th>
            <th className="px-5 py-4">Submitted</th>
            <th className="px-5 py-4 text-right">Score</th>
            <th className="px-5 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-muted/30">
              <td className="px-5 py-4">
                <Link href={`/admin/assessments/${row.id}`} className="font-semibold text-foreground hover:text-primary">
                  {row.candidateName}
                </Link>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {row.candidateEmail}
                </div>
              </td>
              <td className="px-5 py-4 font-medium">{row.title}</td>
              <td className="px-5 py-4"><Badge variant={row.status === "completed" ? "default" : "secondary"}>{row.status.replace("_", " ")}</Badge></td>
              <td className="px-5 py-4 capitalize text-muted-foreground">{row.sourceType}</td>
              <td className="px-5 py-4 text-muted-foreground">{row.submittedAt ? row.submittedAt.toLocaleString() : "Not submitted"}</td>
              <td className="px-5 py-4 text-right font-semibold">{row.overallScore ?? "-"}</td>
              <td className="px-5 py-4 text-right">
                <Link href={`/admin/assessments/${row.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white text-muted-foreground shadow-sm hover:text-primary" aria-label={`Open ${row.candidateName}`}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                No assessments match these filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
