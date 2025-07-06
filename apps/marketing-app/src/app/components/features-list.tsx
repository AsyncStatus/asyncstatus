"use client";

import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import {
  FolderIcon,
  GlobeIcon,
  LockIcon,
  PencilIcon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
  SlackIcon,
  UserIcon,
} from "@asyncstatus/ui/icons";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

function ScrambledText({ text }: { text: string }) {
  const [scrambledText, setScrambledText] = useState(text);
  const scrambleCharacters = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`";
  const intervalSpeed = 50;
  const staggerDuration = 2000;

  useEffect(() => {
    const scrambleInterval = setInterval(() => {
      startScrambleAnimation();
    }, 5000);

    return () => clearInterval(scrambleInterval);
  }, [text]);

  const startScrambleAnimation = () => {
    let currentIteration = 0;
    const maxIterations = 10;
    const lettersToKeep = new Set<number>();

    const interval = setInterval(() => {
      setScrambledText((current) =>
        current
          .split("")
          .map((char, idx) => {
            // Always preserve spaces
            if (char === " " || lettersToKeep.has(idx)) return text[idx];
            return scrambleCharacters[Math.floor(Math.random() * scrambleCharacters.length)];
          })
          .join(""),
      );

      currentIteration++;

      // Gradually reveal original letters, but don't count spaces
      if (currentIteration > maxIterations / 2) {
        let revealIndex;
        do {
          revealIndex = Math.floor(Math.random() * text.length);
        } while (text[revealIndex] === " " || lettersToKeep.has(revealIndex));
        lettersToKeep.add(revealIndex);
      }

      // Count non-space characters for completion check
      const nonSpaceChars = text.split("").filter((char) => char !== " ").length;
      const keptNonSpaceChars = Array.from(lettersToKeep).filter((idx) => text[idx] !== " ").length;

      if (currentIteration >= maxIterations || keptNonSpaceChars === nonSpaceChars) {
        clearInterval(interval);
        setTimeout(() => setScrambledText(text), 100);
      }
    }, intervalSpeed);
  };

  return (
    <span className="inline-block whitespace-pre-wrap">
      {scrambledText.split("").map((char, idx) => (
        <motion.span
          key={idx}
          initial={{ opacity: 1 }}
          animate={{
            opacity: char === " " ? 1 : [1, 0.8, 1],
            scale: char === " " ? 1 : [1, 1.05, 1],
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
            times: [0, 0.5, 1],
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentUpdateIndex, setCurrentUpdateIndex] = useState(0);

  const updates = [
    "Shipped the new landing page design. Working on improving the auth flow next.",
    "Fixed 3 critical bugs in the API. Performance is much better now.",
    "Updated documentation for v2.0. Starting work on the new dashboard features.",
    "Great progress on the mobile app. Need design review for new icons.",
    "Deployed database optimizations. Response times down by 40%.",
  ];

  useEffect(() => {
    const startTyping = () => {
      setIsTyping(true);
      let currentIndex = 0;
      const currentText = updates[currentUpdateIndex];

      const typeInterval = setInterval(() => {
        if (currentIndex <= currentText.length) {
          setDisplayedText(currentText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setDisplayedText("");
            setIsTyping(false);
            // Move to next update
            setCurrentUpdateIndex((prev) => (prev + 1) % updates.length);
          }, 2000); // Wait 2 seconds before resetting
        }
      }, 50); // Type each character every 50ms

      return () => clearInterval(typeInterval);
    };

    if (!isTyping) {
      const timer = setTimeout(startTyping, 1000);
      return () => clearTimeout(timer);
    }
  }, [isTyping, currentUpdateIndex]);

  return <span className={`${isTyping ? "border-primary border-r-2" : ""}`}>{displayedText}</span>;
}

export function FeaturesList() {
  return (
    <section className="mt-48">
      <h3 className="text-center text-6xl font-bold max-sm:text-5xl">Core features</h3>

      <div className="mt-24 grid grid-cols-12 gap-4">
        {/* Row 1 */}
        <div className="group border-border bg-card relative col-span-12 flex h-full flex-col justify-between rounded-xl border p-5 transition-all duration-300 hover:shadow-sm md:col-span-8 md:p-6">
          <div>
            <div className="mb-3 flex items-center">
              <div className="border-border/60 bg-background/40 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
                <RefreshCwIcon
                  className="h-4 w-4 text-cyan-500/80 dark:text-cyan-400/80"
                  strokeWidth={1.5}
                />
              </div>
              <h4 className="ml-3 text-lg font-medium tracking-tight">
                Intelligent data integration
              </h4>
            </div>

            <p className="text-muted-foreground text-sm md:text-base">
              Automatically pulls signals from GitHub and Slack, clearly surfacing important updates
              and work, so you don't have to keep checking.
            </p>
          </div>
        </div>

        <div className="group border-border bg-card relative col-span-12 flex h-full flex-col justify-between overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-sm md:col-span-4 md:row-span-2 md:p-6">
          <div>
            <div className="mb-3 flex items-center">
              <div className="border-border/60 bg-background/40 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
                <GlobeIcon
                  className="h-4 w-4 text-indigo-500/80 dark:text-indigo-400/80"
                  strokeWidth={1.5}
                />
              </div>
              <h4 className="ml-3 text-lg font-medium tracking-tight">Global team support</h4>
            </div>

            <p className="text-muted-foreground text-sm md:text-base">
              Effortlessly manages timezones and multiple languages, so your distributed team stays
              aligned without awkward schedules or translations.
            </p>

            <div className="pointer-events-none mt-4 opacity-20 select-none">
              <div className="mx-auto flex flex-wrap gap-1.5">
                {[
                  "GMT-8",
                  "🇯🇵",
                  "CET",
                  "en-US",
                  "🇪🇺",
                  "PST",
                  "zh-CN",
                  "CEST",
                  "GMT+1",
                  "🇮🇳",
                  "fr-FR",
                  "GMT-5",
                  "🇧🇷",
                  "GMT+10",
                  "ja-JP",
                  "GMT+4",
                  "🇺🇸",
                  "ru-RU",
                  "GMT-10",
                  "🇨🇳",
                  "GMT-3",
                  "es-ES",
                  "GMT+7",
                  "🇬🇧",
                  "ar-SA",
                  "GMT+11",
                  "🇩🇪",
                  "de-DE",
                  "GMT-2",
                  "pt-BR",
                  "🇫🇷",
                  "IST",
                  "JST",
                  "🇪🇸",
                  "AEST",
                  "UTC",
                  "🇮🇹",
                  "GMT-7",
                  "🇸🇦",
                  "GMT+6",
                  "sv-SE",
                  "GMT-9",
                  "🇹🇷",
                  "pl-PL",
                  "🇻🇳",
                  "tr-TR",
                  "🇵🇱",
                  "vi-VN",
                  "th-TH",
                  "🇮🇩",
                  "id-ID",
                  "🇹🇭",
                  "uk-UA",
                  "🇿🇦",
                  "da-DK",
                  "fi-FI",
                  "🇲🇽",
                  "el-GR",
                  "🇦🇷",
                  "hu-HU",

                  "🇫🇮",
                  "🇬🇷",
                  "🇭🇺",
                  "🇷🇺",
                  "🇷🇴",
                  "🇸🇰",
                ].map((item, i) => (
                  <span
                    key={`${item}-${i}`}
                    className="bg-primary/10 rounded-lg px-1.5 py-0.5 text-[0.45rem] whitespace-nowrap"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="group border-border bg-card relative col-span-12 flex h-full flex-col justify-between rounded-xl border p-5 transition-all duration-300 hover:shadow-sm md:col-span-4 md:p-6">
          <div>
            <div className="mb-3 flex items-center">
              <div className="border-border/60 bg-background/40 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
                <SearchIcon
                  className="h-4 w-4 text-amber-500/80 dark:text-amber-400/80"
                  strokeWidth={1.5}
                />
              </div>
              <h4 className="ml-3 text-lg font-medium tracking-tight">
                Blocker & pattern detection
              </h4>
            </div>

            <p className="text-muted-foreground text-sm md:text-base">
              Spots patterns in your team's workflow to quickly highlight blockers and shifts in
              mood before they become real problems.
            </p>
          </div>
        </div>

        <div className="group border-border bg-card relative col-span-12 flex h-full flex-col overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-sm md:col-span-4 md:p-6">
          <div>
            <div className="mb-3 flex items-center">
              <div className="border-border/60 bg-background/40 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
                <SendIcon
                  className="h-4 w-4 text-rose-500/80 dark:text-rose-400/80"
                  strokeWidth={1.5}
                />
              </div>
              <h4 className="ml-3 text-lg font-medium tracking-tight">Flexible delivery</h4>
            </div>

            <p className="text-muted-foreground text-sm md:text-base">
              Posts updates right where your team already talks, Slack or otherwise, fitting into
              your workflow without friction.
            </p>
          </div>
        </div>

        {/* Row 3 */}
        <div className="group border-border bg-card relative col-span-12 flex h-full flex-col justify-between overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-sm md:col-span-8 md:p-6">
          <div>
            <div className="flex flex-col items-start gap-2">
              <div className="mb-3 flex flex-col gap-2">
                <div className="flex items-center">
                  <div className="border-border/60 bg-background/40 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
                    <SlackIcon
                      className="h-4 w-4 text-purple-500/80 dark:text-purple-400/80"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h4 className="ml-3 text-lg font-medium tracking-tight">
                    Slack bot reminders & insights
                  </h4>
                </div>

                <p className="text-muted-foreground flex-1 text-sm md:text-base">
                  Gently nudges you in Slack when it's time for updates and delivers clear insights,
                  keeping important tasks from slipping through the cracks.
                </p>
              </div>

              <div className="font-noto w-full flex-1">
                <div className="rounded-lg border bg-white p-3 dark:bg-slate-900">
                  <div className="flex items-start gap-2">
                    <div className="border-border flex size-9 flex-shrink-0 items-center justify-center overflow-hidden rounded border">
                      <AsyncStatusLogo className="h-3.5 w-auto" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">AsyncStatus</span>
                        <span className="mt-0.5 text-xs text-slate-500">11:30 AM</span>
                      </div>
                      <div className="mt-0.5 text-sm">
                        <p className="font-medium">Updates from the team</p>
                        <div className="border-l-primary mt-2 rounded border-l-4 bg-slate-50 p-3">
                          <p className="text-neutral-600 dark:text-slate-300">
                            <span className="font-semibold">Frontend:</span> Shipped new landing
                            page design, working on auth improvements. Mobile responsiveness at 90%.
                            Need design review for dark mode.
                          </p>
                          <p className="mt-2 text-slate-600 dark:text-slate-300">
                            <span className="font-semibold">Backend:</span> API optimizations
                            complete, deploying performance monitoring. Database queries 40% faster.
                            Starting work on the analytics pipeline.
                          </p>
                          <p className="mt-2 text-slate-600 dark:text-slate-300">
                            <span className="font-semibold">Design:</span> Finalized component
                            library v2. Working on accessibility improvements. Icons ready for
                            review.
                          </p>
                          <p className="mt-2 text-slate-600 dark:text-slate-300">
                            <span className="font-semibold">DevOps:</span> CI pipeline optimized,
                            build times reduced by 60%. Setting up staging environment for new
                            features.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="group border-border bg-card relative col-span-12 flex h-full flex-col justify-between rounded-xl border p-5 transition-all duration-300 hover:shadow-sm md:col-span-4 md:p-6">
          <div>
            <div className="mb-3 flex items-center">
              <div className="border-border/60 bg-background/40 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
                <UserIcon
                  className="h-4 w-4 text-orange-500/80 dark:text-orange-400/80"
                  strokeWidth={1.5}
                />
              </div>
              <h4 className="ml-3 text-lg font-medium tracking-tight">Manual mode</h4>
            </div>

            <p className="text-muted-foreground text-sm md:text-base">
              Prefer writing updates yourself? Our platform supports your natural workflow with a
              manual mode that keeps things simple, no GitHub or Slack required.
            </p>

            <div className="mt-4">
              <div className="border-border/60 bg-background/40 rounded-lg border p-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="border-border flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border">
                      <UserIcon className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium" suppressHydrationWarning>
                        Update for {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md border bg-neutral-100 p-2">
                    <p className="min-h-[2.5rem] text-xs">
                      <TypewriterText text="" />
                    </p>
                  </div>
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground mt-0.5 self-end rounded-md px-2.5 py-1.5 text-[0.65rem] font-medium">
                    Save update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4 */}
        <div className="group border-border bg-card relative col-span-12 flex h-full flex-col justify-between rounded-xl border p-5 transition-all duration-300 hover:shadow-sm md:col-span-6 md:p-6">
          <div>
            <div className="mb-3 flex items-center">
              <div className="border-border/60 bg-background/40 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
                <FolderIcon className="text-primary h-4 w-4" strokeWidth={1.5} />
              </div>
              <h4 className="ml-3 text-lg font-medium tracking-tight">Open source</h4>
            </div>

            <p className="text-muted-foreground text-sm md:text-base">
              Self-host or just see through the code.{" "}
              <Link
                target="_blank"
                href="https://github.com/asyncstatus/asyncstatus"
                className="text-primary inline-flex items-center text-sm font-medium hover:underline"
              >
                View on GitHub
                <span className="ml-1 transition-transform duration-150 group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </p>
          </div>
        </div>

        <div className="group border-border bg-card relative col-span-12 flex h-full flex-col justify-between rounded-xl border p-5 transition-all duration-300 hover:shadow-sm md:col-span-6 md:p-6">
          <div>
            <div className="mb-3 flex items-center">
              <div className="border-border/60 bg-background/40 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
                <LockIcon
                  className="h-4 w-4 text-gray-500/80 dark:text-gray-400/80"
                  strokeWidth={1.5}
                />
              </div>
              <h4 className="ml-3 text-lg font-medium tracking-tight">
                <ScrambledText text="Security" />
              </h4>
            </div>

            <p className="text-muted-foreground text-sm md:text-base">
              <ScrambledText text="All your data is encrypted at rest and in transit." />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
