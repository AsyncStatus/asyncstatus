import { cn } from "@asyncstatus/ui/lib/utils";

export function NoiseBackground(props: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-30 mix-blend-hard-light opacity-70",
        props.className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 700 700"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <title>Noise Background</title>
        <defs>
          <filter
            id="nnnoise-filter"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            filterUnits="objectBoundingBox"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="linearRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.24"
              numOctaves="4"
              seed="15"
              stitchTiles="stitch"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              result="turbulence"
            ></feTurbulence>
            <feSpecularLighting
              surfaceScale="22"
              specularConstant="1.1"
              specularExponent="20"
              lightingColor="#ffffff"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              in="turbulence"
              result="specularLighting"
            >
              <feDistantLight azimuth="3" elevation="72"></feDistantLight>
            </feSpecularLighting>
            <feColorMatrix
              type="saturate"
              values="0"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              in="specularLighting"
              result="colormatrix"
            ></feColorMatrix>
          </filter>
        </defs>
        <rect width="700" height="700" fill="#86868600"></rect>
        <rect width="700" height="700" fill="#ffffff" filter="url(#nnnoise-filter)"></rect>
      </svg>
    </div>
  );
}
