export function BlueprintBackground4() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
      {/* Blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/60" />

      {/* Blueprint grid pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-25"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1400 600"
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

        <g
          filter="url(#roughen)"
          stroke="white"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        >
          <path d="M 390 350 H 610 A 40 40 0 0 1 650 390 V 610 A 40 40 0 0 1 610 650 H 390 A 40 40 0 0 1 350 610 V 390 A 40 40 0 0 1 390 350 Z" />
          <path d="M 500 390 a 110 110 0 1 1 0 220 a 110 110 0 1 1 0 -220" opacity="0.9" />
          <path d="M 501 392 a 108 108 0 1 1 0 216 a 108 108 0 1 1 0 -216" opacity="0.6" />
          <path d="M 500 430 a 70 70 0 1 1 0 140 a 70 70 0 1 1 0 -140" opacity="0.8" />
          <path d="M 500 465 a 35 35 0 1 1 0 70 a 35 35 0 1 1 0 -70" opacity="0.7" />
          <path d="M 350 500 L 650 500" opacity="0.8" />
          <path d="M 500 350 L 500 650" opacity="0.8" />
          <path d="M 380 380 L 620 620" opacity="0.5" strokeDasharray="3,3" />
          <path d="M 620 380 L 380 620" opacity="0.5" strokeDasharray="3,3" />
          <path d="M 365 365 L 375 375 M 375 365 L 365 375" opacity="0.7" />
          <path d="M 625 365 L 635 375 M 635 365 L 625 375" opacity="0.7" />
          <path d="M 365 625 L 375 635 M 375 625 L 365 635" opacity="0.7" />
          <path d="M 625 625 L 635 635 M 635 625 L 625 635" opacity="0.7" />
        </g>

        {/* Top-left card (hand-drawn) */}
        <g
          filter="url(#roughen)"
          stroke="white"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        >
          <path d="M 80 90 H 300 A 12 12 0 0 1 312 102 V 210 A 12 12 0 0 1 300 222 H 80 A 12 12 0 0 1 68 210 V 102 A 12 12 0 0 1 80 90 Z" />
          <path d="M 110 130 H 290" />
          <path d="M 110 150 H 260" />
          <path d="M 110 170 H 280" />
          <path d="M 110 190 H 230" />
          <path d="M 95 130 L 99 134 M 99 130 L 95 134" />
          <path d="M 95 150 L 99 154 M 99 150 L 95 154" />
          <path d="M 95 170 L 99 174 M 99 170 L 95 174" />
          <path d="M 95 190 L 99 194 M 99 190 L 95 194" />
          <text
            x={115}
            y={120}
            fill="white"
            fontSize={14}
            opacity={0.85}
            fontFamily="ABCStefan"
            transform="rotate(-2.1 115 120)"
          >
            CHANGELOG SCHEMA v2.1
          </text>
          <text
            x={115}
            y={148}
            fill="white"
            fontSize={11}
            opacity={0.65}
            fontFamily="ABCStefan"
            transform="rotate(1.6 115 148)"
          >
            feat: new features
          </text>
          <text
            x={115}
            y={168}
            fill="white"
            fontSize={11}
            opacity={0.65}
            fontFamily="ABCStefan"
            transform="rotate(-1.2 115 168)"
          >
            fix: bug fixes
          </text>
          <text
            x={115}
            y={188}
            fill="white"
            fontSize={11}
            opacity={0.65}
            fontFamily="ABCStefan"
            transform="rotate(0.8 115 188)"
          >
            docs: documentation
          </text>
        </g>

        {/* Top-center radial (hand-drawn) */}
        <g filter="url(#roughen)" stroke="white" strokeWidth="1" fill="none" opacity="0.75">
          <path d="M 500 70 a 50 50 0 1 1 0 100 a 50 50 0 1 1 0 -100" />
          <path d="M 500 80 a 40 40 0 1 1 0 80 a 40 40 0 1 1 0 -80" opacity="0.6" />
          <path d="M 460 120 H 540" />
          <path d="M 500 80 V 160" />
          <text
            x={440}
            y={185}
            fill="white"
            fontSize={12}
            opacity={0.7}
            fontFamily="ABCStefan"
            transform="rotate(-1.4 440 185)"
          >
            GIT REPOSITORY FLOW
          </text>
        </g>

        {/* Middle-left list (hand-drawn) */}
        <g filter="url(#roughen)" stroke="white" strokeWidth="1" fill="none" opacity="0.8">
          <path d="M 80 430 H 280 A 8 8 0 0 1 288 438 V 530 A 8 8 0 0 1 280 538 H 80 A 8 8 0 0 1 72 530 V 438 A 8 8 0 0 1 80 430 Z" />
          <path d="M 100 460 H 270" />
          <path d="M 100 485 H 250" />
          <path d="M 100 510 H 260" />
          <path d="M 90 460 L 94 464 M 94 460 L 90 464" />
          <path d="M 90 485 L 94 489 M 94 485 L 90 489" />
          <path d="M 90 510 L 94 514 M 94 510 L 90 514" />
          <text
            x={110}
            y={450}
            fill="white"
            fontSize={11}
            opacity={0.7}
            fontFamily="ABCStefan"
            transform="rotate(1.2 110 450)"
          >
            COMMIT HISTORY
          </text>
          <text
            x={110}
            y={480}
            fill="white"
            fontSize={10}
            opacity={0.6}
            fontFamily="ABCStefan"
            transform="rotate(-0.9 110 480)"
          >
            abc123f: feat(ui)
          </text>
          <text
            x={110}
            y={505}
            fill="white"
            fontSize={10}
            opacity={0.6}
            fontFamily="ABCStefan"
            transform="rotate(1.1 110 505)"
          >
            def456a: fix(api)
          </text>
        </g>

        {/* Middle-right radial (hand-drawn) */}
        <g filter="url(#roughen)" stroke="white" strokeWidth="1" fill="none" opacity="0.7">
          <path d="M 870 440 a 60 60 0 1 1 0 120 a 60 60 0 1 1 0 -120" />
          <path d="M 870 455 a 45 45 0 1 1 0 90 a 45 45 0 1 1 0 -90" opacity="0.6" />
          <path d="M 870 475 a 25 25 0 1 1 0 50 a 25 25 0 1 1 0 -50" opacity="0.6" />
          <path d="M 870 430 V 450 M 870 550 V 570 M 810 500 H 830 M 910 500 H 930" opacity="0.7" />
          <text
            x={825}
            y={585}
            fill="white"
            fontSize={11}
            opacity={0.7}
            fontFamily="ABCStefan"
            transform="rotate(-0.8 825 585)"
          >
            VERSION CONTROL
          </text>
        </g>

        {/* Bottom-left pipeline (hand-drawn) */}
        <g filter="url(#roughen)" stroke="white" strokeWidth="1" fill="none" opacity="0.75">
          <path d="M 100 780 H 340 A 10 10 0 0 1 350 790 V 880 A 10 10 0 0 1 340 890 H 100 A 10 10 0 0 1 90 880 V 790 A 10 10 0 0 1 100 780 Z" />
          <path d="M 130 810 H 300" strokeDasharray="6,4" />
          <path d="M 130 835 H 320" strokeDasharray="6,4" />
          <path d="M 130 860 H 330" strokeDasharray="6,4" />
          <path d="M 115 805 L 122 812 M 122 805 L 115 812" />
          <path d="M 115 830 L 122 837 M 122 830 L 115 837" />
          <path d="M 115 855 L 122 862 M 122 855 L 115 862" />
          <text
            x={110}
            y={800}
            fill="white"
            fontSize={12}
            opacity={0.8}
            fontFamily="ABCStefan"
            transform="rotate(1.5 110 800)"
          >
            RELEASE PIPELINE
          </text>
          <text
            x={145}
            y={825}
            fill="white"
            fontSize={10}
            opacity={0.6}
            fontFamily="ABCStefan"
            transform="rotate(-1.2 145 825)"
          >
            v1.0.0 → v1.1.0 → v2.0.0
          </text>
        </g>

        {/* Bottom-right angled config (hand-drawn) */}
        <g filter="url(#roughen)" stroke="white" strokeWidth="1" fill="none" opacity="0.7">
          <path d="M 740 770 L 890 770 L 960 850 L 910 890 L 740 890 Z" />
          <path d="M 765 800 H 935" />
          <path d="M 765 825 H 920" />
          <path d="M 765 850 H 900" />
          <path d="M 755 800 L 759 804 M 759 800 L 755 804" />
          <path d="M 755 825 L 759 829 M 759 825 L 755 829" />
          <path d="M 755 850 L 759 854 M 759 850 L 755 854" />
          <text
            x={745}
            y={885}
            fill="white"
            fontSize={11}
            opacity={0.7}
            fontFamily="ABCStefan"
            transform="rotate(-1.0 745 885)"
          >
            DEPLOYMENT CONFIG
          </text>
        </g>

        {/* Remove scattered geometric placeholders; replaced with distributed annotations below */}

        {/* Distributed decorative annotations */}
        <g fill="white" fontSize="13" fontFamily="ABCStefan" opacity="0.6">
          <text x={120} y={260} transform="rotate(-0.8 120 260)">
            feat: new features
          </text>
          <text x={860} y={320} transform="rotate(3.1 860 320)">
            fix: critical bugs
          </text>
          <text x={90} y={560} transform="rotate(-1.0 90 560)">
            docs: updated guides
          </text>
          <text x={780} y={660} transform="rotate(8.9 780 660)">
            refactor: optimization
          </text>
          <text x={430} y={90} transform="rotate(1.3 430 90)">
            v2.1.0 → v2.2.0
          </text>
          <text x={160} y={940} transform="rotate(-0.7 160 940)">
            breaking: API changes
          </text>
          <text x={700} y={940} transform="rotate(0.6 700 940)">
            perf: 40% faster
          </text>
          <text x={900} y={560} transform="rotate(-1.1 900 560)">
            test: coverage 95%
          </text>
          <text x={470} y={930} transform="rotate(0.8 470 930)">
            chore: dependencies
          </text>
          <text x={260} y={360} transform="rotate(-0.9 260 360)">
            style: formatting
          </text>
        </g>

        <g fill="white" fontSize="12" fontFamily="ABCStefan" opacity="0.65">
          <text x="3%" y="95%" transform="rotate(-0.6 30 950)">
            BLUEPRINT-CL-001
          </text>
          <text x="75%" y="95%" transform="rotate(5 750 950)">
            REV: 2.1.0-beta
          </text>
          <text x="3%" y="8%" transform="rotate(0.5 30 80)">
            CHANGELOG GENERATOR SYSTEM
          </text>
          <text x="60%" y="8%" transform="rotate(-0.4 600 80)">
            SCALE: 1:1 | GRID: 10px
          </text>
          <text x="45%" y="95%" transform="rotate(0.6 450 950)">
            STATUS: ACTIVE
          </text>
          <text x="3%" y="50%" transform="rotate(-0.5 30 500)">
            NODE: PRIMARY
          </text>
          <text x="85%" y="15%" transform="rotate(0.6 850 150)">
            BRANCH: MAIN
          </text>
          <text x="15%" y="75%" transform="rotate(-4.6 150 750)">
            BUILD: SUCCESS
          </text>
        </g>

        <g className="opacity-20" stroke="white" strokeWidth="0.6" strokeDasharray="2,4">
          <line x1="20%" y1="20%" x2="45%" y2="45%" />
          <line x1="80%" y1="20%" x2="55%" y2="45%" />
          <line x1="20%" y1="80%" x2="45%" y2="55%" />
          <line x1="80%" y1="80%" x2="55%" y2="55%" />
          <line x1="10%" y1="40%" x2="40%" y2="30%" />
          <line x1="90%" y1="60%" x2="60%" y2="70%" />
          <line x1="30%" y1="10%" x2="50%" y2="25%" />
          <line x1="70%" y1="90%" x2="50%" y2="75%" />
          <line x1="5%" y1="70%" x2="25%" y2="50%" />
          <line x1="95%" y1="30%" x2="75%" y2="50%" />
        </g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
    </div>
  );
}
