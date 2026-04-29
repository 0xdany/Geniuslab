"use client";

import { useState } from "react";
import { Plus, Trash2, User, FileText, Video, Clock, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ManualAssessmentForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const [questions, setQuestions] = useState([0, 1, 2]);

  return (
    <form action={action} className="space-y-8">
      {/* Candidate Profile Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="bg-muted/40 px-6 py-4 border-b border-border flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Candidate Profile</h2>
        </div>
        <div className="p-6 grid gap-x-6 gap-y-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Full Name <span className="text-destructive">*</span></label>
            <Input name="candidateName" required placeholder="Jane Doe" className="h-11 bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Email Address <span className="text-destructive">*</span></label>
            <Input name="candidateEmail" type="email" required placeholder="jane@example.com" className="h-11 bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Phone Number</label>
            <Input name="candidatePhone" placeholder="+1 (555) 000-0000" className="h-11 bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Resume/LinkedIn URL</label>
            <Input name="resumeUrl" type="url" placeholder="https://linkedin.com/in/..." className="h-11 bg-background/50" />
          </div>
        </div>
      </div>

      {/* Assessment Details Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="bg-muted/40 px-6 py-4 border-b border-border flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Assessment Details</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Assessment Title <span className="text-destructive">*</span></label>
            <Input name="title" required placeholder="e.g. Senior Frontend Engineer - Technical Screen" className="h-11 text-base font-medium bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Instructions / Description</label>
            <Textarea name="description" placeholder="Provide any general context or instructions for the candidate..." className="min-h-[100px] text-base bg-background/50" />
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Video Questions</h2>
          </div>
          <span className="text-sm text-muted-foreground font-medium bg-muted/60 px-3 py-1 rounded-full border border-border">
            {questions.length} Questions
          </span>
        </div>

        <div className="space-y-5">
          {questions.map((id, index) => (
            <div key={id} className="relative rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold text-lg">Question Prompt</h3>
                </div>
                <button
                  type="button"
                  className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed -mt-1 -mr-1"
                  disabled={questions.length === 1}
                  onClick={() => setQuestions((current) => current.filter((item) => item !== id))}
                  aria-label="Remove question"
                  title="Remove question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                <Textarea 
                  name="questionText" 
                  required 
                  placeholder="Type the question you want the candidate to answer on video..." 
                  className="min-h-[100px] text-base bg-background/50 focus-visible:ring-primary/50" 
                />
                
                <div className="grid gap-5 sm:grid-cols-2 bg-muted/30 p-5 rounded-lg border border-border/50">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Max Recording Time
                    </label>
                    <div className="relative">
                      <Input name="maxDurationSeconds" type="number" min={1} placeholder="e.g. 120" className="h-11 pr-12 bg-background/80" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">sec</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                      <RefreshCcw className="h-3.5 w-3.5" /> Max Retries
                    </label>
                    <div className="relative">
                      <Input name="maxAttempts" type="number" min={1} defaultValue={1} className="h-11 bg-background/80" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 mt-2 border-dashed border-2 border-primary/30 bg-transparent text-primary hover:bg-primary/5 hover:text-primary transition-colors font-medium text-base shadow-none"
          onClick={() => setQuestions((current) => [...current, Date.now()])}
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Another Question
        </Button>
      </div>

      <div className="pt-8 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-end gap-4">
        <Button variant="ghost" type="button" className="w-full sm:w-auto h-12 px-6 shadow-none">Cancel</Button>
        <Button type="submit" className="w-full sm:w-auto h-12 px-8 text-base font-semibold shadow-lg hover:shadow-primary/25 transition-all">
          Create & Send Invitation
        </Button>
      </div>
    </form>
  );
}
