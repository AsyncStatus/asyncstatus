import { Layout } from "@/layout";
import { Button, Img, Link, Section, Text } from "@react-email/components";

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
        <Text style={{ fontSize: 32, lineHeight: 1.5 }}>
          Hi {props.firstName},
        </Text>
        <Text style={{ fontSize: 20, lineHeight: 1.5 }}>
          We've received a request to reset your password. Please click the
          button below to reset your password.
        </Text>
      </Section>

      <Button
        href={props.resetLink}
        style={{
          display: "block",
          padding: 16,
          paddingLeft: 24,
          paddingRight: 24,
          margin: "32px 0",
          borderRadius: 8,
          textAlign: "center",
          backgroundColor: "oklch(0.5 0.21 261.87)",
          color: "white",
          fontSize: 16,
        }}
      >
        Reset password
      </Button>

      <Text
        style={{
          fontSize: 12,
          lineHeight: 1.5,
          textAlign: "center",
          marginTop: -16,
          color: "oklch(0.68 0 0)",
        }}
      >
        If you did not request a password reset, please ignore this email.{" "}
        <br />
        This link will expire in {props.expiration}.
      </Text>

      <Text style={{ fontSize: 20, lineHeight: 1.5, margin: "64px 0 128px" }}>
        Hope to see you soon!
        <br />- AsyncStatus Team
      </Text>

      <hr
        style={{
          width: "100%",
          border: "none",
          borderTop: "1px solid oklch(0.90 0 0)",
          marginTop: 48,
          marginBottom: 16,
        }}
      />

      <Link
        href="https://asyncstatus.com"
        style={{
          display: "block",
          fontSize: 12,
          lineHeight: 1.85,
          textAlign: "center",
          color: "oklch(0.68 0 0)",
        }}
      >
        AsyncStatus
        <br />
        Async status updates for remote startups, made for high-agency teams
        that value their time.
      </Link>
    </Layout>
  );
}

ResetPasswordEmail.PreviewProps = {
  preview:
    "Reset your password with https://app.asyncstatus.com/reset-password",
  firstName: "Michael",
  expiration: "24 hours",
  resetLink: "https://app.asyncstatus.com/reset-password",
};

export default ResetPasswordEmail;
