import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { ArrowRight } from "@asyncstatus/ui/icons";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { BlueprintBackground } from "@/components/blueprint-background";
import { DustOverlay } from "@/components/dust-overlay";
import { NoiseBackground } from "@/components/noise-background";
import { PaperTextureOverlay } from "@/components/paper-texture-overlay";
import { RepoCard } from "@/components/repo-card";
import { VignetteOverlay } from "@/components/vignette-overlay";

const LightRays = lazy(() => import("@/components/light-rays-2"));

export const Route = createFileRoute("/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  return (
    <div className="min-h-dvh relative">
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

      <div className="relative z-50 flex flex-col items-center justify-center min-h-screen p-8 max-sm:p-2 mt-56">
        <div className="relative max-w-3xl w-full">
          <div className="relative backdrop-blur-sm border border-white/30 rounded-3xl bg-background/10 p-8 py-12 max-sm:p-2 max-sm:py-12 shadow-2xl">
            <div className="absolute -top-6 -left-6 w-4 h-4 border-l-2 border-t-2 border-white/30"></div>
            <div className="absolute -top-6 -right-6 w-4 h-4 border-r-2 border-t-2 border-white/30"></div>
            <div className="absolute -bottom-6 -left-6 w-4 h-4 border-l-2 border-b-2 border-white/30"></div>
            <div className="absolute -bottom-6 -right-6 w-4 h-4 border-r-2 border-b-2 border-white/30"></div>

            <div className="absolute -top-1 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            <div className="absolute -bottom-1 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            <div className="absolute -left-1 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
            <div className="absolute -right-1 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>

            <div className="text-center text-white relative">
              <h1 className="text-5xl font-bold mb-2 mt-2 max-sm:mb-4 max-sm:text-3xl">
                Changelogs AI
              </h1>
              <h2 className="text-xl opacity-90 mb-10 max-sm:text-lg">
                Paste your repo. Get clean release notes. Done.
              </h2>

              <div className="mb-6 max-w-md mx-auto">
                <p className="sm:hidden text-white/60 text-xs mb-2 text-left">github.com/</p>
                <form
                  className="relative flex items-stretch bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg overflow-hidden"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const ownerAndRepo = formData.get("ownerAndRepo") as string;
                    const [owner, repo] = ownerAndRepo.split("/");
                    if (owner && repo) {
                      navigate({
                        to: "/$owner/$repo",
                        params: { owner, repo },
                      });
                      return;
                    }
                    if (owner && !repo) {
                      navigate({
                        to: "/$owner",
                        params: { owner },
                      });
                      return;
                    }
                    navigate({
                      to: "/$owner",
                      params: { owner: "asyncstatus" },
                    });
                  }}
                >
                  <div className="relative flex items-center w-full">
                    <p className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 select-none pointer-events-none max-sm:hidden">
                      github.com/
                    </p>
                    <input
                      name="ownerAndRepo"
                      placeholder="asyncstatus/asyncstatus"
                      className="flex-1 bg-transparent pl-[6.64rem] max-sm:pl-4 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-inset min-h-[48px]"
                      onPaste={(e) => {
                        const raw = e.clipboardData.getData("text");
                        let text = raw.trim();
                        if (text.startsWith("@")) text = text.slice(1).trim();
                        text = text.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
                        if (text.startsWith("github.com/")) {
                          text = text.slice("github.com/".length);
                        }
                        text = text.split(/[?#]/)[0] ?? "";
                        text = text.replace(/\.git$/i, "");
                        const parts = text.split("/").filter(Boolean);
                        if (parts.length >= 2) {
                          text = `${parts[0]}/${parts[1]}`;
                        }
                        if (text !== raw) {
                          e.preventDefault();
                          e.currentTarget.value = text;
                        }
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 bg-white/20 hover:bg-white/30 transition-colors border-l border-white/30 group flex items-center justify-center min-w-[48px]"
                  >
                    <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </form>
              </div>

              <div className="flex justify-center space-x-4 text-sm opacity-70 max-sm:hidden">
                <span className="max-sm:text-lg">• AI powered</span>
                <span className="max-sm:text-lg">• Zero setup</span>
                <span className="max-sm:text-lg">• Actually good</span>
              </div>

              <div className="opacity-70 text-lg px-4 text-pretty sm:hidden">
                AI powered • Zero setup • Actually good
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

        <div className="mt-24 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <RepoCard
            owner="asyncstatus"
            repo="asyncstatus"
            description="Async status updates for remote startups."
            stargazersCount={11}
            watchersCount={1}
            forksCount={0}
            openIssuesCount={0}
          />

          <RepoCard
            owner="over-sh"
            repo="bun"
            description="ncredibly fast JavaScript runtime, bundler, test runner, and package manager – all in one"
            stargazersCount={80156}
            watchersCount={575}
            forksCount={3296}
            openIssuesCount={5328}
          />

          <RepoCard
            owner="tinygrad"
            repo="teenygrad"
            description="If tinygrad wasn't small enough for you..."
            stargazersCount={736}
            watchersCount={11}
            forksCount={102}
            openIssuesCount={6}
          />

          <RepoCard
            owner="patroninc"
            repo="patron"
            description="An open source Patreon alternative with lower fees designed for creators who publish ongoing sequential content like books, podcasts, and comics."
            stargazersCount={59}
            watchersCount={2}
            forksCount={2}
            openIssuesCount={1}
          />
        </div>
      </div>
    </div>
  );
}
