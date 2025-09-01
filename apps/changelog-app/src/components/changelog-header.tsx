import { getCommitRange, getDateRange } from "@asyncstatus/changelog-api/filters";
import { SiGithub, SiMagic } from "@asyncstatus/ui/brand-icons";
import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { Button } from "@asyncstatus/ui/components/button";
import { Dialog } from "@asyncstatus/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent as DropdownMenuContentPrimitive,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@asyncstatus/ui/components/dropdown-menu";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { toast } from "@asyncstatus/ui/components/sonner";
import {
  ArrowRightIcon,
  Code,
  HelpCircle,
  Link as LinkIcon,
  MegaphoneOff,
  MoreHorizontal,
  Palette,
  Pencil,
} from "@asyncstatus/ui/icons";
import { createLink, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { BlueprintBackground2 } from "@/components/blueprint-background-2";
import { BlueprintBackground3 } from "@/components/blueprint-background-3";
import { DustOverlay } from "@/components/dust-overlay";
import { NoiseBackground } from "@/components/noise-background";
import { PaperTextureOverlay } from "@/components/paper-texture-overlay";
import { VignetteOverlay } from "@/components/vignette-overlay";
import { HelpDialogContent } from "./help-dialog-content";

const MotionLink = createLink(motion.a);

export function ChangelogHeader({
  owner,
  repo,
  filters,
  showBigHeader = false,
  slug,
}: {
  owner: string;
  repo?: string;
  filters?: string;
  showBigHeader?: boolean;
  slug?: string;
}) {
  const dateRange = useMemo(() => filters && getDateRange(filters), [filters]);
  const commitRange = useMemo(() => filters && getCommitRange(filters), [filters]);

  const { scrollY } = useScroll();
  const fixedHeaderTop = useTransform(scrollY, [-100, 50, 250], [-150, -150, 8]);
  const headerOpacity = useTransform(scrollY, [-100, 50, 200], [1, 1, 0]);
  const headerScale = useTransform(scrollY, [-100, 50, 300], [1, 1, 0.9]);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  usePageHotkeys({ owner, repo, slug, setDropdownOpen, setHelpDialogOpen });

  return (
    <>
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <HelpDialogContent />
      </Dialog>

      <motion.div
        className="fixed top-0 w-full max-w-3xl will-change-auto left-0 right-0 mx-auto z-50 rounded-3xl border border-border bg-white/70 backdrop-blur-sm shadow-2xl/10"
        style={{ top: fixedHeaderTop }}
      >
        <div className="flex items-center justify-between w-full h-full px-3.5 py-2">
          <div className="flex items-center gap-2">
            <Link to="/" className="relative p-2">
              <BlueprintBackground3 />
              <DustOverlay className="opacity-10 absolute inset-0 rounded-md overflow-hidden" />
              <PaperTextureOverlay className="absolute inset-0 opacity-[0.09] rounded-md overflow-hidden" />
              <VignetteOverlay className="absolute inset-0 opacity-10 rounded-md overflow-hidden" />
              <NoiseBackground className="absolute inset-0 opacity-20 rounded-md overflow-hidden" />

              <div className="absolute -top-0.5 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-700/30 to-transparent"></div>
              <div className="absolute -bottom-0.5 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-700/30 to-transparent"></div>
              <div className="absolute -left-0.5 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-blue-700/30 to-transparent"></div>
              <div className="absolute -right-0.5 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-blue-700/30 to-transparent"></div>
              <AsyncStatusLogo
                className="size-4"
                pathClassName="fill-black stroke-10 stroke-white"
              />
            </Link>

            <div className="text-sm font-medium">
              <Link
                to="/$owner"
                params={{ owner }}
                className="text-sm font-medium hover:text-black/50 active:text-black/50 focus:text-black/50 transition-colors duration-75"
              >
                {owner}
              </Link>
              {repo && (
                <>
                  /
                  <Link
                    to="/$owner/$repo"
                    params={{ owner, repo }}
                    className="text-sm font-medium hover:text-black/50 active:text-black/50 focus:text-black/50 transition-colors duration-75"
                  >
                    {repo}
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {filters && (
              <p className="text-xs max-sm:hidden">
                {dateRange &&
                  `${dateRange.start.format("MMM D, YYYY")} - ${dateRange.end.format("MMM D, YYYY")}`}
                {commitRange && `${commitRange.start}..${commitRange.end}`}
                {!dateRange && !commitRange && "Unknown"}
              </p>
            )}

            <DropdownMenu
              open={dropdownOpen}
              onOpenChange={(open) => {
                setDropdownOpen(open);
                const wasDismissed = localStorage.getItem("dropdown-dismissed") === "true";
                if (open && !wasDismissed) {
                  toast.info(`Pro tip: press "/" to open the menu.`, {
                    position: "top-center",
                    duration: 10_000,
                    dismissible: true,
                    action: {
                      label: "Dismiss",
                      onClick: () => {
                        localStorage.setItem("dropdown-dismissed", "true");
                      },
                    },
                    onDismiss: () => {
                      localStorage.setItem("dropdown-dismissed", "true");
                    },
                  });
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <MoreHorizontal className="size-4" />
                  {localStorage.getItem("generate-your-own-changelog-clicked") !== "true" &&
                    slug && (
                      <div className="absolute size-2 right-1 top-1.5 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600" />
                    )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                owner={owner}
                repo={repo}
                slug={slug}
                setHelpDialogOpen={setHelpDialogOpen}
              />
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {showBigHeader && (
        <motion.header
          style={{ opacity: headerOpacity, scale: headerScale }}
          className="relative text-center flex will-change-auto flex-col gap-0.5 items-center justify-center min-h-64 mx-auto max-w-3xl backdrop-blur-sm border border-blue-300/30 rounded-3xl bg-background/10 p-8 py-12 mb-12 mt-12 max-sm:m-1 max-sm:mb-12 shadow-2xl/25"
        >
          <div className="absolute left-4 top-4">
            <Link
              to="/"
              className="group flex items-center text-xs gap-1 text-white hover:text-white/70 active:text-white/70 focus:text-white/70 transition-colors duration-75"
            >
              Generate your own changelog{" "}
              <ArrowRightIcon className="size-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <button
            className="absolute right-0 top-0 p-4"
            onClick={() => {
              setHelpDialogOpen(true);
              if (window.scrollY < 250) {
                window.scrollTo({ top: 250, behavior: "smooth" });
              }
            }}
            type="button"
          >
            <HelpCircle className="size-4 text-white/70 hover:text-white/50 active:text-white/50 focus:text-white/50 transition-colors duration-75" />
          </button>

          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <a
              href="https://asyncstatus.com"
              target="_blank"
              className="text-white hover:text-white/70 active:text-white/70 focus:text-white/70 transition-colors duration-75 text-xs font-stefan flex items-center gap-1 whitespace-nowrap"
              rel="noopener"
            >
              Powered by <AsyncStatusLogo className="size-3" /> AsyncStatus
            </a>
          </div>

          <BlueprintBackground2 />
          <DustOverlay className="opacity-10 absolute inset-0 rounded-3xl overflow-hidden" />
          <PaperTextureOverlay className="absolute inset-0 opacity-[0.09] rounded-3xl overflow-hidden" />
          <VignetteOverlay className="absolute inset-0 opacity-10 rounded-3xl overflow-hidden" />
          <NoiseBackground className="absolute inset-0 opacity-90 rounded-3xl overflow-hidden" />

          <div className="absolute -top-0.5 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-700/30 to-transparent"></div>
          <div className="absolute -bottom-0.5 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-700/30 to-transparent"></div>
          <div className="absolute -left-0.5 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-blue-700/30 to-transparent"></div>
          <div className="absolute -right-0.5 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-blue-700/30 to-transparent"></div>

          <motion.h1
            layout="position"
            layoutId="changelog-header"
            className="text-3xl max-sm:text-2xl font-bold text-white text-shadow-xs"
          >
            <Link
              to="/$owner"
              params={{ owner }}
              className="text-white hover:text-white/70 active:text-white/70 focus:text-white/70 transition-colors duration-75"
            >
              {owner}
            </Link>
            {!repo && !slug && " repositories"}
            {repo && (
              <>
                /
                <MotionLink
                  layout="position"
                  layoutId={`${repo}-header`}
                  to="/$owner/$repo"
                  params={{ owner, repo }}
                  className="text-white max-sm:break-all hover:text-white/70 active:text-white/70 focus:text-white/70 transition-colors duration-75"
                >
                  {repo}
                </MotionLink>{" "}
                changelog{!slug ? "s" : ""}
              </>
            )}
          </motion.h1>

          {filters && (
            <motion.h2
              layout="position"
              layoutId={`changelog-${slug}-subheader`}
              className="text-lg text-white/70 max-sm:text-base max-sm:mt-1"
            >
              {dateRange &&
                `${dateRange.start.format("MMM D, YYYY")} - ${dateRange.end.format("MMM D, YYYY")}`}
              {commitRange && `${commitRange.start}..${commitRange.end}`}
              {!dateRange && !commitRange && "Unknown"}
            </motion.h2>
          )}
        </motion.header>
      )}
    </>
  );
}

export function ChangelogHeaderSkeleton({
  withoutSubheader = false,
}: {
  withoutSubheader?: boolean;
}) {
  return (
    <div className="relative text-center flex flex-col gap-0.5 items-center justify-center min-h-64 mx-auto w-full max-w-3xl backdrop-blur-sm border border-blue-300/30 rounded-3xl bg-background/10 p-8 py-12 mb-12 mt-12 shadow-2xl/25">
      <div className="absolute left-4 top-4">
        <Link
          to="/"
          className="group flex items-center text-xs gap-1 text-white hover:text-white/70 active:text-white/70 focus:text-white/70 transition-colors duration-75"
        >
          Generate your own changelog{" "}
          <ArrowRightIcon className="size-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <button className="absolute right-0 top-0 p-4" type="button">
        <HelpCircle className="size-4 text-white/70 hover:text-white/50 active:text-white/50 focus:text-white/50 transition-colors duration-75" />
      </button>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <a
          href="https://asyncstatus.com"
          target="_blank"
          className="text-white hover:text-white/70 active:text-white/70 focus:text-white/70 transition-colors duration-75 text-xs font-stefan flex items-center gap-1 whitespace-nowrap"
          rel="noopener"
        >
          Powered by <AsyncStatusLogo className="size-3" /> AsyncStatus
        </a>
      </div>

      <BlueprintBackground2 />
      <DustOverlay className="opacity-10 absolute inset-0 rounded-3xl overflow-hidden" />
      <PaperTextureOverlay className="absolute inset-0 opacity-[0.09] rounded-3xl overflow-hidden" />
      <VignetteOverlay className="absolute inset-0 opacity-10 rounded-3xl overflow-hidden" />
      <NoiseBackground className="absolute inset-0 opacity-90 rounded-3xl overflow-hidden" />

      <div className="absolute -top-0.5 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-700/30 to-transparent"></div>
      <div className="absolute -bottom-0.5 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-700/30 to-transparent"></div>
      <div className="absolute -left-0.5 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-blue-700/30 to-transparent"></div>
      <div className="absolute -right-0.5 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-blue-700/30 to-transparent"></div>

      <Skeleton className="w-1/2 h-7.5" />
      {!withoutSubheader && <Skeleton className="mt-1 w-1/3 h-5.5 bg-white/70" />}
    </div>
  );
}

function usePageHotkeys({
  owner,
  repo,
  slug,
  setDropdownOpen,
  setHelpDialogOpen,
}: {
  owner: string;
  repo?: string;
  slug?: string;
  setDropdownOpen: (open: boolean) => void;
  setHelpDialogOpen: (open: boolean) => void;
}) {
  useHotkeys(
    "slash",
    () => {
      localStorage.setItem("dropdown-dismissed", "true");
      if (window.scrollY < 250) {
        window.scrollTo({ top: 250, behavior: "smooth" });
      }
      setDropdownOpen(true);
    },
    { preventDefault: true },
  );

  useHotkeys(
    "shift+meta+h",
    () => {
      setHelpDialogOpen(true);
    },
    { preventDefault: true },
  );

  useHotkeys(
    "shift+meta+e",
    () => {
      localStorage.setItem("generate-your-own-changelog-clicked", "true");
      toast.info(<p className="text-black text-sm">Changelog editor coming soon</p>, {
        description: (
          <span className="text-black text-xs">
            Send us an email at{" "}
            <a href="mailto:kacper@asyncstatus.com" className="text-blue-500">
              kacper@asyncstatus.com
            </a>{" "}
            to prioritize this feature.
          </span>
        ),
        position: "top-center",
      });
    },
    { preventDefault: true },
  );

  useHotkeys(
    "shift+meta+g",
    () => {
      const a = document.createElement("a");
      a.href = `https://github.com/${owner}${repo ? `/${repo}` : ""}`;
      a.target = "_blank";
      a.click();
      a.remove();
    },
    { preventDefault: true },
  );

  useHotkeys(
    "shift+meta+c",
    () => {
      if (slug) {
        navigator.clipboard.writeText(`https://chlgs.ai/c/${slug}`).then(() => {
          toast.success("Changelog link copied to clipboard", {
            position: "top-center",
          });
        });
      } else {
        navigator.clipboard
          .writeText(`https://chlgs.ai/${owner}${repo ? `/${repo}` : ""}`)
          .then(() => {
            toast.success("Link copied to clipboard", {
              position: "top-center",
            });
          });
      }
    },
    { preventDefault: true },
  );
}

function DropdownMenuContent({
  owner,
  repo,
  slug,
  setHelpDialogOpen,
}: {
  owner: string;
  repo?: string;
  slug?: string;
  setHelpDialogOpen: (open: boolean) => void;
}) {
  return (
    <DropdownMenuContentPrimitive className="w-64" align="start">
      <DropdownMenuItem
        asChild
        className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white hover:via-blue-800/80 active:via-blue-800/80 focus:via-blue-800/80"
      >
        <Link
          to="/"
          onClick={() => localStorage.setItem("generate-your-own-changelog-clicked", "true")}
        >
          <AsyncStatusLogo className="size-3 text-white" />
          <span className="text-white">Generate your own changelog</span>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {slug && (
        <DropdownMenuItem
          onClick={() => {
            toast.info(<p className="text-black text-sm">Changelog editor coming soon</p>, {
              description: (
                <span className="text-black text-xs">
                  Send us an email at{" "}
                  <a href="mailto:hi@asyncstatus.com" className="text-blue-500">
                    hi@asyncstatus.com
                  </a>{" "}
                  to prioritize this feature.
                </span>
              ),
              position: "top-center",
            });
          }}
        >
          <Pencil className="size-4" />
          <span>Edit changelog</span>
          <DropdownMenuShortcut>⬆⌘E</DropdownMenuShortcut>
        </DropdownMenuItem>
      )}

      <DropdownMenuItem
        onClick={() => {
          toast.info(<p className="text-black text-sm">API access and CI/CD coming soon</p>, {
            description: (
              <span className="text-black text-xs">
                Send us an email at{" "}
                <a href="mailto:hi@asyncstatus.com" className="text-blue-500">
                  hi@asyncstatus.com
                </a>{" "}
                to prioritize this feature.
              </span>
            ),
            position: "top-center",
          });
        }}
      >
        <Code className="size-4" />
        API access and CI/CD
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() => {
          toast.info(<p className="text-black text-sm">Remove branding coming soon</p>, {
            description: (
              <span className="text-black text-xs">
                Send us an email at{" "}
                <a href="mailto:hi@asyncstatus.com" className="text-blue-500">
                  hi@asyncstatus.com
                </a>{" "}
                to prioritize this feature.
              </span>
            ),
            position: "top-center",
          });
        }}
      >
        <MegaphoneOff className="size-4" />
        Remove branding
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() => {
          toast.info(<p className="text-black text-sm">Theming coming soon</p>, {
            description: (
              <span className="text-black text-xs">
                Send us an email at{" "}
                <a href="mailto:hi@asyncstatus.com" className="text-blue-500">
                  hi@asyncstatus.com
                </a>{" "}
                to prioritize this feature.
              </span>
            ),
            position: "top-center",
          });
        }}
      >
        <Palette className="size-4" />
        Change theme
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={() => {
          navigator.clipboard.writeText(`https://chlgs.ai/c/${slug}`).then(() => {
            toast.success("Changelog link copied to clipboard", {
              position: "top-center",
            });
          });
        }}
      >
        <LinkIcon className="size-4" />
        Copy link
        <DropdownMenuShortcut>⬆⌘C</DropdownMenuShortcut>
      </DropdownMenuItem>

      <DropdownMenuItem asChild>
        <a
          href={`https://github.com/${owner}${repo ? `/${repo}` : ""}`}
          target="_blank"
          rel="noopener"
        >
          <SiGithub className="size-4" />
          {owner}
          {repo ? `/${repo}` : ""}
          <DropdownMenuShortcut>⬆⌘G</DropdownMenuShortcut>
        </a>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={() => setHelpDialogOpen(true)}>
        <HelpCircle className="size-4" />
        Help and about
        <DropdownMenuShortcut>⬆⌘H</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuContentPrimitive>
  );
}
