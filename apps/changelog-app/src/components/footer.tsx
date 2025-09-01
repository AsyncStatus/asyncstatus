import { NotSiLinkedin, SiGithub, SiX } from "@asyncstatus/ui/brand-icons";
import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { motion, useScroll, useTransform } from "motion/react";
import { BlueprintBackground4 } from "@/components/blueprint-background-4";
import { DustOverlay } from "@/components/dust-overlay";
import { NoiseBackground } from "@/components/noise-background";
import { PaperTextureOverlay } from "@/components/paper-texture-overlay";
import { VignetteOverlay } from "@/components/vignette-overlay";

export function Footer() {
  const { scrollYProgress } = useScroll();
  const footerOpacity = useTransform(scrollYProgress, [0, 0.655, 0.965], [0, 0.1, 1]);
  const footerScale = useTransform(scrollYProgress, [0, 0.655, 0.965], [0.85, 0.9, 1]);

  return (
    <div className="max-w-3xl mx-auto pb-12 mt-8">
      <motion.footer
        style={{ opacity: footerOpacity, scale: footerScale }}
        className="relative will-change-auto border border-border rounded-3xl shadow-2xl/25"
      >
        <BlueprintBackground4 />
        <DustOverlay className="opacity-10 absolute inset-0 rounded-xl overflow-hidden" />
        <PaperTextureOverlay className="absolute inset-0 opacity-[0.09] rounded-xl overflow-hidden" />
        <VignetteOverlay className="absolute inset-0 opacity-10 rounded-xl overflow-hidden" />
        <NoiseBackground className="absolute inset-0 opacity-90 rounded-xl overflow-hidden" />

        <div className="flex items-start justify-between p-4">
          <div className="flex flex-col">
            <p className="text-2xl font-medium text-white">Changelogs AI</p>
            <p className="text-white/70 text-base">Generate changelogs for your projects.</p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/asyncstatus/changelogs-ai"
              target="_blank"
              rel="noopener"
              className="text-white/70 hover:text-white/45 active:text-white/45 focus:text-white/45 transition-colors duration-75 flex items-center gap-1 whitespace-nowrap"
            >
              <SiGithub className="size-6" />
            </a>

            <a
              href="https://x.com/asyncstatus"
              target="_blank"
              rel="noopener"
              className="text-white/70 hover:text-white/45 active:text-white/45 focus:text-white/45 transition-colors duration-75 flex items-center gap-1 whitespace-nowrap"
            >
              <SiX className="size-6" />
            </a>

            <a
              href="https://www.linkedin.com/company/asyncstatus"
              target="_blank"
              rel="noopener"
              className="text-white/70 hover:text-white/45 active:text-white/45 focus:text-white/45 transition-colors duration-75 flex items-center gap-1 whitespace-nowrap"
            >
              <NotSiLinkedin className="size-6" />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center gap-1 mt-24 pb-2 px-2">
          <a
            href="https://asyncstatus.com"
            target="_blank"
            className="text-xs text-white/70 hover:text-white/45 active:text-white/45 focus:text-white/45 transition-colors duration-75 flex items-center gap-1 whitespace-nowrap"
            rel="noopener"
          >
            Powered by <AsyncStatusLogo className="size-3" /> AsyncStatus
          </a>
          <p className="text-xs text-white/70">
            Async status updates for remote startups. Built for high-agency teams that value their
            time.
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
