import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AssessmentFilters({ defaults }: { defaults: Record<string, string | undefined> }) {
  return (
    <form className="mb-4 grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-6">
      <select name="status" defaultValue={defaults.status || ""} className="h-10 rounded-md border bg-white px-3 text-sm">
        <option value="">All statuses</option>
        {["invited", "in_progress", "completed", "reviewed", "expired"].map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
      <Input name="title" placeholder="Assessment title" defaultValue={defaults.title} />
      <Input name="source" placeholder="manual or api" defaultValue={defaults.source} />
      <Input name="from" type="date" defaultValue={defaults.from} />
      <Input name="to" type="date" defaultValue={defaults.to} />
      <Button type="submit">Filter</Button>
    </form>
  );
}
