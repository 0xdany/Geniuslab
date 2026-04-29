"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function OverallReviewForm({
  initialScore,
  initialNotes,
  action,
}: {
  initialScore?: string | null;
  initialNotes?: string | null;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [currentScore, setCurrentScore] = useState<number>(initialScore ? parseFloat(initialScore) : 3);

  // Map score to color and label for richer feedback
  const getScoreDetails = (val: number) => {
    if (val === 1) return { color: "text-destructive border-destructive/20 bg-destructive/10", label: "Poor" };
    if (val === 2) return { color: "text-orange-500 border-orange-500/20 bg-orange-500/10", label: "Fair" };
    if (val === 3) return { color: "text-yellow-600 border-yellow-600/20 bg-yellow-600/10", label: "Good" };
    if (val === 4) return { color: "text-blue-500 border-blue-500/20 bg-blue-500/10", label: "Very Good" };
    return { color: "text-green-600 border-green-600/20 bg-green-600/10", label: "Excellent" };
  };

  const { color, label } = getScoreDetails(currentScore);

  return (
    <form action={action} className="mt-2 flex flex-col gap-6 w-full">
      <input type="hidden" name="overallScore" value={currentScore} />
      
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <label className="font-semibold text-lg text-foreground">Final Rating Score</label>
          <motion.div 
            key={currentScore}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`px-4 py-1.5 rounded-full font-bold text-lg border flex items-center gap-2 ${color}`}
          >
            <span>{currentScore}</span>
            <span className="text-xs uppercase tracking-wider font-semibold opacity-80 border-l border-current pl-2">{label}</span>
          </motion.div>
        </div>
        
        <div className="px-2">
          <Slider
            min={1}
            max={5}
            step={0.5}
            thumbAriaLabel="Final rating score"
            value={[currentScore]}
            onValueChange={(vals) => setCurrentScore(vals[0])}
            className="w-full py-4 cursor-grab active:cursor-grabbing"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground mt-4 font-medium px-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <span key={val} className={`flex flex-col items-center gap-1.5 ${currentScore === val ? 'text-foreground font-bold' : ''}`}>
                <span className={`w-1 h-2 rounded-full ${currentScore === val ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                {val}
              </span>
            ))}
          </div>
        </div>
      </div>

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
