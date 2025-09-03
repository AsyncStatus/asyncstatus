import { Button } from "@asyncstatus/ui/components/button";
import { BarChartIcon, CodeIcon, RocketIcon } from "@asyncstatus/ui/icons";
import Link from "next/link";
import { WaitlistDialog } from "./waitlist-dialog";
import { BrandCTA } from "./brand-copy";

export function TargetAudience() {
  const audiences = [
    {
      role: "Engineers",
      description: "Less reporting, more coding.",
      benefits: [
        "Your commits and PRs write your updates for you—no extra steps required.",
        "Stop interrupting your morning just to repeat what you did yesterday.",
        "Your work stays visible to the team without constant explanation.",
      ],
      icon: CodeIcon,
      borderClass: "border-blue-200/70 dark:border-blue-800/30",
      dividerClass: "border-blue-300/50 dark:border-blue-700/40",
      iconClass: "text-blue-500/80 dark:text-blue-400/80",
      numberClass: "text-blue-500/80 dark:text-blue-400/80",
    },
    {
      role: "Product Managers",
      description: "Instant clarity, zero chasing.",
      benefits: [
        "Immediately see who's moving ahead and who's stuck—no chasing required.",
        "Spot blockers early, before they derail your timeline.",
        "Keep stakeholders informed without constant status requests.",
      ],
      icon: BarChartIcon,
      borderClass: "border-purple-200/70 dark:border-purple-800/30",
      dividerClass: "border-purple-300/50 dark:border-purple-700/40",
      iconClass: "text-purple-500/80 dark:text-purple-400/80",
      numberClass: "text-purple-500/80 dark:text-purple-400/80",
    },
    {
      role: "Founders",
      description: "See progress, skip meetings.",
      benefits: [
        "See exactly who's stuck without awkward one-on-ones or check-ins.",
        "Your team stays transparent without constant reminders or follow-ups.",
        "Spend your time building, not sitting in meetings you don't need.",
      ],
      icon: RocketIcon,
      borderClass: "border-green-200/70 dark:border-green-800/30",
      dividerClass: "border-green-300/50 dark:border-green-700/40",
      iconClass: "text-green-500/80 dark:text-green-400/80",
      numberClass: "text-green-500/80 dark:text-green-400/80",
    },
  ];

  return (
    <section className="mt-36">
      <h3 className="text-center text-6xl font-bold max-sm:text-5xl">Built for your entire team</h3>

      <div className="mt-24 grid gap-8 md:grid-cols-3">
        {audiences.map((audience) => (
          <div
            key={audience.role}
            className={`group bg-card flex flex-col rounded-xl border p-6 transition-all duration-300 hover:shadow-sm ${audience.borderClass}`}
          >
            <div
              className={`mb-5 flex items-center justify-between border-b pb-4 ${audience.dividerClass}`}
            >
              <div className="flex flex-col">
                <h4 className="text-2xl font-medium tracking-tight">{audience.role}</h4>
                <p className="text-muted-foreground mt-1 text-sm">{audience.description}</p>
              </div>
              <div className="border-border/70 bg-background/50 ml-4 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border">
                <audience.icon className={`h-4.5 w-4.5 ${audience.iconClass}`} strokeWidth={1.5} />
              </div>
            </div>

            <div className="mt-2 flex-1">
              <ol className="space-y-4">
                {audience.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start">
                    <span className={`mt-0.5 mr-2.5 text-sm font-medium ${audience.numberClass}`}>
                      {i + 1}.
                    </span>
                    <span className="text-base leading-snug">{benefit}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center gap-4">
        <p className="text-muted-foreground text-center text-lg text-balance">
          Ready to transform how your team shares progress?
        </p>
        <Button size="lg" asChild>
          <Link
            href={`${process.env.NEXT_PUBLIC_APP_URL}/sign-up`}
            className="hover:text-foreground"
          >
            <BrandCTA />
          </Link>
        </Button>
      </div>
    </section>
  );
}
