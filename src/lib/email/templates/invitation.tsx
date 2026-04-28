import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

export function InvitationEmail(props: {
  candidateName: string;
  assessmentTitle: string;
  assessmentLink: string;
  questionCount: number;
  expiresAt: Date;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your video assessment invitation</Preview>
      <Body style={{ backgroundColor: "#f7f7f4", fontFamily: "Arial, sans-serif", color: "#1f2933" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
          <Heading style={{ fontSize: 24, marginBottom: 12 }}>Your video assessment is ready</Heading>
          <Text>Hello {props.candidateName},</Text>
          <Text>
            You have been invited to complete <strong>{props.assessmentTitle}</strong>. The assessment has{" "}
            {props.questionCount} question{props.questionCount === 1 ? "" : "s"}. You will need a laptop or desktop
            computer with a camera and microphone.
          </Text>
          <Text>
            Questions are shown one at a time when recording starts. Please complete the assessment before{" "}
            {props.expiresAt.toLocaleString()}.
          </Text>
          <Section style={{ margin: "28px 0" }}>
            <Button href={props.assessmentLink} style={{ background: "#111827", color: "#fff", padding: "12px 18px" }}>
              Begin assessment
            </Button>
          </Section>
          <Text style={{ fontSize: 13, color: "#536471" }}>If the button does not work, copy this link: {props.assessmentLink}</Text>
        </Container>
      </Body>
    </Html>
  );
}
