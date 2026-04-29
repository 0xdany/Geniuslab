import { Card } from "@/components/ui/card";
import { MonitorX } from "lucide-react";

export default function UnsupportedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
      <Card className="p-8">
        <MonitorX className="h-12 w-12 text-primary" />
        <h1 className="mt-5 text-3xl font-semibold">Please use a laptop or desktop computer</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          This assessment needs a desktop browser with a camera and microphone. To keep the experience fair and reliable,
          phones and tablets cannot open the questions or recording screen.
        </p>
      </Card>
    </main>
  );
}
