"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ManualAssessmentForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const [questions, setQuestions] = useState([0, 1, 2, 3]);
  return (
    <form action={action} className="space-y-6">
      <section className="grid gap-4 rounded-lg border bg-white p-5 md:grid-cols-2">
        <label className="text-sm font-medium">
          Candidate name
          <Input name="candidateName" required className="mt-1" />
        </label>
        <label className="text-sm font-medium">
          Candidate email
          <Input name="candidateEmail" type="email" required className="mt-1" />
        </label>
        <label className="text-sm font-medium">
          Candidate phone
          <Input name="candidatePhone" className="mt-1" />
        </label>
        <label className="text-sm font-medium">
          Resume URL
          <Input name="resumeUrl" type="url" className="mt-1" />
        </label>
        <label className="text-sm font-medium md:col-span-2">
          Assessment title
          <Input name="title" required className="mt-1" />
        </label>
        <label className="text-sm font-medium md:col-span-2">
          Description
          <Textarea name="description" className="mt-1" />
        </label>
      </section>

      <section className="space-y-3">
        {questions.map((id, index) => (
          <div key={id} className="rounded-lg border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Question {index + 1}</h2>
              <Button
                type="button"
                className="h-9 bg-white text-foreground ring-1 ring-border hover:bg-muted"
                disabled={questions.length === 1}
                onClick={() => setQuestions((current) => current.filter((item) => item !== id))}
                aria-label="Remove question"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <Textarea name="questionText" required placeholder="Question text" />
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Input name="maxDurationSeconds" type="number" min={1} placeholder="Max duration seconds" />
              <Input name="maxAttempts" type="number" min={1} defaultValue={1} placeholder="Max attempts" />
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          className="bg-white text-foreground ring-1 ring-border hover:bg-muted"
          onClick={() => setQuestions((current) => [...current, Date.now()])}
        >
          <Plus className="mr-2 size-4" />
          Add question
        </Button>
        <Button type="submit">Create and send invitation</Button>
      </div>
    </form>
  );
}
