import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export function CompletionEmail(props: { candidateName: string; assessmentTitle: string }) {
  return (
    <Html>
      <Head />
      <Preview>Your assessment was submitted</Preview>
      <Body style={{ backgroundColor: "#f7f7f4", fontFamily: "Arial, sans-serif", color: "#1f2933" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
          <Heading style={{ fontSize: 24 }}>Submission received</Heading>
          <Text>Hello {props.candidateName},</Text>
          <Text>
            Thank you. Your responses for <strong>{props.assessmentTitle}</strong> were submitted successfully.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
