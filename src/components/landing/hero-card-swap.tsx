"use client";

import { BarChart3, CheckCircle2, Clock3, ShieldCheck, Video } from "lucide-react";
import CardSwap, { Card } from "@/components/ui/card-swap";

const rubric = ["Novice", "Developing", "Intermediate", "Advanced", "Expert"];

export function HeroCardSwap() {
  return (
    <div className="relative h-[560px] min-h-[560px] overflow-visible">
      <CardSwap width={520} height={390} cardDistance={52} verticalDistance={62} delay={4200} pauseOnHover skewAmount={4} easing="elastic">
        <Card className="overflow-hidden">
          <div className="flex h-12 items-center justify-between border-b bg-white px-5">
            <div className="text-lg font-bold">Geniuslab<span className="text-primary">✦</span></div>
            <span className="section-label">Candidate review</span>
          </div>
          <div className="grid h-[calc(100%-3rem)] grid-cols-[150px_1fr]">
            <aside className="border-r bg-muted/45 p-4">
              <div className="mx-auto h-20 w-20 rounded-full border-4 border-white bg-[linear-gradient(135deg,#fce7f3,#e0e7ff)] shadow-sm" />
              <div className="mt-3 text-center">
                <div className="text-xl font-bold">Maya Chen</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Designer</div>
              </div>
              <div className="mt-5 space-y-2">
                {["Intro", "Problem solving", "Collaboration"].map((item, index) => (
                  <div key={item} className={index === 1 ? "rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-white" : "rounded-full bg-white px-3 py-2 text-[11px] font-bold text-muted-foreground"}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{item}</span>
                      <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    </div>
                  </div>
                ))}
              </div>
            </aside>
            <section className="p-5">
              <p className="section-label">Question 2 of 4</p>
              <h3 className="mt-2 text-xl font-bold leading-tight">Tell me about a time you resolved an ambiguous product problem.</h3>
              <div className="mt-5 overflow-hidden rounded-md border bg-slate-950">
                <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,#334155,#0f172a_65%)]">
                  <span className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white/80">Video response</span>
                </div>
                <div className="h-2 bg-white/10">
                  <div className="h-full w-2/3 bg-indigo-500" />
                </div>
              </div>
            </section>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="section-label">Rating / Feedback</p>
              <h3 className="mt-2 text-xl font-bold">Problem solving</h3>
            </div>
            <div className="rounded-full border border-indigo-500/30 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600">5 | Expert</div>
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {rubric.map((label, index) => (
              <div key={label} className={index === 4 ? "flex min-h-[140px] flex-col rounded-md border-2 border-indigo-500 bg-indigo-50 p-3 text-center" : "flex min-h-[140px] flex-col rounded-md border bg-muted/35 p-3 text-center"}>
                <span className="text-xs font-bold">{label}</span>
                <span className="mt-3 flex-1 text-[10px] leading-4 text-muted-foreground">Candidate demonstrates this competency in realistic interview situations.</span>
                <span className="mt-3 flex h-5 justify-center">{index === 4 ? <CheckCircle2 className="h-5 w-5 fill-indigo-500 text-white" /> : null}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="section-label">Assessment funnel</p>
              <h3 className="mt-2 text-2xl font-bold">Sales Associate</h3>
              <p className="mt-1 text-sm text-muted-foreground">On-demand video interview</p>
            </div>
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-8 grid grid-cols-[1fr_120px] gap-6">
            <div className="space-y-4">
              {[
                ["Not started", "w-5/12"],
                ["Started", "w-7/12"],
                ["Submitted", "w-11/12"],
                ["Reviewed", "w-8/12"],
              ].map(([label, width]) => (
                <div key={label} className="grid grid-cols-[92px_1fr] items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <span>{label}</span>
                  <div className="h-3 rounded-full bg-muted">
                    <div className={`h-full rounded-full bg-primary ${width}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex aspect-square items-center justify-center rounded-full border-[10px] border-muted border-t-primary border-r-indigo-500 text-3xl font-bold">82%</div>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="metric-panel p-3"><Video className="h-4 w-4 text-primary" /><div className="mt-2 text-2xl font-bold">14</div><p className="text-xs text-muted-foreground">Invited</p></div>
            <div className="metric-panel p-3"><Clock3 className="h-4 w-4 text-amber-600" /><div className="mt-2 text-2xl font-bold">5</div><p className="text-xs text-muted-foreground">Active</p></div>
            <div className="metric-panel p-3"><ShieldCheck className="h-4 w-4 text-emerald-600" /><div className="mt-2 text-2xl font-bold">9</div><p className="text-xs text-muted-foreground">Ready</p></div>
          </div>
        </Card>
      </CardSwap>
    </div>
  );
}
