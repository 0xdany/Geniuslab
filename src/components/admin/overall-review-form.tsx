"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RatingRubric } from "@/components/admin/rating-rubric";

export function OverallReviewForm({
  initialScore,
  initialNotes,
  action,
}: {
  initialScore?: string | null;
  initialNotes?: string | null;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [currentScore, setCurrentScore] = useState<number>(initialScore ? Math.round(parseFloat(initialScore)) : 3);

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <RatingRubric name="overallScore" value={currentScore} onChange={setCurrentScore} title="Final rating" />

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
        <label className="px-1 font-semibold text-foreground">Summary Notes</label>
        <textarea
          name="summaryNotes"
          defaultValue={initialNotes ?? ""}
          placeholder="Add overall summary notes..."
          className="flex min-h-[96px] w-full rounded-lg border border-input bg-background/50 px-4 py-3 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
        />
        </div>
        <Button type="submit" className="h-12 w-full px-8 text-base font-semibold shadow-md sm:w-auto lg:mb-0.5">
          Save Overall Summary
        </Button>
      </div>
    </form>
  );
}
