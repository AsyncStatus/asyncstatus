import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { ArrowRight } from "@asyncstatus/ui/icons";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { BlueprintBackground } from "@/components/blueprint-background";
import { DustOverlay } from "@/components/dust-overlay";
import { NoiseBackground } from "@/components/noise-background";
import { PaperTextureOverlay } from "@/components/paper-texture-overlay";
import { VignetteOverlay } from "@/components/vignette-overlay";

const LightRays = lazy(() => import("@/components/light-rays-2"));

export const Route = createFileRoute("/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen relative">
      <BlueprintBackground />
      <NoiseBackground />
      <PaperTextureOverlay />
      <DustOverlay />
      <VignetteOverlay />

      <div className="absolute inset-0 z-50">
        <Suspense fallback={null}>
          <LightRays
            raysOrigin="top-center"
            raysColor="#BFDBFE"
            raysSpeed={0.35}
            intensity={1.65}
            saturation={3.85}
            lightSpread={2.85}
            rayLength={15}
            followMouse={true}
            mouseInfluence={0.02}
            noiseAmount={0.06}
            distortion={0.02}
            canvasOpacity={0.32}
            anisotropy={0.7}
            attenuation={1.0}
            ditherAmount={0.002}
            minDpr={1}
            maxDpr={1.5}
            autoPerformance={true}
            targetFps={55}
            dprStep={0.1}
            className="custom-rays"
          />
        </Suspense>
      </div>

      <div className="relative z-50 flex items-center justify-center min-h-screen p-8">
        <div className="relative max-w-3xl w-full">
          <div className="relative backdrop-blur-sm border border-white/30 rounded-3xl bg-background/10 p-8 py-12 shadow-2xl">
            <div className="absolute -top-6 -left-6 w-4 h-4 border-l-2 border-t-2 border-white/30"></div>
            <div className="absolute -top-6 -right-6 w-4 h-4 border-r-2 border-t-2 border-white/30"></div>
            <div className="absolute -bottom-6 -left-6 w-4 h-4 border-l-2 border-b-2 border-white/30"></div>
            <div className="absolute -bottom-6 -right-6 w-4 h-4 border-r-2 border-b-2 border-white/30"></div>

            <div className="absolute -top-1 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            <div className="absolute -bottom-1 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            <div className="absolute -left-1 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
            <div className="absolute -right-1 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>

            <div className="text-center text-white relative">
              <h1 className="text-5xl font-bold mb-2 mt-2">Changelog Generator</h1>
              <p className="text-xl opacity-90 mb-10">
                Paste your repo. Get clean release notes. Done.
              </p>

              <div className="mb-6 max-w-md mx-auto">
                <div className="relative flex items-stretch bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg overflow-hidden">
                  <input
                    type="url"
                    placeholder="github.com/asyncstatus/asyncstatus"
                    className="flex-1 bg-transparent px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-inset min-h-[48px]"
                  />
                  <button
                    type="button"
                    className="px-4 bg-white/20 hover:bg-white/30 transition-colors border-l border-white/30 group flex items-center justify-center min-w-[48px]"
                  >
                    <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="flex justify-center space-x-4 text-sm opacity-70">
                <span>• AI powered</span>
                <span>• Zero setup</span>
                <span>• Actually good</span>
              </div>
            </div>
          </div>

          <div className="absolute -top-6 left-6 text-white/50 text-xs font-stefan">v0.1.0</div>
          <a
            href="https://asyncstatus.com"
            target="_blank"
            className="absolute -bottom-6 right-6 text-white/50 text-xs font-stefan hover:underline flex items-center gap-1 whitespace-nowrap"
            rel="noopener"
          >
            Powered by <AsyncStatusLogo className="size-3" /> AsyncStatus
          </a>
        </div>
      </div>
    </div>
  );
}
