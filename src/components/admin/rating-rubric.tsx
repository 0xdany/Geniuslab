"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ratingOptions = [
  {
    value: 1,
    label: "Novice",
    description: "Candidate is unlikely to demonstrate this competency successfully without substantial support.",
  },
  {
    value: 2,
    label: "Developing",
    description: "Candidate is likely to demonstrate this competency in simple situations or in a limited capacity.",
  },
  {
    value: 3,
    label: "Intermediate",
    description: "Candidate is likely to demonstrate this competency well, but may need assistance in more difficult situations.",
  },
  {
    value: 4,
    label: "Advanced",
    description: "Candidate is likely to demonstrate this competency effectively in moderate to complex situations.",
  },
  {
    value: 5,
    label: "Expert",
    description: "Candidate is likely to demonstrate this competency with extreme effectiveness in complex situations.",
  },
];

export function RatingRubric({
  name,
  value,
  onChange,
  title,
}: {
  name: string;
  value: number;
  onChange: (value: number) => void;
  title: string;
}) {
  const selected = ratingOptions.find((option) => option.value === value) ?? ratingOptions[2];

  return (
    <section className="rounded-lg border border-border/80 bg-white p-4 shadow-sm">
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">Rating / Feedback</p>
          <h3 className="mt-1.5 text-lg font-bold tracking-tight">{title}</h3>
        </div>
        <div className="inline-flex items-center self-start rounded-full border border-indigo-500/30 bg-indigo-50 px-3.5 py-1.5 text-sm font-bold text-indigo-600 sm:self-auto">
          {value}
          <span className="mx-2 h-4 w-px bg-indigo-500/30" />
          <span className="section-label text-indigo-600">{selected.label}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-5">
        {ratingOptions.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "flex min-h-[132px] flex-col rounded-md border bg-muted/25 p-3 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                isSelected && "border-2 border-indigo-500 bg-indigo-50 shadow-sm",
              )}
              aria-pressed={isSelected}
            >
              <span className="text-sm font-bold">{option.label}</span>
              <span className="mt-2 flex-1 text-[11px] leading-4 text-muted-foreground">{option.description}</span>
              <span className="mt-2 flex h-5 items-center justify-center">
                {isSelected ? <CheckCircle2 className="h-5 w-5 fill-indigo-500 text-white" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
