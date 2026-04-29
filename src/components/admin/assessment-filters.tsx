import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";

export function AssessmentFilters({ defaults }: { defaults: Record<string, string | undefined> }) {
  return (
    <form className="mb-8 flex flex-col gap-6 rounded-2xl border border-border bg-background/60 p-6 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2 text-base font-semibold text-foreground pb-2 border-b border-border/40">
        <Filter className="h-4 w-4 text-primary" />
        Filter Assessments
      </div>
      
      {/* Primary Filters Row */}
      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Title</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input name="title" className="pl-9 h-11" placeholder="Search by assessment title..." defaultValue={defaults.title} />
          </div>
        </div>
        
        <div className="w-full md:w-64 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
          <select name="status" defaultValue={defaults.status || ""} className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none cursor-pointer">
            <option value="">All statuses</option>
            {["invited", "in_progress", "completed", "reviewed", "expired"].map((status) => (
              <option key={status} value={status}>{status.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-64 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sort By</label>
          <select name="sort" defaultValue={defaults.sort || "submitted"} className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none cursor-pointer">
            <option value="submitted">Date Submitted</option>
            <option value="candidate">Candidate Name</option>
            <option value="status">Status</option>
            <option value="score">Overall Score</option>
          </select>
        </div>
      </div>

      {/* Secondary Filters Row */}
      <div className="flex flex-col md:flex-row items-end gap-5">
        <div className="w-full md:w-48 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</label>
          <select name="source" defaultValue={defaults.source || ""} className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none cursor-pointer">
            <option value="">Any source</option>
            <option value="manual">Manual</option>
            <option value="api">API</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Range</label>
          <div className="flex items-center gap-3">
            <Input name="from" type="date" defaultValue={defaults.from} className="h-11 w-[150px] text-sm" />
            <span className="text-muted-foreground text-xs font-medium">to</span>
            <Input name="to" type="date" defaultValue={defaults.to} className="h-11 w-[150px] text-sm" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score Range</label>
          <div className="flex items-center gap-3">
            <Input name="minScore" type="number" min={1} max={5} step={0.5} placeholder="Min" defaultValue={defaults.minScore} className="h-11 w-[80px] text-sm text-center" />
            <span className="text-muted-foreground text-xs font-medium">-</span>
            <Input name="maxScore" type="number" min={1} max={5} step={0.5} placeholder="Max" defaultValue={defaults.maxScore} className="h-11 w-[80px] text-sm text-center" />
          </div>
        </div>

        <div className="flex-1 flex justify-end w-full md:w-auto mt-4 md:mt-0">
          <Button type="submit" className="w-full md:w-auto h-11 px-8 font-semibold shadow-md hover:shadow-lg transition-shadow">
            Apply Filters
          </Button>
        </div>
      </div>
    </form>
  );
}
