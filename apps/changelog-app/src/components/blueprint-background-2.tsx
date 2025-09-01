export function BlueprintBackground2() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
      {/* Blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600" />

      {/* Blueprint grid pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-25"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 400"
        preserveAspectRatio="none"
      >
        <title>Blueprint Background</title>
        <defs>
          {/* Grid pattern */}
          <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="white"
              strokeWidth="0.25"
              opacity="0.6"
            />
          </pattern>

          {/* Fine grid pattern */}
          <pattern id="blueprint-fine-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="white"
              strokeWidth="0.15"
              opacity="0.4"
            />
          </pattern>
          <filter id="roughen" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02"
              numOctaves="1"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="1.2"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#blueprint-fine-grid)" />
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-transparent to-blue-400/10" />
    </div>
  );
}
