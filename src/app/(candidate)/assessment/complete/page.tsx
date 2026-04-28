import { Card } from "@/components/ui/card";

export default function CompletePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
      <Card>
        <h1 className="text-2xl font-semibold">Assessment submitted</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you. Your responses were received, and a confirmation email is on its way. You can close this page.
        </p>
      </Card>
    </main>
  );
}
