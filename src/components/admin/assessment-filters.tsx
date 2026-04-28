import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AssessmentFilters({ defaults }: { defaults: Record<string, string | undefined> }) {
  return (
    <form className="mb-4 grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4 lg:grid-cols-8">
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
      <Input name="minScore" type="number" min={1} max={5} placeholder="Min score" defaultValue={defaults.minScore} />
      <Input name="maxScore" type="number" min={1} max={5} placeholder="Max score" defaultValue={defaults.maxScore} />
      <select name="sort" defaultValue={defaults.sort || "submitted"} className="h-10 rounded-md border bg-white px-3 text-sm">
        <option value="submitted">Submitted</option>
        <option value="candidate">Candidate</option>
        <option value="status">Status</option>
        <option value="score">Score</option>
      </select>
      <Button type="submit">Filter</Button>
    </form>
  );
}
