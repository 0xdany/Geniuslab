import { CandidateAssessmentShell } from "@/components/candidate/progress-shell";
import { DeviceGate } from "@/components/candidate/device-gate";

export const dynamic = "force-dynamic";

export default function CandidateAssessmentPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <DeviceGate>
        <CandidateAssessmentShell />
      </DeviceGate>
    </main>
  );
}
