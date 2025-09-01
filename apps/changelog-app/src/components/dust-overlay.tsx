import { cn } from "@asyncstatus/ui/lib/utils";

export function DustOverlay(props: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-30 mix-blend-overlay opacity-10",
        props.className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <title>Dust Overlay</title>
        <defs>
          <filter id="dust">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="9"
              numOctaves="1"
              seed="23"
              result="n"
            />
            <feColorMatrix in="n" type="saturate" values="0" result="bw" />
            <feComponentTransfer in="bw" result="specks">
              <feFuncR type="gamma" amplitude="1" exponent="6" offset="-0.2" />
              <feFuncG type="gamma" amplitude="1" exponent="6" offset="-0.2" />
              <feFuncB type="gamma" amplitude="1" exponent="6" offset="-0.2" />
              <feFuncA type="linear" slope="1" intercept="0" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width="100" height="100" filter="url(#dust)" />
      </svg>
    </div>
  );
}
