import { Button, Heading, Img, Link, Section, Text } from "@react-email/components";
import { Layout } from "../layout";
import { bodyText, divider, footerLink, h1, h2, primaryButton, secondaryText } from "../styles";

export function StatusUpdateReminderEmail(props: {
  preview: string;
  recipientName: string;
  organizationName: string;
  updateLink: string;
}) {
  return (
    <Layout preview={props.preview}>
      <Section style={{ display: "flex", paddingBottom: 32 }}>
        <Img
          src="https://pub-5936183d49924fb4af2d9dbf9637510c.r2.dev/icon-100.png"
          alt="AsyncStatus Logo"
          width="30"
          height="30"
        />
      </Section>

      <Section>
        <Heading as="h1" style={h1}>
          Hi {props.recipientName.split(" ")[0] ?? props.recipientName},
        </Heading>
        <Heading as="h2" style={h2}>
          It's time to share your status update for <strong>{props.organizationName}</strong>.
        </Heading>

        <Text style={bodyText}>Here's what we'd love to hear about:</Text>

        <Text style={{ ...bodyText, marginLeft: 16 }}>
          • What did you work on recently?
          <br />• What are you planning next?
          <br />• Any blockers or challenges?
        </Text>

        <Button href={props.updateLink} style={primaryButton}>
          Share your update
        </Button>

        <Text style={{ ...secondaryText, textAlign: "center", marginTop: -16 }}>
          Keep it brief and focus on outcomes that matter to the team!
        </Text>
      </Section>

      <Text style={{ ...bodyText, margin: "64px 0 128px" }}>
        Happy collaborating,
        <br />
        <span style={{ ...secondaryText, fontSize: 14 }}>AsyncStatus Team</span>
      </Text>

      <hr style={divider} />

      <Link href="https://asyncstatus.com" style={footerLink}>
        <strong>AsyncStatus</strong>
        <br />
        Async status updates for remote startups. Built for high-agency teams that value their time.
      </Link>
    </Layout>
  );
}

StatusUpdateReminderEmail.PreviewProps = {
  preview: "Time for your status update",
  recipientName: "John",
  organizationName: "AsyncStatus",
  updateLink: "https://app.asyncstatus.com",
};

export default StatusUpdateReminderEmail;
