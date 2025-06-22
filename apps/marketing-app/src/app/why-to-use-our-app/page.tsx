import Link from "next/link";
import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";

import { Footer } from "../components/footer";
import { MobileMenu } from "../components/mobile-menu";
import { WaitlistDialog } from "../components/waitlist-dialog";
import SavingsCalculator from "../components/savings-calculator";

export default function WhyToUseOurAppPage() {
  return (
    <>
      <header className="sticky top-3 z-50 mx-3 flex items-center justify-between gap-2 p-4.5 py-2.5 pr-2.5 max-sm:pr-4.5">
        <div className="border-border bg-background/80 absolute top-0 left-0 h-full w-full rounded-lg border backdrop-blur-[12px]" />

        {/* Progressive blur overlays - stronger towards top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 -translate-y-24">
          <div className="from-background/80 absolute inset-0 bg-gradient-to-b to-transparent backdrop-blur-[2px]" />
          <div className="from-background/80 mask-top-20 absolute inset-0 bg-gradient-to-b to-transparent backdrop-blur-[4px]" />
          <div className="from-background/80 mask-top-40 absolute inset-0 bg-gradient-to-b to-transparent backdrop-blur-[8px]" />
          <div className="from-background/80 mask-top-60 absolute inset-0 bg-gradient-to-b to-transparent backdrop-blur-[16px]" />
          <div className="from-background/80 mask-top-80 absolute inset-0 bg-gradient-to-b to-transparent backdrop-blur-[32px]" />
          <div className="from-background/80 mask-top-100 absolute inset-0 bg-gradient-to-b to-transparent backdrop-blur-[48px]" />
        </div>

        {/* Bottom blur - subtle */}
        <div className="from-background/60 pointer-events-none absolute right-0 -bottom-2 left-0 h-2 bg-gradient-to-b to-transparent backdrop-blur-[1px]" />

        <div className="z-10 flex items-center gap-8">
          <div className="flex flex-col">
            <Link href="/" className="flex items-center gap-2">
              <AsyncStatusLogo className="h-3.5 w-auto" />
              <h1 className="text-lg font-medium max-sm:text-base">
                AsyncStatus
              </h1>
            </Link>
          </div>

          <div className="text-muted-foreground flex items-center gap-6 pt-0.5 text-sm max-sm:hidden">
            <Link href="/#how-it-works" className="hover:text-foreground">
              How it works
            </Link>
            <Link href="/#features" className="hover:text-foreground">
              Features
            </Link>
            <Link href="/#team" className="hover:text-foreground">
              Use cases
            </Link>
          </div>
        </div>

        <div className="z-10 flex items-center gap-7 text-sm max-sm:hidden">
          <Link
            href={process.env.NEXT_PUBLIC_APP_URL ?? ""}
            className="hover:text-foreground"
          >
            Login
          </Link>

          <WaitlistDialog buttonSize="sm" />
        </div>

        <MobileMenu />
      </header>

      <main className="mx-auto mt-32 w-full max-w-4xl px-4 max-sm:mt-20">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-6xl font-bold text-balance max-sm:text-4xl">
            Send This to Your Manager
          </h1>
          <p className="text-muted-foreground mt-6 text-xl text-balance max-sm:text-lg">
            When they ask why your team needs AsyncStatus
          </p>
        </div>

        {/* Key Benefits Section */}
        <section className="mt-24">
          <h2 className="text-4xl font-bold text-center mb-16 max-sm:text-3xl">
            Here's What Actually Happens
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border-border rounded-lg border p-6">
              <div className="text-primary text-2xl font-bold mb-3">2-3 hrs</div>
              <h3 className="text-xl font-semibold mb-2">Back per dev per week</h3>
              <p className="text-muted-foreground">
                No more 15-30 min daily standups. No more "quick syncs" that aren't quick. Just actual work time.
              </p>
            </div>
            
            <div className="bg-card border-border rounded-lg border p-6">
              <div className="text-primary text-2xl font-bold mb-3">~$30K</div>
              <h3 className="text-xl font-semibold mb-2">What that time costs you</h3>
              <p className="text-muted-foreground">
                For a 5-person team making $120K average. Yeah, standups are expensive.
              </p>
            </div>
            
            <div className="bg-card border-border rounded-lg border p-6">
              <div className="text-primary text-2xl font-bold mb-3">2 mins</div>
              <h3 className="text-xl font-semibold mb-2">To connect your tools</h3>
              <p className="text-muted-foreground">
                Git, Jira, Slack. Done. We pull your updates automatically. Your team keeps working.
              </p>
            </div>
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-red-600">The Hidden Costs of Daily Standups</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">❌</span>
                  <div>
                    <strong>Context switching kills productivity:</strong> Developers lose 20-30 minutes of deep work time around each meeting
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">❌</span>
                  <div>
                    <strong>Timezone challenges:</strong> Remote teams compromise on timing, leaving some members out or working odd hours
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">❌</span>
                  <div>
                    <strong>Information overload:</strong> Most standup information isn't relevant to most attendees
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">❌</span>
                  <div>
                    <strong>Ritual over value:</strong> Teams go through motions without meaningful collaboration
                  </div>
                </li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-6 text-green-600">The AsyncStatus Solution</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong>Automatic status generation:</strong> Pull updates from Git, Jira, Slack - no manual work required
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong>Global team friendly:</strong> Everyone gets updates when they're ready, in their timezone
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong>Relevant information only:</strong> Filter by team, project, or person - see what matters to you
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong>Preserve deep work:</strong> No interruptions, no context switching, no scheduled breaks in flow
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 max-sm:text-3xl">Calculate Your Team's ROI</h2>
            <p className="text-muted-foreground text-lg">
              See the exact cost savings AsyncStatus will deliver to your team
            </p>
          </div>
          <SavingsCalculator />
        </section>

        {/* Risk Mitigation Section */}
        <section className="mt-24">
          <h2 className="text-4xl font-bold text-center mb-12 max-sm:text-3xl">
            Low Risk, High Reward Implementation
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-4">✅ Zero Learning Curve</h3>
              <p className="text-muted-foreground">
                Your team keeps using the same tools they already know. AsyncStatus works in the background, pulling updates from Git, Jira, Slack, and other platforms you're already using.
              </p>
            </div>
            
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-4">✅ Gradual Rollout</h3>
              <p className="text-muted-foreground">
                Start with one team or project. Run both systems in parallel. Once you see the value, expand to other teams at your own pace.
              </p>
            </div>
            
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-4">✅ Easy Rollback</h3>
              <p className="text-muted-foreground">
                If AsyncStatus doesn't work for your team, simply go back to meetings. No data loss, no process disruption, no vendor lock-in.
              </p>
            </div>
            
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-4">✅ Secure & Compliant</h3>
              <p className="text-muted-foreground">
                Enterprise-grade security, SOC 2 compliance, and data residency options. Your information stays protected and under your control.
              </p>
            </div>
          </div>
        </section>

        {/* Common Objections Section */}
        <section className="mt-24">
          <h2 className="text-4xl font-bold text-center mb-12 max-sm:text-3xl">
            Addressing Common Concerns
          </h2>
          
          <div className="space-y-8">
            <div className="border-border bg-card rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-3">
                "Our team needs face-to-face collaboration"
              </h3>
              <p className="text-muted-foreground">
                AsyncStatus doesn't eliminate collaboration - it eliminates routine status reporting. Your team still meets for planning, problem-solving, and brainstorming. You just get back 5-10 hours per week of unnecessary status meetings.
              </p>
            </div>
            
            <div className="border-border bg-card rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-3">
                "We'll lose visibility into what everyone is working on"
              </h3>
              <p className="text-muted-foreground">
                Actually, you'll gain visibility. AsyncStatus provides searchable, filterable status history. See what any team member worked on last week, last month, or last quarter. Compare that to trying to remember what was said in a standup.
              </p>
            </div>
            
            <div className="border-border bg-card rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-3">
                "This will make our team less connected"
              </h3>
              <p className="text-muted-foreground">
                Status meetings often feel disconnected anyway - people wait for their turn to speak and tune out for everyone else. Replace those routine updates with purposeful team activities: lunch & learns, retrospectives, or focused problem-solving sessions.
              </p>
            </div>
          </div>
        </section>

        {/* Success Stories Preview */}
        <section className="mt-24">
          <h2 className="text-4xl font-bold text-center mb-12 max-sm:text-3xl">
            What Teams Are Saying
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border-border rounded-lg border p-6">
              <p className="text-lg mb-4 italic">
                "We reclaimed 8 hours per week of productive time for our 6-person team. That's equivalent to hiring a part-time developer, but at a fraction of the cost."
              </p>
              <div className="text-sm text-muted-foreground">
                — Engineering Manager, Series B Startup
              </div>
            </div>
            
            <div className="bg-card border-border rounded-lg border p-6">
              <p className="text-lg mb-4 italic">
                "Our global team finally gets updates that work across timezones. No more 6 AM meetings for our European developers or midnight calls for our US team."
              </p>
              <div className="text-sm text-muted-foreground">
                — CTO, Remote-First Company
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-24 text-center">
          <div className="bg-card border-border rounded-lg border p-12 max-sm:p-8">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Give Your Team Their Time Back?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join the waitlist and be among the first teams to experience async status updates. 
              No credit card required, no commitment, just better team productivity.
            </p>
            <WaitlistDialog buttonSize="lg" />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}