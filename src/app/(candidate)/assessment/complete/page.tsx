import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function CompletePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
      <Card className="p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-5 text-3xl font-semibold">Assessment submitted</h1>
        <p className="mt-3 text-muted-foreground">
          Thank you. Your responses were received, and a confirmation email is on its way. You can close this page.
        </p>
      </Card>
    </main>
  );
}
