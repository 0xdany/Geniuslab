import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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
    <div className="overflow-hidden rounded-lg border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Candidate</th>
            <th className="px-4 py-3">Assessment</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="px-4 py-3">
                <Link href={`/admin/assessments/${row.id}`} className="font-medium text-primary">
                  {row.candidateName}
                </Link>
                <div className="text-xs text-muted-foreground">{row.candidateEmail}</div>
              </td>
              <td className="px-4 py-3">{row.title}</td>
              <td className="px-4 py-3"><Badge>{row.status}</Badge></td>
              <td className="px-4 py-3">{row.sourceType}</td>
              <td className="px-4 py-3">{row.submittedAt ? row.submittedAt.toLocaleString() : "Not submitted"}</td>
              <td className="px-4 py-3">{row.overallScore ?? "-"}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                No assessments match these filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
