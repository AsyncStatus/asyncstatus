import {
  NotSiMicrosoftTeams,
  SiDiscord,
  SiFigma,
  SiGithub,
  SiGitlab,
  SiLinear,
  SiSlack,
} from "@asyncstatus/ui/brand-icons";
import { Button } from "@asyncstatus/ui/components/button";
import { ExternalLink } from "@asyncstatus/ui/icons";
import Link from "next/link";
import { CopyButton } from "../components/copy-button";
import { Header } from "../components/header";
import { RepoInput } from "../components/repo-input";

export default async function Page() {
  return (
    <>
      <Header />

      <main>
        <section className="relative p-1 sm:p-3.5 max-w-6xl mx-auto w-full">
          <div className="absolute top-0 left-0 right-0 h-px bg-neutral-300"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-300"></div>
          <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-300"></div>
          <div className="absolute right-0 top-0 bottom-0 w-px bg-neutral-300"></div>

          <div className="relative w-full bg-radial from-white from-65% overflow-hidden to-neutral-100 px-1 py-12 sm:px-4 sm:py-26 sm:pt-18 rounded-4xl shadow-2xl/5 border border-border">
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
              <h1 className="text-4xl text-center font-bold leading-[1.125] sm:text-5xl">
                AI agents that <br />
                update your team
              </h1>
              <h2 className="text-xl text-muted-foreground text-center leading-[1.43] sm:text-2xl">
                Turn what you build into status updates, <br className="hidden sm:block" />
                release notes, changelogs and more.
              </h2>
            </div>

            <div className="mt-6 max-w-lg mx-auto relative z-20">
              <RepoInput />
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <Button
                asChild
                variant="link"
                size="sm"
                className="group text-muted-foreground/65 group-hover:text-muted-foreground focus:text-muted-foreground active:text-muted-foreground font-normal"
              >
                <Link href="https://changelogs.ai/asyncstatus/asyncstatus" target="_blank">
                  <span>See what we shipped this week</span>
                  <ExternalLink className="size-3 group-hover:scale-110 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="absolute -top-px left-0 right-0 h-px bg-neutral-300 z-10"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-300 z-10"></div>

          <div className="relative max-w-6xl mx-auto w-full">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-300 z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-px bg-neutral-300 z-10"></div>

            <div className="flex flex-wrap items-center justify-between h-full">
              <div className="group relative flex-1 p-3.5 flex flex-col items-center justify-center gap-2 hover:bg-neutral-200 transition-colors">
                <h3 className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Want to try locally?
                </h3>
                <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground bg-white/40 group-hover:bg-white group-hover:text-foreground transition-colors px-2.5 py-[3px] pr-1 rounded-md w-full font-mono">
                  <code>brew install asyncstatus/cli</code>
                  <CopyButton text="brew install asyncstatus/cli" />
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-px bg-neutral-300 z-10"></div>
                <div className="absolute left-0 right-0 -top-px h-px bg-neutral-300 z-10"></div>
              </div>

              <div className="group relative flex-1 p-3.5 flex flex-col items-center justify-center gap-2 hover:bg-neutral-200 transition-colors">
                <h3 className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Have private repos?
                </h3>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full bg-white/40 group-hover:bg-white/75 transition-colors text-muted-foreground group-hover:text-foreground"
                >
                  <Link href="/">
                    <SiGithub className="size-4" />
                    Continue with GitHub
                  </Link>
                </Button>
                <div className="absolute right-0 top-0 bottom-0 w-px bg-neutral-300 z-10"></div>
                <div className="absolute left-0 right-0 -top-px h-px bg-neutral-300 z-10"></div>
              </div>

              <div className="group relative flex-1 p-3.5 flex flex-col items-center justify-center gap-2 hover:bg-neutral-200 transition-colors">
                <h3 className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  API access?
                </h3>
                <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground bg-white/40 group-hover:bg-white group-hover:text-foreground transition-colors px-2.5 py-[3px] pr-1 rounded-md w-full font-mono">
                  <code>npm install @asyncstatus/sdk</code>
                  <CopyButton text="@asyncstatus/sdk" />
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-px bg-neutral-300 z-10"></div>
                <div className="absolute left-0 right-0 -top-px h-px bg-neutral-300 z-10"></div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="absolute -top-px left-0 right-0 h-px bg-neutral-300 z-10"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-300 z-10"></div>

          <div className="max-w-6xl mx-auto w-full flex flex-wrap items-start justify-center">
            <div className="relative flex-1 p-3.5 min-w-xs h-full">
              <div className="absolute -top-px left-0 right-0 h-px bg-neutral-300"></div>
              <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-300"></div>
              <div className="absolute -right-px top-0 bottom-0 w-px bg-neutral-300"></div>

              <div className="p-3.5">
                <h3 className="text-lg leading-relaxed">Agentic updates</h3>
                <p className="text-muted-foreground text-sm">
                  Pulls GitHub commits, Linear issues, Slack messages, and Figma updates into status
                  reports you can share with your team or publish as public links.
                </p>
              </div>

              <img
                src="/slack-usage.jpg"
                alt="Integrations"
                className="mt-3.5 w-full h-1/2 rounded-2xl border border-border"
              />
            </div>

            <div className="relative flex-1 p-3.5 h-full min-w-xs">
              <div className="absolute -top-px left-0 right-0 h-px bg-neutral-300"></div>
              <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-300"></div>
              <div className="absolute right-0 top-0 bottom-0 w-px bg-neutral-300"></div>

              <div className="p-3.5">
                <h3 className="text-lg leading-relaxed">Local CLI</h3>
                <p className="text-muted-foreground text-sm">
                  Generates status updates from git in {"<"}1min. No setup or permissions required.
                  Share them instantly with your manager.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white h-full mt-3.5">
                <div className="p-3 sm:p-4 text-xs sm:text-[13px] font-mono text-foreground/90 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="select-none text-neutral-500">$</span>
                    <span>asyncstatus generate</span>
                  </div>
                  <div className="mt-1">
                    <div>⧗ generating from git...</div>
                    <div className="text-emerald-600"> ✓ generated status update</div>
                    <div className="text-neutral-600">
                      {"  share: "}
                      <Link
                        href="https://asyncstatus.com/s/abc123"
                        target="_blank"
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        https://asyncstatus.com/s/abc123
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mt-3">
                    <span className="select-none text-neutral-500">$</span>
                    <span>asyncstatus progress "onboarding flow with modals"</span>
                  </div>
                  <div className="mt-1">
                    <div>⧗ progress: onboarding flow with modals</div>
                    <div className="text-emerald-600"> → saved</div>
                  </div>

                  <div className="flex items-start gap-2 mt-3">
                    <span className="select-none text-neutral-500">$</span>
                    <span>
                      asyncstatus note "add a11y focus traps, refine step copy, track drop-offs"
                    </span>
                  </div>
                  <div className="mt-1">
                    <div>⧗ notes: add a11y focus traps, refine step copy, track drop-offs</div>
                    <div className="text-emerald-600"> ✓ saved</div>
                  </div>

                  <div className="flex items-start gap-2 mt-3">
                    <span className="select-none text-neutral-500">$</span>
                    <span>asyncstatus mood "energized"</span>
                  </div>
                  <div className="mt-1">
                    <div>⧗ mood: energized</div>
                    <div className="text-emerald-600"> ✓ saved</div>
                  </div>

                  <div className="flex items-start gap-2 mt-3">
                    <span className="select-none text-neutral-500">$</span>
                    <span>asyncstatus blocker "waiting on design review"</span>
                  </div>
                  <div className="mt-1">
                    <div>⧗ blocker: waiting on design review</div>
                    <div className="text-emerald-600"> ✓ saved</div>
                  </div>

                  <div className="flex items-start gap-2 mt-3">
                    <span className="select-none text-neutral-500">$</span>
                    <span>asyncstatus list 7</span>
                  </div>
                  <div className="mt-1">
                    <div>⧗ past 7 days</div>
                    <div className="text-neutral-600"> 21 update(s)</div>
                    <div> 1. Saturday, January 13</div>
                    <div className="text-neutral-600"> Tobi (tobi@asyncstatus.com)</div>
                    <div className="text-neutral-600"> Engineering Team</div>
                    <div className="text-neutral-600"> ✓1 →1 ✗0</div>
                    <div className="text-neutral-600"> • set up integration tests</div>
                    <div className="text-neutral-600"> • working on CI caching for pnpm</div>
                    <div className="text-neutral-600"> mood productive</div>
                    <div className="text-neutral-600"> 12:10</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-[3000px]"></div>
      </main>
    </>
  );
}
