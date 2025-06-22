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
            <Link href="/why-to-use-our-app" className="hover:text-foreground">
              Why AsyncStatus
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
          <h1 className="text-6xl font-bold text-balance tracking-wide max-sm:text-4xl">
            How It Works? A&nbsp;Quick&nbsp;Overview
          </h1>
          <p className="text-muted-foreground mt-6 text-xl text-balance max-sm:text-lg">
            Send this to your manager
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
              <h2 className="text-3xl font-bold mb-6">Why Standups Suck</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">💀</span>
                  <div>
                    <strong>They kill flow state</strong> — You know that feeling when you're in the zone at 10:30am and then... standup.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <div>
                    <strong>Timezone hell</strong> — Someone's always getting screwed. 6am calls or staying late, pick your poison.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <div>
                    <strong>90% irrelevant info</strong> — You don't care about the CSS bug Sarah's fixing. She doesn't care about your API refactor.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <div>
                    <strong>Theater, not communication</strong> — Everyone performs their status update then zones out.
                  </div>
                </li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-6">What We Do Instead</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">🤖</span>
                  <div>
                    <strong>Your tools already know what you did</strong> — Git commits, closed tickets, Slack messages. We just format it nicely.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>Works for humans across timezones</strong> — Read updates when you want. No more 5am "quick syncs."
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>Filter the noise</strong> — Only see updates from people/projects you actually care about.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>Keep your flow</strong> — No scheduled interruptions. Just pure, uninterrupted coding time.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 max-sm:text-3xl">Do The Math</h2>
            <p className="text-muted-foreground text-lg">
              Your manager cares about numbers. Here they are.
            </p>
          </div>
          <SavingsCalculator />
        </section>

        {/* Risk Mitigation Section */}
        <section className="mt-24">
          <h2 className="text-4xl font-bold text-center mb-12 max-sm:text-3xl">
            "But What If It Doesn't Work?"
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-4">Your team changes nothing</h3>
              <p className="text-muted-foreground">
                Keep using Git, Jira, Slack like you always have. We just read the data and format it. No new tools to learn.
              </p>
            </div>
            
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-4">Test it with one team</h3>
              <p className="text-muted-foreground">
                Pick your most fed-up-with-standups team. Run it alongside meetings for a week. See what happens.
              </p>
            </div>
            
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-4">Easy exit</h3>
              <p className="text-muted-foreground">
                Don't like it? Just stop using it. Go back to meetings. We won't email you 47 times asking why you left.
              </p>
            </div>
            
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-4">🔒 Actually secure</h3>
              <p className="text-muted-foreground">
                We're developers too — we get why security and encryption matters.
              </p>
            </div>
          </div>
        </section>

        {/* Common Objections Section */}
        <section className="mt-24">
          <h2 className="text-4xl font-bold text-center mb-12 max-sm:text-3xl">
            "Yeah But..."
          </h2>
          
          <div className="space-y-8">
            <div className="border-border bg-card rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-3">
                "We need face-to-face collaboration!"
              </h3>
              <p className="text-muted-foreground">
                Cool. Keep your design reviews, planning sessions, and architecture discussions. Those are useful meetings. Daily status theater? Not so much.
              </p>
            </div>
            
            <div className="border-border bg-card rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-3">
                "But then I won't know what everyone's doing!"
              </h3>
              <p className="text-muted-foreground">
                You'll know more. Search for "what did Alex work on last week?" Try doing that with standup memories. Plus, it's all there when you need it — not just for 15 minutes at 9:30am.
              </p>
            </div>
            
            <div className="border-border bg-card rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-3">
                "Our team will feel disconnected!"
              </h3>
              <p className="text-muted-foreground">
                Do you feel connected during standups now? Honestly? Use that time for actual team building. Lunch together. Pair programming. Literally anything else.
              </p>
            </div>
          </div>
        </section>



        {/* CTA Section */}
        <section className="mt-24 text-center">
          <div className="bg-card border-border rounded-lg border p-12 max-sm:p-8">
            <h2 className="text-3xl font-bold mb-4">
              Try It. What's The Worst That Could Happen?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              You go back to standups. That's it. That's the worst case. 
              But maybe — just maybe — you get your mornings back.
            </p>
            <WaitlistDialog buttonSize="lg" />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}