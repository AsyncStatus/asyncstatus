import { getImageProps, ImageProps } from "next/image";
import Link from "next/link";
import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@asyncstatus/ui/components/dialog";
import { ZoomIn } from "@asyncstatus/ui/icons";

export default function NewPage() {
  const {
    props: { srcSet: light, ...rest },
  } = getImageProps({ ...common, src: "/hero-light.webp" });
  const {
    props: { srcSet: lightLg },
  } = getImageProps({ ...commonLg, src: "/hero-light-lg.webp" });

  return (
    <div className="mx-auto mt-24 w-full max-w-3xl p-4 pb-24 max-sm:mt-0">
      <AsyncStatusLogo className="h-3.5 w-auto" />
      <h1 className="mt-3.5 text-lg font-semibold">
        Async status updates for remote startups
      </h1>
      <h2 className="text-sm">
        Made for high-agency teams that value their time.
      </h2>

      <Dialog>
        <DialogTrigger asChild>
          <div className="group relative mt-4 w-full max-w-3xl rounded-md hover:opacity-60">
            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ZoomIn className="text-foreground bg-background/50 pointer-events-none size-8 rounded-full p-1 backdrop-blur-md" />
            </div>

            <picture className="relative z-10 rounded-[inherit]">
              <source media="(min-width: 1300px)" srcSet={lightLg} />
              <source media="(min-width: 768px)" srcSet={light} />
              <img
                {...rest}
                className="border-border h-auto w-full rounded-[inherit] border object-contain select-none"
              />
            </picture>
          </div>
        </DialogTrigger>

        <DialogContent
          hideCloseButton
          className="max-w-7xl border-0 bg-transparent p-0 p-4 outline-none sm:max-w-7xl"
        >
          <DialogTitle hidden aria-hidden>
            Demo image
          </DialogTitle>
          <DialogDescription hidden aria-hidden>
            See the platform
          </DialogDescription>

          <div className="relative w-full overflow-hidden rounded-md bg-transparent">
            <img
              src="/hero-light-lg.webp"
              sizes="100vw"
              alt="Demo image"
              className="h-auto w-full rounded-md object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-2.5 flex items-start justify-end gap-1">
        <Button
          asChild
          variant="ghost"
          className="text-muted-foreground text-xs"
        >
          <a href={process.env.NEXT_PUBLIC_APP_URL} target="_blank">
            Go to app
          </a>
        </Button>

        <Button
          asChild
          variant="ghost"
          className="text-muted-foreground text-xs"
        >
          <a href="mailto:kacper@asyncstatus.com" target="_blank">
            Contact us
          </a>
        </Button>

        <div className="flex flex-col gap-1">
          <Button asChild>
            <a href={process.env.NEXT_PUBLIC_STRIPE_LINK} target="_blank">
              Join private beta
            </a>
          </Button>
          <p className="text-muted-foreground text-xs">
            7 days free, no credit card required.
          </p>
        </div>
      </div>

      <h3 className="mt-8 mb-1.5 text-base font-semibold">How it works?</h3>
      <ol className="list-inside list-decimal text-sm">
        <li>
          You connect your tools (GitHub, Slack){" "}
          <span className="text-muted-foreground">
            which takes less than 5 minutes
          </span>
        </li>
        <li>
          We listen for updates from your tools and generate status updates from
          your team's activity.
        </li>
        <li>Your team can optionally adjust their status updates.</li>
      </ol>

      <h3 className="mt-8 mb-1.5 text-base font-semibold">Use cases</h3>
      <ul className="list-inside list-disc text-sm">
        <li>
          <span className="italic">Developers</span> - generate status based on
          your activity.
        </li>
        <li>
          <span className="italic">Product owners</span> - see summary of your
          team's work, spot blockers and mood changes.
        </li>
        <li>
          <span className="italic">Founders</span> - get insights from your team
          without unnecessary questions.
        </li>
      </ul>

      <h3 className="mt-8 mb-1.5 text-base font-semibold">Features</h3>
      <ul className="list-inside list-disc text-sm">
        <li>Integrations with GitHub and Slack.</li>
        <li>Blockers and mood changes.</li>
        <li>User timezones.</li>
        <li>Slack bot that asks for scheduled updates and posts summaries.</li>
        <li>Manual updates.</li>
        <li>
          <Link
            target="_blank"
            href="https://github.com/asyncstatus/web"
            className="text-muted-foreground underline underline-offset-2"
          >
            Open source
          </Link>
        </li>
      </ul>
    </div>
  );
}

const common = {
  alt: "AsyncStatus App",
  width: 1300,
  height: 800,
  unoptimized: true,
  sizes: "100vw",
} satisfies Omit<ImageProps, "src">;
const commonLg = { ...common, width: 2666, height: 1500 } satisfies Omit<
  ImageProps,
  "src"
>;
