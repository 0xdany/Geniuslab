import { TokenExchange } from "@/components/candidate/token-exchange";
import { DeviceGate } from "@/components/candidate/device-gate";

export default async function AssessmentTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
      <DeviceGate>
        <TokenExchange token={token} />
      </DeviceGate>
    </main>
  );
}
