import { Layout } from "../layout";
import {
  h1,
  h2,
  bodyText,
  secondaryText,
  primaryButton,
  footerLink,
  divider,
} from "../styles";
import {
  Button,
  Heading,
  Img,
  Link,
  Section,
  Text,
} from "@react-email/components";

export function VerificationEmail(props: {
  preview: string;
  firstName: string;
  expiration: string;
  verificationLink: string;
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
          Welcome to AsyncStatus. Verify your account to continue.
        </Heading>
      </Section>

      <Button href={props.verificationLink} style={primaryButton}>
        Verify email
      </Button>

      <Text style={{ ...secondaryText, textAlign: "center", marginTop: -16 }}>
        This link will expire in {props.expiration}.
      </Text>

      <Text style={{ ...bodyText, margin: "64px 0 128px" }}>
        Happy to have you on board,
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

VerificationEmail.PreviewProps = {
  preview: "Verify your email with https://app.asyncstatus.com/verify-email",
  firstName: "Michael",
  verificationLink: "https://app.asyncstatus.com/verify-email",
  expiration: "7 days",
};

export default VerificationEmail;
