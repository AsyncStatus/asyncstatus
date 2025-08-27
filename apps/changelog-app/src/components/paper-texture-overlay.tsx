export function PaperTextureOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 mix-blend-soft-light"
      style={{ opacity: 0.06 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <title>Paper Texture Overlay</title>
        <defs>
          <filter id="paper-texture">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="1"
              seed="2"
              result="macro"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.6"
              numOctaves="1"
              seed="9"
              result="micro"
            />
            <feBlend in="macro" in2="micro" mode="multiply" result="grain" />
            <feColorMatrix in="grain" type="saturate" values="0" result="bw" />
            <feDiffuseLighting in="bw" lightingColor="#ffffff" surfaceScale="1.2" result="lit">
              <feDistantLight azimuth="135" elevation="45" />
            </feDiffuseLighting>
            <feComposite in="lit" in2="bw" operator="arithmetic" k2="1" k3="0.35" result="paper" />
          </filter>
        </defs>
        <rect width="100" height="100" filter="url(#paper-texture)" />
      </svg>
    </div>
  );
}
