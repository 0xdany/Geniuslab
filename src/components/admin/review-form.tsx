import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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
  return (
    <form action={action} className="mt-3 grid gap-3 md:grid-cols-[120px_1fr_auto]">
      <input type="hidden" name="responseId" value={responseId} />
      <Input name="score" type="number" min={1} max={5} defaultValue={score ?? ""} placeholder="Score" />
      <Textarea name="notes" defaultValue={notes ?? ""} placeholder="Reviewer notes" className="min-h-10" />
      <Button type="submit">Save</Button>
    </form>
  );
}
