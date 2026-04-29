import { redirect } from "next/navigation";
import { ManualAssessmentForm } from "@/components/admin/manual-assessment-form";
import { createAssessment } from "@/lib/assessments";
import { requireAdmin } from "@/lib/admin-access";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/animation-wrapper";

export const dynamic = "force-dynamic";

export default function NewAssessmentPage() {
  async function createManualAssessment(formData: FormData) {
    "use server";
    const admin = await requireAdmin();
    const texts = formData.getAll("questionText").map(String).filter(Boolean);
    const durations = formData.getAll("maxDurationSeconds").map(String);
    const attempts = formData.getAll("maxAttempts").map(String);
    const created = await createAssessment({
      candidate: {
        externalId: `manual-${crypto.randomUUID()}`,
        name: String(formData.get("candidateName") || ""),
        email: String(formData.get("candidateEmail") || ""),
        phone: String(formData.get("candidatePhone") || "") || null,
        resumeUrl: String(formData.get("resumeUrl") || "") || null,
      },
      assessment: {
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || "") || null,
        questions: texts.map((text, index) => ({
          text,
          maxDurationSeconds: durations[index] ? Number(durations[index]) : null,
          maxAttempts: attempts[index] ? Number(attempts[index]) : 1,
        })),
      },
      source: { type: "manual", createdByUserId: admin.user.id },
    });
    redirect(`/admin/assessments/${created.assessment.id}`);
  }

  return (
    <StaggerContainer className="mx-auto max-w-4xl relative">
      <StaggerItem>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create assessment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The candidate receives an invitation email and the assessment appears in the dashboard immediately.
        </p>
      </StaggerItem>
      <FadeIn delay={0.2}>
        <div className="mt-6">
          <ManualAssessmentForm action={createManualAssessment} />
        </div>
      </FadeIn>
    </StaggerContainer>
  );
}
