import {
  NotSiMicrosoftTeams,
  SiDiscogs,
  SiDiscord,
  SiFigma,
  SiGithub,
  SiGitlab,
  SiLinear,
  SiSlack,
} from "@asyncstatus/ui/brand-icons";
import { Button } from "@asyncstatus/ui/components/button";
import Link from "next/link";
import { CopyButton } from "../components/copy-button";
import { Header } from "../components/header";
import { RepoInput } from "../components/repo-input";

export default async function Page() {
  return (
    <>
      <Header />

      <main>
        <section className="relative p-3.5 max-w-6xl mx-auto w-full">
          <div className="absolute top-0 left-0 right-0 h-px bg-neutral-300"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-300"></div>
          <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-300"></div>
          <div className="absolute right-0 top-0 bottom-0 w-px bg-neutral-300"></div>

          <div className="relative w-full bg-radial from-white from-65% overflow-hidden to-neutral-100 p-4 py-24 pt-18 rounded-4xl shadow-2xl/5 border border-border">
            <div
              className="absolute inset-0 z-0 mix-blend-darken"
              style={{
                background:
                  "radial-gradient(ellipse 150% 100% at 50% 185%, transparent 0%, rgba(13, 84, 217, 0.15) 60%, transparent 100%), #ffffff",
              }}
            />

            <div className="flex items-center justify-center gap-1 border border-primary rounded-full px-2 py-1 w-fit mx-auto">
              <p className="text-primary text-xs">Works across</p>
              <div className="flex items-center gap-1">
                <SiGithub className="size-3.5 text-primary" />
                <SiGitlab className="size-3.5 text-primary" />
                <SiSlack className="size-3.5 text-primary" />
                <SiDiscord className="size-3.5 text-primary" />
                <NotSiMicrosoftTeams className="size-3.5 fill-primary" />
                <SiLinear className="size-3.5 text-primary" />
                <SiFigma className="size-3.5 text-primary" />
              </div>
            </div>

            <div className="flex flex-col items-center relative z-20 justify-center gap-4 mt-6">
              <h1 className="text-5xl text-center font-bold leading-[1.125]">
                AI Agents that <br />
                keep you updated.
              </h1>
              <h2 className="text-2xl text-muted-foreground text-center leading-[1.43]">
                Turn what you build into status updates, <br />
                release notes, changelogs and more.
              </h2>
            </div>

            <div className="mt-6 max-w-lg mx-auto relative z-20">
              <RepoInput />
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="absolute -top-px left-0 right-0 h-px bg-neutral-300"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-300"></div>

          <div className="relative p-3.5 max-w-6xl mx-auto w-full">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-300"></div>
            <div className="absolute right-0 top-0 bottom-0 w-px bg-neutral-300"></div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base text-muted-foreground">Want to try locally?</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-white px-2.5 py-1 pr-1 rounded-md font-mono">
                  <code className="font-semibold">brew install asyncstatus/tap/cli</code>
                  <CopyButton text="brew install asyncstatus/tap/cli" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base text-muted-foreground">Have private repos?</h3>
                <Button asChild variant="outline" size="sm">
                  <Link href="/">
                    <SiGithub className="size-4" />
                    Continue with GitHub
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="h-[3000px]"></div>
      </main>
    </>
  );
}
