import Script from "next/script";

interface StructuredDataProps {
  data: Record<string, any>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AsyncStatus",
  url: "https://asyncstatus.com",
  logo: "https://asyncstatus.com/icon-512.png",
  description: "Automated status updates for remote teams. Replace daily standups with AI-generated updates from your existing tools.",
  sameAs: [
    "https://twitter.com/asyncstatus",
  ],
  foundingDate: "2024",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "toby@asyncstatus.com",
  },
};

export const productSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AsyncStatus",
  description: "Automated status updates for remote teams. Replace daily standups with AI-generated updates from your existing tools like Git, Jira, and Slack.",
  url: "https://asyncstatus.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    priceCurrency: "USD",
    price: "0",
    description: "Free tier available with paid plans for teams",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "47",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "Automated status update generation",
    "Git integration", 
    "Slack activity reports",
    "Team productivity analytics",
    "Remote team management",
    "Async communication tools",
  ],
  screenshot: "https://asyncstatus.com/hero-light.webp",
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AsyncStatus",
  url: "https://asyncstatus.com",
  description: "Replace daily standups with automated status updates. Save 2-3 hours per developer per week.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://asyncstatus.com/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does AsyncStatus replace daily standups?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AsyncStatus automatically generates status updates by monitoring your team's activity in Git, Slack, and other tools. Instead of spending 15-30 minutes in daily meetings, team members get AI-generated summaries of what everyone accomplished, with the option to add manual updates.",
      },
    },
    {
      "@type": "Question",
      name: "How much time can my team save?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most teams save 2-3 hours per developer per week by eliminating daily standups. For a 5-person team earning $120K average salary, this translates to approximately $30,000 in saved time annually.",
      },
    },
    {
      "@type": "Question",
      name: "What tools does AsyncStatus integrate with?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AsyncStatus integrates with Git repositories (GitHub, GitLab), project management tools (Linear), and communication platforms (Slack, Discord). We're constantly adding new integrations based on user requests.",
      },
    },
    {
      "@type": "Question",
      name: "Is AsyncStatus secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, AsyncStatus uses enterprise-grade security with encrypted data transmission, secure OAuth integrations. We never store sensitive code or personal information.",
      },
    },
  ],
};
