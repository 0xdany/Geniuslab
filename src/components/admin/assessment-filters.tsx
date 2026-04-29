import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";

export function AssessmentFilters({ defaults }: { defaults: Record<string, string | undefined> }) {
  return (
    <form className="flex flex-col gap-5 rounded-lg border border-border/80 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3 text-base font-semibold text-foreground">
        <Filter className="h-4 w-4 text-primary" />
        Filter assessments
      </div>
      
      {/* Primary Filters Row */}
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="flex-1 space-y-2">
          <label className="section-label">Search title</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input name="title" className="pl-9 h-11" placeholder="Search by assessment title..." defaultValue={defaults.title} />
          </div>
        </div>
        
        <div className="w-full md:w-64 space-y-2">
          <label className="section-label">Status</label>
          <select name="status" defaultValue={defaults.status || ""} className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none cursor-pointer">
            <option value="">All statuses</option>
            {["invited", "in_progress", "completed", "reviewed", "expired"].map((status) => (
              <option key={status} value={status}>{status.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-64 space-y-2">
          <label className="section-label">Sort by</label>
          <select name="sort" defaultValue={defaults.sort || "submitted"} className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none cursor-pointer">
            <option value="submitted">Date Submitted</option>
            <option value="candidate">Candidate Name</option>
            <option value="status">Status</option>
            <option value="score">Overall Score</option>
          </select>
        </div>
      </div>

      {/* Secondary Filters Row */}
      <div className="flex flex-col items-end gap-5 md:flex-row">
        <div className="w-full md:w-48 space-y-2">
          <label className="section-label">Source</label>
          <select name="source" defaultValue={defaults.source || ""} className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none cursor-pointer">
            <option value="">Any source</option>
            <option value="manual">Manual</option>
            <option value="api">API</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="section-label">Date range</label>
          <div className="flex items-center gap-3">
            <Input name="from" type="date" defaultValue={defaults.from} className="h-11 w-[150px] text-sm" />
            <span className="text-muted-foreground text-xs font-medium">to</span>
            <Input name="to" type="date" defaultValue={defaults.to} className="h-11 w-[150px] text-sm" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="section-label">Score range</label>
          <div className="flex items-center gap-3">
            <Input name="minScore" type="number" min={1} max={5} step={0.5} placeholder="Min" defaultValue={defaults.minScore} className="h-11 w-[80px] text-sm text-center" />
            <span className="text-muted-foreground text-xs font-medium">-</span>
            <Input name="maxScore" type="number" min={1} max={5} step={0.5} placeholder="Max" defaultValue={defaults.maxScore} className="h-11 w-[80px] text-sm text-center" />
          </div>
        </div>

        <div className="flex w-full flex-1 justify-end md:w-auto">
          <Button type="submit" className="h-11 w-full px-8 md:w-auto">
            Apply filters
          </Button>
        </div>
      </div>
    </form>
  );
}
