import { Card } from "@/components/ui/card";

export default function UnsupportedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
      <Card>
        <h1 className="text-2xl font-semibold">Please use a laptop or desktop computer</h1>
        <p className="mt-2 text-muted-foreground">
          This assessment requires a camera, microphone, and desktop browser. Phones and tablets cannot access the
          questions or recording interface.
        </p>
      </Card>
    </main>
  );
}
