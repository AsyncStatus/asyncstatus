import Link from "next/link";
import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { Button } from "@asyncstatus/ui/components/button";
import { motion } from "framer-motion";

import { BetaMessage } from "./components/beta-message";
import { ConnectCard } from "./components/connect-card";
import { CtaSection } from "./components/cta-section";
import { FeaturesList } from "./components/features-list";
import { Footer } from "./components/footer";
import { GenerateCard } from "./components/generate-card";
import { MobileMenu } from "./components/mobile-menu";
import { ReviewCard } from "./components/review-card";
import { TargetAudience } from "./components/target-audience";
import { TrackCard } from "./components/track-card";
import { UseItYourWay } from "./components/use-it-your-way";
import { WaitlistDialog } from "./components/waitlist-dialog";
import { peopleSummary } from "./people-summary";
import { PersonSelect } from "./person-select";

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const person =
    typeof searchParams.person === "string"
      ? (searchParams.person ?? "frontend-developer")
      : "frontend-developer";

  return (
    <>
      <header className="sticky top-3 z-50 mx-3 flex items-center justify-between gap-2 p-4.5 py-2.5 pr-2.5">
        <div className="border-border bg-background/80 absolute top-0 left-0 h-full w-full rounded-lg border backdrop-blur-[12px]" />

        {/* Progressive blur overlays - stronger towards top */}
        <div className="pointer-events-none absolute -top-24 right-0 left-0 h-24">
          <div className="from-background/80 absolute inset-0 bg-gradient-to-b to-transparent backdrop-blur-[1px]" />
          <div className="from-background/80 mask-top-20 absolute inset-0 bg-gradient-to-b to-transparent backdrop-blur-[2px]" />
          <div className="from-background/80 mask-top-40 absolute inset-0 bg-gradient-to-b to-transparent backdrop-blur-[4px]" />
          <div className="from-background/80 mask-top-60 absolute inset-0 bg-gradient-to-b to-transparent backdrop-blur-[8px]" />
          <div className="from-background/80 mask-top-80 absolute inset-0 bg-gradient-to-b to-transparent backdrop-blur-[16px]" />
          <div className="from-background/80 mask-top-100 absolute inset-0 bg-gradient-to-b to-transparent backdrop-blur-[32px]" />
        </div>

        {/* Bottom blur - subtle */}
        {/* <div className="from-background/60 pointer-events-none absolute right-0 -bottom-4 left-0 h-4 bg-gradient-to-b to-transparent backdrop-blur-[1px]" /> */}

        {/* Side blurs */}
        <div className="to-background/60 pointer-events-none absolute top-0 bottom-0 -left-6 w-6 bg-gradient-to-r from-transparent backdrop-blur-[1px]" />
        <div className="to-background/60 pointer-events-none absolute top-0 -right-6 bottom-0 w-6 bg-gradient-to-l from-transparent backdrop-blur-[1px]" />

        <div className="z-10 flex flex-col">
          <Link href="/" className="flex items-center gap-2">
            <AsyncStatusLogo className="h-3.5 w-auto" />
            <h1 className="text-lg font-medium max-sm:text-base">
              AsyncStatus
            </h1>
          </Link>
        </div>

        <div className="z-10 flex items-center gap-7 text-sm max-sm:hidden">
          <Link href="#how-it-works" className="">
            How it works
          </Link>

          <Link href="#features" className="">
            Features
          </Link>

          <Link href="#team" className="">
            Use cases
          </Link>

          <Link href="/" className="">
            Login
          </Link>

          <WaitlistDialog buttonSize="sm" />
        </div>

        <MobileMenu />
      </header>

      <main className="mx-auto mt-48 w-full max-w-6xl px-4">
        {/* <h2 className="text-fit mr-[2.5vw] text-center font-bold max-sm:hidden">
          <span>
            <span>Async status updates for remote startups</span>
          </span>
          <span aria-hidden="true">
            Async status updates for remote startups
          </span>
        </h2>
        <h2 className="hidden text-center text-2xl font-bold max-sm:block">
          Async status updates for remote startups
        </h2>

        <h3 className="text-muted-foreground mt-4 text-center text-xl leading-normal max-md:text-lg max-sm:text-base">
          No more standups. No more status meetings. No more status emails.
          <br />
          Turns out your team knew how to work all along.
        </h3> */}

        {/* <h2 className="text-fit mr-[2.5vw] text-center font-bold max-sm:hidden">
          <span>
            <span>Drop your standups</span>
          </span>
          <span aria-hidden="true">Drop your standups</span>
        </h2>
        <h2 className="hidden text-center text-2xl font-bold max-sm:block">
          Drop your standups
        </h2>

        <h3 className="text-muted-foreground mt-4 text-center text-xl leading-normal max-md:text-lg max-sm:text-base">
          Async status updates for remote startups. Built for high-agency teams
          that value their time.
        </h3> */}

        <h2 className="text-fit mr-[2.5vw] text-center font-bold max-sm:hidden">
          <span>
            <span>Standup meetings suck</span>
          </span>
          <span aria-hidden="true">Standup meetings suck</span>
        </h2>
        <h2 className="hidden text-center text-5xl font-bold max-sm:block">
          Standup meetings suck
        </h2>

        <h3 className="text-muted-foreground mt-6 text-center text-2xl leading-normal text-balance max-md:text-lg max-sm:text-base">
          Your team already pushed code, closed tickets, replied in threads,
          fixed small things no one asked them to. We turn it into an update. Or
          you can write it yourself. Either way, no one has to talk about it at
          9:30 a.m.
        </h3>

        <div className="mt-14 flex justify-center">
          <WaitlistDialog buttonSize="lg" />
        </div>

        <img
          src="/hero-light.webp"
          alt="AsyncStatus app screenshot"
          className="border-border mt-36 w-full rounded-lg border"
        />

        <div className="mt-36 flex flex-col items-center">
          <div className="relative w-full max-w-6xl">
            <div className="flex items-center justify-between">
              <div className="bg-background border-border rounded-lg border px-4 py-2">
                <div className="inline-flex items-center gap-0.5">
                  <span className="text-lg">Standup for</span>
                  <PersonSelect
                    defaultValue="frontend-developer"
                    value={person}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-12">
              <div>
                <h4 className="text-muted-foreground mb-3 text-sm font-medium">
                  In the meeting
                </h4>
                <div className="border-border/40 bg-muted/30 rounded-lg border p-4">
                  <p className="text-muted-foreground/90 text-lg text-balance">
                    {peopleSummary[person].standupText}
                  </p>
                  <div className="text-muted-foreground mt-3 flex items-center gap-3 text-sm">
                    <span>{peopleSummary[person].meetingDetails.time}</span>
                    <span>·</span>
                    <span>
                      {peopleSummary[person].meetingDetails.peopleListening}{" "}
                      people listening
                    </span>
                    <span>·</span>
                    <span>
                      {peopleSummary[person].meetingDetails.peopleTyping} people
                      typing
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-muted-foreground mb-3 text-sm font-medium">
                  What actually happened
                </h4>
                <div className="flex flex-col gap-2">
                  {peopleSummary[person].summary.map((summary, index) => (
                    <div key={summary} className="flex items-start gap-4">
                      <span className="text-primary mt-1 text-sm font-medium">
                        0{index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-lg">{summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <h3
          className="mt-36 text-center text-6xl font-bold max-sm:text-5xl"
          id="how-it-works"
        >
          How it works
        </h3>
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-12">
          <ConnectCard />
          <TrackCard />
          <GenerateCard />
          <ReviewCard />
        </div>

        <UseItYourWay />

        <section id="team">
          <TargetAudience />
        </section>

        <section id="features">
          <FeaturesList />
        </section>

        <section id="beta">
          <BetaMessage />
        </section>

        <CtaSection />
      </main>

      <Footer />
    </>
  );
}
