import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@asyncstatus/ui/components/accordion";

const faqData = [
  {
    question: "What is AsyncStatus and how does it work?",
    answer:
      "AsyncStatus is an open-source tool designed for remote startups to create async status updates without the need for standups, status meetings, or status emails. It automatically generates status updates by connecting to your GitHub, Slack, or Discord accounts, analyzing your team's activity, and creating comprehensive updates in less than 1 minute.",
  },
  {
    question: "How can AsyncStatus replace our daily standups?",
    answer:
      "Instead of synchronous meetings that interrupt your team's deep work, AsyncStatus generates automatic status updates from your existing tools. Your team continues working as usual, and the platform tracks progress through GitHub commits, Slack conversations, and Discord activity to create meaningful status reports that everyone can read when convenient.",
  },
  {
    question: "What integrations does AsyncStatus support?",
    answer:
      "AsyncStatus currently integrates with GitHub for code activity tracking, Slack for team communication insights, and Discord for community updates. These integrations allow the platform to automatically gather context about your team's work and generate comprehensive status updates without manual input.",
  },
  {
    question: "How much time can our team save with AsyncStatus?",
    answer:
      "Remote teams using AsyncStatus typically save hundreds of hours annually by eliminating daily standups, weekly status meetings, and manual status report writing. A 10-person team spending 30 minutes daily on status updates can save over 1,300 hours per year - time that can be redirected to actual product development.",
  },
  {
    question: "Is AsyncStatus suitable for our team size?",
    answer:
      "AsyncStatus is built for high-agency teams that value their time, regardless of size. Whether you're a small startup with 3 people or a growing company with 50+ team members, the platform scales to eliminate status overhead while keeping everyone aligned on progress and priorities.",
  },
  {
    question: "How does pricing work?",
    answer:
      "AsyncStatus offers flexible pricing plans to accommodate teams of different sizes and needs. We provide a free tier for small teams to get started, with paid plans that scale based on team size and advanced features. Check our pricing section above for detailed information about available plans.",
  },
  {
    question: "Is my team's data secure with AsyncStatus?",
    answer:
      "Yes, security is our top priority. AsyncStatus uses industry-standard encryption and security practices to protect your team's data. We only access the minimum necessary information from your connected tools to generate status updates, and you maintain full control over what data is shared and with whom.",
  },
  {
    question: "Can I customize the status updates?",
    answer:
      "Absolutely! AsyncStatus allows you to customize the format, frequency, and content of your status updates. You can set team-specific templates, exclude certain types of activities, and tailor the updates to match your team's communication style and reporting needs.",
  },
  {
    question: "How do I get started with AsyncStatus?",
    answer:
      "Getting started is simple: create an account, connect your preferred integrations (GitHub, Slack, or Discord), configure your team settings, and AsyncStatus will begin generating your first status updates. The entire setup process takes less than 5 minutes, and you'll see your first generated update immediately.",
  },
  {
    question: "What if my team still wants some face-to-face communication?",
    answer:
      "AsyncStatus doesn't eliminate all meetings - it eliminates unnecessary status meetings. Your team can still have strategic discussions, brainstorming sessions, and social interactions. The platform simply removes the administrative overhead of status reporting, freeing up time for more valuable face-to-face conversations.",
  },
];

export function FaqSection() {
  return (
    <section className="mt-48">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-balance sm:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground mt-6 text-lg text-balance sm:text-xl">
            Everything you need to know about AsyncStatus and async status updates.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}