"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingRubric } from "@/components/admin/rating-rubric";

export function ReviewForm({
  responseId,
  score,
  notes,
  action,
}: {
  responseId: string;
  score?: number | null;
  notes?: string | null;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [currentScore, setCurrentScore] = useState<number>(score ? Math.round(score) : 3);

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <input type="hidden" name="responseId" value={responseId} />
      <RatingRubric name="score" value={currentScore} onChange={setCurrentScore} title="Question rating" />

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
        <label className="px-1 font-semibold text-foreground">Reviewer Notes</label>
        <Textarea 
          name="notes" 
          defaultValue={notes ?? ""} 
          placeholder="Add detailed feedback on the candidate's performance here..." 
          className="min-h-[96px] w-full rounded-lg bg-background/50 text-base focus-visible:ring-primary/40" 
        />
        </div>
        <Button type="submit" className="h-12 w-full px-8 text-base font-semibold shadow-md sm:w-auto lg:mb-0.5">
          Save Review
        </Button>
      </div>
    </form>
  );
}
