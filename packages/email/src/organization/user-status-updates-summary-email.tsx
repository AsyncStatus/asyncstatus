import { Button, Heading, Img, Link, Section, Text } from "@react-email/components";
import { Layout } from "../layout";
import { bodyText, divider, footerLink, h1, h2, primaryButton, secondaryText } from "../styles";

export function UserStatusUpdatesSummaryEmail(props: {
  preview: string;
  recipientName: string;
  organizationName: string;
  generalSummary?: string;
  items: Array<{ content: string }>;
  effectiveFrom: string;
  effectiveTo: string;
  viewUpdatesLink: string;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
          {props.organizationName} — user status summary.
        </Heading>

        <Text style={{ ...secondaryText, textAlign: "center", marginBottom: 24 }}>
          {formatDate(props.effectiveFrom)} - {formatDate(props.effectiveTo)}
        </Text>

        {props.generalSummary && (
          <Section style={{ marginBottom: 32 }}>
            <Heading as="h3" style={{ ...h2, fontSize: 18, marginBottom: 12 }}>
              🌟 Overview
            </Heading>
            <Text style={bodyText}>{props.generalSummary}</Text>
          </Section>
        )}

        {props.items.length > 0 && (
          <Section style={{ marginBottom: 32 }}>
            <Heading as="h3" style={{ ...h2, fontSize: 18, marginBottom: 12 }}>
              ✅ Highlights
            </Heading>
            {props.items.map((summary, index) => (
              <Text
                key={`user-summary-${index}-${summary.content.slice(0, 20)}`}
                style={{ ...bodyText, marginBottom: 8, marginLeft: 16 }}
              >
                • {summary.content}
              </Text>
            ))}
          </Section>
        )}

        <Button href={props.viewUpdatesLink} style={primaryButton}>
          View all updates
        </Button>
      </Section>

      <Text style={{ ...bodyText, margin: "64px 0 128px" }}>
        Stay connected,
        <br />
        <span style={{ ...secondaryText, fontSize: 14 }}>The {props.organizationName} Team</span>
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

UserStatusUpdatesSummaryEmail.PreviewProps = {
  preview: "Your status summary is ready",
  recipientName: "John Doe",
  organizationName: "AsyncStatus",
  generalSummary: "Strong progress on onboarding; minor blocker on API rate limits.",
  items: [
    { content: "Completed authentication refactor and added tests" },
    { content: "Implementing rate limiting; blocked by missing env in staging" },
  ],
  effectiveFrom: "2024-01-15T00:00:00Z",
  effectiveTo: "2024-01-22T00:00:00Z",
  viewUpdatesLink: "https://app.asyncstatus.com/acme/status-updates",
};

export default UserStatusUpdatesSummaryEmail;
