import { CandidateAssessmentShell } from "@/components/candidate/progress-shell";
import { DeviceGate } from "@/components/candidate/device-gate";

export const dynamic = "force-dynamic";

export default function CandidateAssessmentPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <DeviceGate>
        <CandidateAssessmentShell />
      </DeviceGate>
    </main>
  );
}
