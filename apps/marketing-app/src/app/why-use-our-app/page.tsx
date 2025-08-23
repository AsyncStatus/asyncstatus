import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import Link from "next/link";

import { Footer } from "../components/footer";
import { MobileMenu } from "../components/mobile-menu";
import SavingsCalculator from "../components/savings-calculator";
import { WaitlistDialog } from "../components/waitlist-dialog";

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
              <h1 className="text-lg font-medium max-sm:text-base">AsyncStatus</h1>
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
            <Link href="/why-use-our-app" className="hover:text-foreground">
              Why AsyncStatus
            </Link>
          </div>
        </div>

        <div className="z-10 flex items-center gap-7 text-sm max-sm:hidden">
          <Link href={process.env.NEXT_PUBLIC_APP_URL ?? ""} className="hover:text-foreground">
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
            Why&nbsp;AsyncStatus?
          </h1>
          <p className="text-muted-foreground mt-6 text-xl text-balance max-sm:text-lg">
            Because standups are broken
          </p>
        </div>

        {/* The Problem */}
        <section className="mt-24">
          <h2 className="text-4xl font-bold text-center mb-12 max-sm:text-3xl">
            Your Morning Goes Like This
          </h2>

          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">
                9:27 AM: You're in the zone, about to solve that tricky bug.
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg text-muted-foreground">
                9:30 AM: "Daily standup time!"
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg text-muted-foreground">
                9:45 AM: Meeting ends. What were you working on again?
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">
                Flow state: destroyed.
              </p>
            </div>
          </div>
        </section>

        {/* Simple Benefits */}
        <section className="mt-24">
          <h2 className="text-4xl font-bold text-center mb-16 max-sm:text-3xl">
            What If You Could Skip That?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-primary text-5xl font-bold mb-4">↗️</div>
              <h3 className="text-xl font-semibold mb-2">Keep your flow</h3>
              <p className="text-muted-foreground">
                No more 9:30 AM interruptions when you're most productive.
              </p>
            </div>

            <div className="text-center">
              <div className="text-primary text-5xl font-bold mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-2">Work across timezones</h3>
              <p className="text-muted-foreground">
                No more 6 AM calls or staying late for "quick syncs."
              </p>
            </div>

            <div className="text-center">
              <div className="text-primary text-5xl font-bold mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Actually useful updates</h3>
              <p className="text-muted-foreground">
                See what matters to you, skip what doesn't.
              </p>
            </div>
          </div>
        </section>

        {/* How Simple It Is */}
        <section className="mt-24">
          <h2 className="text-4xl font-bold text-center mb-12 max-sm:text-3xl">
            Here's How Simple It Is
          </h2>

          <div className="space-y-8 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect your tools</h3>
                <p className="text-muted-foreground">
                  GitHub, Jira, Slack. Takes 2 minutes. Your team keeps working exactly like before.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">We track what you do</h3>
                <p className="text-muted-foreground">
                  Commits, tickets, messages. All the work you're already doing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Everyone sees the updates</h3>
                <p className="text-muted-foreground">
                  When they want to. No meetings required.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 max-sm:text-3xl">The Numbers</h2>
            <p className="text-muted-foreground text-lg">
              Calculate what standups actually cost you.
            </p>
          </div>
          <SavingsCalculator />
        </section>

        {/* What People Worry About */}
        <section className="mt-24">
          <h2 className="text-4xl font-bold text-center mb-12 max-sm:text-3xl">
            "But What About..."
          </h2>

          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="border-border bg-card rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-3">"Team bonding!"</h3>
              <p className="text-muted-foreground">
                Use that time for actual team bonding. Lunch together. Pair programming. Coffee chats. Not status theater.
              </p>
            </div>

            <div className="border-border bg-card rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-3">"I won't know what's happening!"</h3>
              <p className="text-muted-foreground">
                You'll know more. Search "what did Sarah work on last week?" Try doing that with standup memories.
              </p>
            </div>

            <div className="border-border bg-card rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-3">"What if my team hates it?"</h3>
              <p className="text-muted-foreground">
                Then go back to standups. That's it. We won't guilt trip you with 20 retention emails.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-24 text-center">
          <div className="bg-card border-border rounded-lg border p-12 max-sm:p-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Your Mornings Back?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Start with one team. See what happens. Worst case? You go back to meetings.
            </p>
            <WaitlistDialog buttonSize="lg" />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
