import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { Button } from "@asyncstatus/ui/components/button";
import Link from "next/link";

import { CtaSection } from "../components/cta-section";
import { Footer } from "../components/footer";
import { IntegrationsList } from "../components/integrations-list";
import { MobileMenu } from "../components/mobile-menu";
import { Pricing } from "../components/pricing";
import SavingsCalculator from "../components/savings-calculator";
import { TargetAudience } from "../components/target-audience";
import { BrandCTA, ValueDescriptions } from "../components/brand-copy";




export default async function Page() {

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

        <IntegrationsList />

        <h2 className="text-fit mr-[2.5vw] text-center font-bold max-sm:hidden">
          <span>
            <span>Automate status updates</span>
          </span>
          <span aria-hidden="true">Automate status updates</span>
        </h2>
        <h2 className="hidden text-center text-5xl font-bold max-sm:block max-sm:mt-6">
          Automate status updates
        </h2>

        <h3 className="text-muted-foreground mt-6 text-center text-2xl leading-normal text-balance max-md:text-lg max-sm:text-base">
        Generate status updates by monitoring your team's activity in code, Slack, and others. Or write them yourself.
        </h3>


        <video
          className="mt-8 w-full rounded-lg max-sm:mt-6 aspect-[2.4/1]"
          autoPlay
          loop
          muted
          playsInline
          controls
        >
          <source src="https://cdn.asyncstatus.com/AsyncStatusAd.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="flex justify-center mt-8 gap-4 max-sm:flex-col">
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

        <div className="mt-14 flex flex-col items-center justify-center">
          <Button size="lg" asChild>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/sign-up`}
              className="hover:text-foreground"
            >
              <BrandCTA variant="Secondary" />
            </Link>
          </Button>

          <p className="text-muted-foreground text-xs mt-2">
            No credit card required. Cancel anytime.
          </p>
        </div>

        {/* How it works section */}
        <section id="how-it-works" className="mt-36 max-sm:mt-24">
          <div className="mb-16 text-center max-sm:mb-12">
            <h3 className="text-center text-6xl font-bold max-sm:text-4xl">
              How it works?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-sm:gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg mb-4 max-sm:h-10 max-sm:w-10 max-sm:text-base max-sm:mb-3">
                1
              </div>
              <div>
                <h5 className="text-xl font-semibold mb-3 max-sm:text-lg max-sm:mb-2">
                  Connect to your work
                </h5>
                <p className="text-muted-foreground text-lg leading-relaxed max-sm:text-base">
                  You Connect to your work (GitHub, Slack) which takes less than 5 minutes
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg mb-4 max-sm:h-10 max-sm:w-10 max-sm:text-base max-sm:mb-3">
                2
              </div>
              <div>
                <h5 className="text-xl font-semibold mb-3 max-sm:text-lg max-sm:mb-2">
                  We generate updates automatically
                </h5>
                <p className="text-muted-foreground text-lg leading-relaxed max-sm:text-base">
                  We listen for updates from your tools and generate status updates from your team's activity.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg mb-4 max-sm:h-10 max-sm:w-10 max-sm:text-base max-sm:mb-3">
                3
              </div>
              <div>
                <h5 className="text-xl font-semibold mb-3 max-sm:text-lg max-sm:mb-2">
                  You are always up to date
                </h5>
                <p className="text-muted-foreground text-lg leading-relaxed max-sm:text-base">
                  Your team can optionally adjust their status updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="team">
          <TargetAudience />
        </section>





        <section id="calculator" className="mt-36">
          <div className="mb-12 text-center">
            <h3 className="text-center text-6xl font-bold max-sm:text-5xl">
              Calculate your savings
            </h3>
            <h3 className="text-muted-foreground mt-6 text-xl text-pretty">
              See how much time and money your team saves by dropping standups for async updates.
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
      </main>

      <Footer />
    </>
  );
}
