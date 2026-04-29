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
    <form action={action} className="mt-2 flex flex-col gap-6 w-full">
      <RatingRubric name="overallScore" value={currentScore} onChange={setCurrentScore} title="Final rating" />

      <div className="space-y-3">
        <label className="font-semibold text-foreground px-1">Summary Notes</label>
        <textarea
          name="summaryNotes"
          defaultValue={initialNotes ?? ""}
          placeholder="Add overall summary notes..."
          className="flex min-h-[140px] w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" className="w-full sm:w-auto px-8 py-6 text-base font-semibold shadow-md rounded-xl hover:shadow-lg transition-all">
          Save Overall Summary
        </Button>
      </div>
    </form>
  );
}
