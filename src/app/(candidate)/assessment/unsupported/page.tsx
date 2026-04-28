import { Card } from "@/components/ui/card";

export default function UnsupportedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
      <Card>
        <h1 className="text-2xl font-semibold">Please use a laptop or desktop computer</h1>
        <p className="mt-2 text-muted-foreground">
          This assessment needs a desktop browser with a camera and microphone. To keep the experience fair and reliable,
          phones and tablets cannot open the questions or recording screen.
        </p>
      </Card>
    </main>
  );
}
