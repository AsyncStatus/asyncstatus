import { Button, Heading, Img, Link, Section, Text } from "@react-email/components";
import { Layout } from "../layout";
import { bodyText, divider, footerLink, h1, h2, primaryButton, secondaryText } from "../styles";

export function LinearActivitySummaryEmail(props: {
  preview: string;
  recipientName: string;
  organizationName: string;
  generalSummary?: string;
  teamSummaries: Array<{ content: string }>;
  projectSummaries: Array<{ content: string }>;
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
          Linear activity summary for <strong>{props.organizationName}</strong>.
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

        {props.teamSummaries.length > 0 && (
          <Section style={{ marginBottom: 32 }}>
            <Heading as="h3" style={{ ...h2, fontSize: 18, marginBottom: 12 }}>
              👥 Team Highlights
            </Heading>
            {props.teamSummaries.map((summary, index) => (
              <Text
                key={`team-summary-${index}-${summary.content.slice(0, 20)}`}
                style={{ ...bodyText, marginBottom: 8, marginLeft: 16 }}
              >
                • {summary.content}
              </Text>
            ))}
          </Section>
        )}

        {props.projectSummaries.length > 0 && (
          <Section style={{ marginBottom: 32 }}>
            <Heading as="h3" style={{ ...h2, fontSize: 18, marginBottom: 12 }}>
              📦 Project Highlights
            </Heading>
            {props.projectSummaries.map((summary, index) => (
              <Text
                key={`project-summary-${index}-${summary.content.slice(0, 20)}`}
                style={{ ...bodyText, marginBottom: 8, marginLeft: 16 }}
              >
                • {summary.content}
              </Text>
            ))}
          </Section>
        )}

        <Button href={props.viewUpdatesLink} style={primaryButton}>
          View details
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

LinearActivitySummaryEmail.PreviewProps = {
  preview: "Your Linear activity summary is ready",
  recipientName: "John Doe",
  organizationName: "AsyncStatus",
  generalSummary: "Multiple issues progressed with several completions and key updates.",
  teamSummaries: [
    { content: "ENG: Completed onboarding epic; focused on quality improvements" },
    { content: "API: Stabilized retries; reduced webhook failures by 80%" },
  ],
  projectSummaries: [{ content: "Onboarding: Closed AS-124 and AS-128; launched to 20% users" }],
  effectiveFrom: "2024-01-15T00:00:00Z",
  effectiveTo: "2024-01-22T00:00:00Z",
  viewUpdatesLink: "https://app.asyncstatus.com/acme/activity/linear",
};

export default LinearActivitySummaryEmail;
