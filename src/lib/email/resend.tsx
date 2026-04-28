import { Resend } from "resend";
import type React from "react";
import { db } from "@/db/client";
import { emailMessages } from "@/db/schema";
import { emailFrom } from "@/lib/env";
import { CompletionEmail } from "@/lib/email/templates/completion";
import { InvitationEmail } from "@/lib/email/templates/invitation";

function getResend() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

export async function sendInvitationEmail(input: {
  assessmentId: string;
  to: string;
  candidateName: string;
  title: string;
  link: string;
  questionCount: number;
  expiresAt: Date;
}) {
  const subject = `Video assessment: ${input.title}`;
  return sendTrackedEmail({
    assessmentId: input.assessmentId,
    kind: "invitation",
    to: input.to,
    subject,
    react: InvitationEmail({
      candidateName: input.candidateName,
      assessmentTitle: input.title,
      assessmentLink: input.link,
      questionCount: input.questionCount,
      expiresAt: input.expiresAt,
    }),
    idempotencyKey: `assessment-invitation/${input.assessmentId}`,
  });
}

export async function sendCompletionEmail(input: { assessmentId: string; to: string; candidateName: string; title: string }) {
  return sendTrackedEmail({
    assessmentId: input.assessmentId,
    kind: "completion",
    to: input.to,
    subject: `Assessment submitted: ${input.title}`,
    react: CompletionEmail({ candidateName: input.candidateName, assessmentTitle: input.title }),
    idempotencyKey: `assessment-completion/${input.assessmentId}`,
  });
}

async function sendTrackedEmail(input: {
  assessmentId: string;
  kind: "invitation" | "completion";
  to: string;
  subject: string;
  react: React.ReactNode;
  idempotencyKey: string;
}) {
  const resend = getResend();
  if (!resend) {
    const [message] = await db
      .insert(emailMessages)
      .values({
        assessmentId: input.assessmentId,
        kind: input.kind,
        toEmail: input.to,
        subject: input.subject,
        status: "failed",
        errorMessage: "RESEND_API_KEY is not configured.",
      })
      .returning();
    return message;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom(),
      to: input.to,
      subject: input.subject,
      react: input.react,
      tags: [
        { name: "category", value: input.kind },
        { name: "assessment_id", value: input.assessmentId },
      ],
    }, {
      idempotencyKey: input.idempotencyKey,
    });
    const [message] = await db
      .insert(emailMessages)
      .values({
        assessmentId: input.assessmentId,
        kind: input.kind,
        toEmail: input.to,
        subject: input.subject,
        providerMessageId: data?.id,
        status: error ? "failed" : "sent",
        errorMessage: error?.message,
      })
      .returning();
    return message;
  } catch (error) {
    const [message] = await db
      .insert(emailMessages)
      .values({
        assessmentId: input.assessmentId,
        kind: input.kind,
        toEmail: input.to,
        subject: input.subject,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown email error.",
      })
      .returning();
    return message;
  }
}
