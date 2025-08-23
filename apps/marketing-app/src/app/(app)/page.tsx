import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { Button } from "@asyncstatus/ui/components/button";
import Link from "next/link";
import { BetaMessage } from "../components/beta-message";
import { ConnectCard } from "../components/connect-card";
import { CtaSection } from "../components/cta-section";
import { FaqSection } from "../components/faq-section";
import { FeaturesList } from "../components/features-list";
import { Footer } from "../components/footer";
import { GenerateCard } from "../components/generate-card";
import { MobileMenu } from "../components/mobile-menu";
import { Pricing } from "../components/pricing";
import { ReviewCard } from "../components/review-card";
import SavingsCalculator from "../components/savings-calculator";
import { TargetAudience } from "../components/target-audience";
import { TrackCard } from "../components/track-card";
import { UseItYourWay } from "../components/use-it-your-way";
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
            <Link href="#how-it-works" className="hover:text-foreground">
              How it works
            </Link>
            <Link href="#features" className="hover:text-foreground">
              Features
            </Link>
            <Link href="#team" className="hover:text-foreground">
              Use cases
            </Link>
            <Link href="#pricing" className="hover:text-foreground">
              Pricing
            </Link>
          </div>
        </div>

        <div className="z-10 flex items-center gap-7 text-sm max-sm:hidden">
          <Link href={process.env.NEXT_PUBLIC_APP_URL ?? ""} className="hover:text-foreground">
            Login
          </Link>

          <Button size="sm" asChild>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/sign-up`}
              className="hover:text-foreground"
            >
              <span>Create an account</span>
            </Link>
          </Button>
        </div>

        <MobileMenu />
      </header>

      <main className="mx-auto mt-12 w-full max-w-6xl px-4 max-sm:mt-4">
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

        <div className="flex justify-center pt-16 pb-12 max-sm:pt-16 max-sm:pb-12">
          <a
            href="https://www.producthunt.com/products/async-status-updates-for-remote-startups?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-asyncstatus"
            target="_blank"
            rel="noopener"
          >
            {/** biome-ignore lint/performance/noImgElement: it's a product hunt badge */}
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=999509&theme=neutral&t=1754045157676"
              alt="AsyncStatus - Don&#0039;t&#0032;join&#0032;another&#0032;9&#0058;30am&#0032;standup&#0032;meeting&#0032;ever&#0032;again&#0046; | Product Hunt"
              style={{ width: "187.5px", height: "40.5px" }}
              width="187.5"
              height="40.5"
            />
          </a>
        </div>

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
          Your team already pushed code, closed tickets, replied in threads, fixed small things no
          one asked them to. We turn it into an update. Or you can write it yourself. Either way, no
          one has to talk about it at 9:30 a.m.
        </h3>

        <div className="mt-14 flex flex-col items-center justify-center max-sm:mt-6">
          <Button size="lg" asChild>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/sign-up`}
              className="hover:text-foreground"
            >
              <span>Turn activity into updates</span>
            </Link>
          </Button>

          <p className="text-muted-foreground text-xs mt-2">
            No credit card required. Cancel anytime.
          </p>
        </div>

        {/* aspect-[2.4/1] */}
        <video
          className="mt-36 w-full rounded-lg max-sm:mt-16 aspect-[2.4/1]"
          autoPlay
          loop
          muted
          playsInline
          controls
        >
          <source src="https://cdn.asyncstatus.com/AsyncStatusAd.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="flex justify-center mt-12 gap-4 max-sm:flex-col">
          <Button variant="secondary" asChild>
            <Link href="https://youtu.be/y_Hl0rVJHKs" target="_blank">
              <span>Watch intro video</span>
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="https://youtu.be/kPK0FMHNSDY" target="_blank">
              <span>Watch full product demo</span>
            </Link>
          </Button>
        </div>

        {/* <img
          src="/hero-light.webp"
          alt="AsyncStatus app screenshot"
          className="border-border mt-36 w-full rounded-lg border max-sm:mt-16"
        /> */}

        <div className="mt-36 flex flex-col items-center">
          <div className="relative w-full max-w-6xl">
            <div className="flex items-center justify-between">
              <div className="bg-background border-border rounded-lg border px-4 py-2 max-sm:w-full">
                <div className="inline-flex items-center gap-0.5 max-sm:gap-1.5">
                  <span className="text-lg">Standup for</span>
                  <PersonSelect defaultValue="frontend-developer" value={person} />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-12">
              <div>
                <h4 className="text-muted-foreground mb-3 text-sm font-medium">In the meeting</h4>
                <div className="border-border/40 bg-muted/30 rounded-lg border p-4">
                  <p className="text-muted-foreground/90 text-lg text-balance">
                    {(() => {
                      const fullText = peopleSummary[person].standupText;
                      const words = fullText.split(/\s+/);
                      if (words.length <= 100) {
                        return fullText;
                      } else {
                        return (
                          <>
                            {words.slice(0, 100).join(" ")}
                            <span className="text-foreground">
                              {" "}
                              and {words.length - 100} more words.
                            </span>
                          </>
                        );
                      }
                    })()}
                  </p>
                  <div className="text-muted-foreground mt-3 flex items-center gap-3 text-sm">
                    <span>{peopleSummary[person].meetingDetails.time}</span>
                    <span>·</span>
                    <span>
                      {peopleSummary[person].meetingDetails.peopleListening} people listening
                    </span>
                    <span>·</span>
                    <span>{peopleSummary[person].meetingDetails.peopleTyping} people typing</span>
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
                      <span className="text-primary mt-1 text-sm font-medium">0{index + 1}</span>
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

        <h3 className="mt-36 text-center text-6xl font-bold max-sm:text-5xl" id="how-it-works">
          How it works
        </h3>
        <div className="mt-24 grid grid-cols-1 gap-8 max-sm:gap-12 sm:grid-cols-2 md:gap-12">
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

        <section id="early-stage">
          <BetaMessage />
          <div className="flex justify-center mt-12">
            <Button size="lg" asChild>
              <Link
                href={`${process.env.NEXT_PUBLIC_APP_URL}/sign-up`}
                className="hover:text-foreground"
              >
                <span>Turn activity into updates</span>
              </Link>
            </Button>
          </div>
        </section>

        <section id="calculator" className="mt-36">
          <div className="mb-12 text-center">
            <h3 className="text-center text-6xl font-bold max-sm:text-5xl">
              Calculate your savings
            </h3>
            <h3 className="text-muted-foreground mt-6 text-xl text-pretty">
              See how much time and money your team can save by replacing synchronous standups with
              AsyncStatus.
            </h3>
          </div>
          <SavingsCalculator />

          <p className="text-muted-foreground/80 mt-10 text-[0.65rem] text-pretty">
            <strong>Disclaimer</strong>: These figures are estimates provided for illustrative
            purposes only and may not accurately reflect your team's specific situation. They do not
            constitute financial advice or a guarantee of actual savings. <br />
            <br />
            <strong>How we calculate your savings</strong>: Hourly rate is derived from the average
            salary divided by{" "}
            <code className="whitespace-nowrap max-sm:whitespace-normal">
              260&nbsp;working&nbsp;days&nbsp;×&nbsp;8&nbsp;hours
            </code>
            . Gross stand-up time per month&nbsp;=&nbsp;
            <code className="whitespace-nowrap max-sm:whitespace-normal">
              team&nbsp;size&nbsp;×&nbsp;stand-up&nbsp;length&nbsp;(min)&nbsp;×&nbsp;working&nbsp;days&nbsp;/&nbsp;60
            </code>
            . We assume each developer still spends the
            <strong>&nbsp;async follow-up time&nbsp;</strong>
            (default&nbsp;10&nbsp;min/day) that you set in the slider updating or reading status.
            Hours saved per month therefore use
            <code className="whitespace-nowrap max-sm:whitespace-normal">
              (stand-up&nbsp;length&nbsp;−&nbsp;async&nbsp;follow-up&nbsp;time)
            </code>
            . Monthly savings are those hours multiplied by the hourly rate; annual savings are
            simply monthly savings × 12. Your numbers update live as you move the sliders.
          </p>
        </section>

        <section id="pricing">
          <Pricing />
        </section>

        <CtaSection />

        <FaqSection />
      </main>

      <Footer />
    </>
  );
}
