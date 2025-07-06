import { Button, Heading, Img, Link, Section, Text } from "@react-email/components";
import { Layout } from "../layout";
import { bodyText, divider, footerLink, h1, h2, primaryButton, secondaryText } from "../styles";

export function ResetPasswordEmail(props: {
  preview: string;
  firstName: string;
  expiration: string;
  resetLink: string;
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
          Hi {props.firstName},
        </Heading>
        <Heading as="h2" style={h2}>
          We've received a request to reset your password. Please click the button below to reset
          your password.
        </Heading>
      </Section>

      <Button href={props.resetLink} style={primaryButton}>
        Reset password
      </Button>

      <Text style={{ ...secondaryText, textAlign: "center", marginTop: -16 }}>
        If you did not request a password reset, please ignore this email. <br />
        This link will expire in {props.expiration}.
      </Text>

      <Text style={{ ...bodyText, margin: "64px 0 128px" }}>
        Hope to see you soon,
        <br />
        <span style={{ ...secondaryText, fontSize: 14 }}>AsyncStatus Team</span>
      </Text>

      <hr style={divider} />

      <Link href="https://asyncstatus.com" style={footerLink}>
        <strong>AsyncStatus</strong>
        <br />
        Modern status updates for high-performing teams
      </Link>
    </Layout>
  );
}

ResetPasswordEmail.PreviewProps = {
  preview: "Reset your password with https://app.asyncstatus.com/reset-password",
  firstName: "Michael",
  expiration: "24 hours",
  resetLink: "https://app.asyncstatus.com/reset-password",
};

export default ResetPasswordEmail;
