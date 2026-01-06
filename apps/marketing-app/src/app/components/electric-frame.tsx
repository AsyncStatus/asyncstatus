"use client";

import type { ReactNode } from "react";

interface ElectricFrameProps {
  children: ReactNode;
  className?: string;
  borderColor?: string;
}

export function ElectricFrame({
  children,
  className = "",
  borderColor = "#dd8448",
}: ElectricFrameProps) {
  return (
    <div className={`electric-frame-container ${className}`}>
      {/* SVG Filter Definition */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter
            id="turbulent-displace"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="turbulence"
              baseFrequency="0.02"
              numOctaves={10}
              result="noise1"
              seed={1}
            />
            <feOffset in="noise1" dx={0} dy={0} result="offsetNoise1">
              <animate
                attributeName="dy"
                values="700; 0"
                dur="6s"
                repeatCount="indefinite"
                calcMode="linear"
              />
            </feOffset>

            <feTurbulence
              type="turbulence"
              baseFrequency="0.02"
              numOctaves={10}
              result="noise2"
              seed={1}
            />
            <feOffset in="noise2" dx={0} dy={0} result="offsetNoise2">
              <animate
                attributeName="dy"
                values="0; -700"
                dur="6s"
                repeatCount="indefinite"
                calcMode="linear"
              />
            </feOffset>

            <feTurbulence
              type="turbulence"
              baseFrequency="0.02"
              numOctaves={10}
              result="noise3"
              seed={2}
            />
            <feOffset in="noise3" dx={0} dy={0} result="offsetNoise3">
              <animate
                attributeName="dx"
                values="490; 0"
                dur="6s"
                repeatCount="indefinite"
                calcMode="linear"
              />
            </feOffset>

            <feTurbulence
              type="turbulence"
              baseFrequency="0.02"
              numOctaves={10}
              result="noise4"
              seed={2}
            />
            <feOffset in="noise4" dx={0} dy={0} result="offsetNoise4">
              <animate
                attributeName="dx"
                values="0; -490"
                dur="6s"
                repeatCount="indefinite"
                calcMode="linear"
              />
            </feOffset>

            <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
            <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
            <feBlend
              in="part1"
              in2="part2"
              mode="color-dodge"
              result="combinedNoise"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="combinedNoise"
              scale={30}
              xChannelSelector="R"
              yChannelSelector="B"
            />
          </filter>
        </defs>
      </svg>

      {/* Card Container */}
      <div
        className="electric-card-container relative rounded-xl p-[2px]"
        style={
          {
            "--electric-border-color": borderColor,
            background: `linear-gradient(-30deg, ${borderColor}66, transparent, ${borderColor}66), linear-gradient(to bottom, hsl(0 0% 10%), hsl(0 0% 10%))`,
          } as React.CSSProperties
        }
      >
        {/* Inner Container with Electric Border */}
        <div className="electric-inner-container relative">
          {/* Outer border with offset effect */}
          <div
            className="electric-border-outer rounded-xl pr-1 pb-1"
            style={{
              border: `2px solid ${borderColor}80`,
            }}
          >
            {/* The animated electric border - this is the key element */}
            <div
              className="electric-main-card pointer-events-none absolute inset-0 -ml-1 -mt-1 rounded-xl"
              style={{
                border: `2px solid ${borderColor}`,
                filter: "url(#turbulent-displace)",
              }}
            />

            {/* Content wrapper */}
            <div className="electric-content relative -ml-1 -mt-1 overflow-hidden rounded-xl">
              {children}
            </div>
          </div>

          {/* Glow Layer 1 */}
          <div
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{
              border: `2px solid ${borderColor}99`,
              filter: "blur(1px)",
            }}
          />

          {/* Glow Layer 2 */}
          <div
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{
              border: `2px solid ${borderColor}`,
              filter: "blur(4px)",
            }}
          />
        </div>

        {/* Overlay 1 */}
        <div
          className="pointer-events-none absolute inset-0 scale-110 rounded-xl"
          style={{
            opacity: 1,
            mixBlendMode: "overlay",
            filter: "blur(16px)",
            background:
              "linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)",
          }}
        />

        {/* Overlay 2 */}
        <div
          className="pointer-events-none absolute inset-0 scale-110 rounded-xl"
          style={{
            opacity: 0.5,
            mixBlendMode: "overlay",
            filter: "blur(16px)",
            background:
              "linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)",
          }}
        />

        {/* Background Glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-xl"
          style={{
            filter: "blur(32px)",
            opacity: 0.3,
            background: `linear-gradient(-30deg, ${borderColor}, transparent, ${borderColor})`,
          }}
        />
      </div>
    </div>
  );
}
