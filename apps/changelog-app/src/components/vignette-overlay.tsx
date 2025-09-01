import { cn } from "@asyncstatus/ui/lib/utils";

export function VignetteOverlay(props: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-20 mix-blend-multiply opacity-30",
        props.className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <title>Vignette Overlay</title>
        <defs>
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.6" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#vignette)" />
      </svg>
    </div>
  );
}
