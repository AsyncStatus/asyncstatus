import { Button, Heading, Img, Link, Section, Text } from "@react-email/components";
import { Layout } from "../layout";
import { bodyText, divider, footerLink, h1, h2, primaryButton, secondaryText } from "../styles";

export function OrganizationInvitationEmail(props: {
  preview: string;
  invitedByUsername: string;
  invitedByEmail: string;
  inviteeFirstName?: string;
  teamName: string;
  inviteLink: string;
  expiration: string;
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
          Hi{props.inviteeFirstName ? ` ${props.inviteeFirstName}` : ""},
        </Heading>
        <Heading as="h2" style={h2}>
          {props.invitedByUsername} invited you to join {props.teamName}.
        </Heading>

        <Button href={props.inviteLink} style={primaryButton}>
          Join {props.teamName}
        </Button>

        <Text style={{ ...secondaryText, textAlign: "center", marginTop: -16 }}>
          This invitation will expire in {props.expiration}
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

OrganizationInvitationEmail.PreviewProps = {
  preview: "Join Michael on AsyncStatus https://app.asyncstatus.com/invitations",
  invitedByUsername: "Michael",
  invitedByEmail: "michael@asyncstatus.com",
  inviteeFirstName: "John",
  teamName: "AsyncStatus",
  inviteLink: "https://app.asyncstatus.com/invitations",
  expiration: "7 days",
};

export default OrganizationInvitationEmail;
