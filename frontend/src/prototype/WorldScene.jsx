/*
 * Draft, original layered world artwork for visual-direction review.
 * Not final brand artwork. The scene is decorative; the realm name is
 * announced by the surrounding heading, so the SVG is hidden from AT.
 */

function Tree({ x, y, scale = 1, warm = false }) {
  const canopy = warm
    ? "url(#scene-canopy-warm)"
    : "url(#scene-canopy)";

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M0 0 C-4 -20 -3 -38 0 -54"
        fill="none"
        stroke="url(#scene-trunk)"
        strokeLinecap="round"
        strokeWidth="10"
      />
      <ellipse cx="-22" cy="-64" rx="34" ry="30" fill={canopy} />
      <ellipse cx="20" cy="-60" rx="32" ry="28" fill={canopy} />
      <ellipse cx="0" cy="-86" rx="34" ry="30" fill={canopy} />
      <ellipse cx="-8" cy="-70" rx="26" ry="22" fill="#ffffff" opacity="0.08" />
    </g>
  );
}

function Flower({ x, y, color = "#e7c98f", scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0 L0 -14" stroke="#4d7054" strokeWidth="2" fill="none" />
      <circle cx="0" cy="-17" r="3" fill={color} />
      <circle cx="-4" cy="-14" r="2.6" fill={color} opacity="0.85" />
      <circle cx="4" cy="-14" r="2.6" fill={color} opacity="0.85" />
      <circle cx="0" cy="-11" r="2.4" fill={color} opacity="0.7" />
    </g>
  );
}

function WorldScene() {
  return (
    <svg
      className="world-scene"
      viewBox="0 0 1200 720"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8efdb" />
          <stop offset="52%" stopColor="#eef1dc" />
          <stop offset="100%" stopColor="#dfe9d2" />
        </linearGradient>

        <radialGradient id="scene-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffe7ac" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#ffe7ac" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffe7ac" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="scene-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c6d6c6" />
          <stop offset="100%" stopColor="#a8bca9" />
        </linearGradient>

        <linearGradient id="scene-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a9c4a2" />
          <stop offset="100%" stopColor="#86a886" />
        </linearGradient>

        <linearGradient id="scene-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#82ab7d" />
          <stop offset="100%" stopColor="#5c845f" />
        </linearGradient>

        <linearGradient id="scene-path" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#efe4ca" />
          <stop offset="100%" stopColor="#ddcdac" />
        </linearGradient>

        <linearGradient id="scene-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfe6e0" />
          <stop offset="100%" stopColor="#b3d5ce" />
        </linearGradient>

        <linearGradient id="scene-trunk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7d5d3f" />
          <stop offset="100%" stopColor="#5a412c" />
        </linearGradient>

        <linearGradient id="scene-canopy" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#8aab72" />
          <stop offset="100%" stopColor="#4f7657" />
        </linearGradient>

        <linearGradient id="scene-canopy-warm" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#b0bf78" />
          <stop offset="100%" stopColor="#7d9a58" />
        </linearGradient>
      </defs>

      <rect width="1200" height="720" fill="url(#scene-sky)" />

      <circle cx="884" cy="158" r="186" fill="url(#scene-sun)" />
      <circle cx="884" cy="158" r="44" fill="#ffe9b6" opacity="0.82" />

      <ellipse cx="332" cy="150" rx="148" ry="22" fill="#fff9ea" opacity="0.5" />
      <ellipse cx="404" cy="142" rx="96" ry="16" fill="#fff9ea" opacity="0.55" />
      <ellipse cx="720" cy="108" rx="120" ry="16" fill="#fff9ea" opacity="0.4" />

      <g
        fill="none"
        stroke="#5b7466"
        strokeLinecap="round"
        strokeWidth="3"
        opacity="0.45"
      >
        <path d="M1032 118 q10 -8 20 0 q10 -8 20 0" />
        <path d="M1084 142 q8 -6 16 0 q8 -6 16 0" />
        <path d="M968 92 q7 -5 14 0 q7 -5 14 0" />
      </g>

      <path
        d="M0 336 L96 268 L170 312 L262 224 L356 318 L452 258 L548 330 L646 246 L744 324 L842 262 L936 330 L1032 252 L1128 322 L1200 286 L1200 720 L0 720 Z"
        fill="url(#scene-far)"
      />
      <path
        d="M262 224 L308 276 L356 318 L302 300 Z"
        fill="#dbe6db"
        opacity="0.45"
      />
      <path
        d="M646 246 L700 300 L744 324 L690 306 Z"
        fill="#dbe6db"
        opacity="0.35"
      />

      <path
        d="M0 444 C140 398 250 424 388 408 C530 392 640 436 782 414 C930 392 1050 428 1200 402 L1200 720 L0 720 Z"
        fill="url(#scene-mid)"
      />
      <path
        d="M0 470 C150 430 280 452 430 438 C580 424 720 456 880 438 C1010 424 1110 448 1200 432"
        fill="none"
        stroke="#b9d0b1"
        strokeWidth="6"
        opacity="0.4"
      />

      <ellipse cx="958" cy="492" rx="150" ry="46" fill="url(#scene-water)" />
      <ellipse cx="936" cy="480" rx="86" ry="16" fill="#eaf5ef" opacity="0.55" />
      <g
        fill="none"
        stroke="#4f7657"
        strokeLinecap="round"
        strokeWidth="3"
        opacity="0.6"
      >
        <path d="M842 470 q4 -18 10 -26" />
        <path d="M852 474 q8 -16 18 -24" />
        <path d="M1062 486 q6 -16 16 -24" />
        <path d="M1074 490 q10 -14 20 -20" />
      </g>

      <path
        d="M0 556 C170 508 330 534 500 516 C690 496 860 536 1030 512 C1108 502 1160 512 1200 508 L1200 720 L0 720 Z"
        fill="url(#scene-near)"
      />

      <path
        d="M548 720 C576 662 636 632 622 584 C610 542 640 512 676 490 L708 496 C672 524 660 548 680 586 C716 656 742 686 772 720 Z"
        fill="url(#scene-path)"
      />
      <path
        d="M600 720 C624 674 664 646 650 600 C640 568 662 538 690 520"
        fill="none"
        stroke="#f7efdb"
        strokeWidth="6"
        opacity="0.5"
      />

      <Tree x={168} y={556} scale={1.15} />
      <Tree x={262} y={574} scale={0.82} warm />
      <Tree x={1044} y={566} scale={1.05} />
      <Tree x={962} y={588} scale={0.72} warm />

      <g transform="translate(248 508)">
        <rect
          x="-34"
          y="-30"
          width="68"
          height="48"
          rx="4"
          fill="#f3e7cf"
          stroke="#d8c6a6"
        />
        <path d="M-44 -30 L0 -66 L44 -30 Z" fill="#8a5c3f" />
        <rect x="-8" y="-4" width="16" height="22" rx="2" fill="#6d4c33" />
        <rect
          x="-26"
          y="-18"
          width="12"
          height="12"
          rx="1.5"
          fill="#ffe9b8"
          stroke="#c9a86a"
          strokeWidth="1.5"
        />
        <rect
          x="16"
          y="-18"
          width="12"
          height="12"
          rx="1.5"
          fill="#ffe9b8"
          stroke="#c9a86a"
          strokeWidth="1.5"
        />
        <rect x="16" y="-62" width="8" height="20" fill="#8a5c3f" />
      </g>

      <g stroke="#4f7657" strokeLinecap="round" strokeWidth="2" opacity="0.55">
        <path d="M92 668 q-6 -20 -2 -34" fill="none" />
        <path d="M102 670 q4 -18 14 -28" fill="none" />
        <path d="M390 634 q-6 -18 -2 -30" fill="none" />
        <path d="M400 636 q4 -16 12 -24" fill="none" />
        <path d="M902 648 q-6 -18 -2 -30" fill="none" />
        <path d="M912 650 q4 -16 12 -24" fill="none" />
        <path d="M1124 676 q-5 -16 -1 -28" fill="none" />
      </g>

      <Flower x={120} y={668} color="#e7c98f" />
      <Flower x={352} y={640} color="#f0d6a4" scale={0.85} />
      <Flower x={866} y={656} color="#d9c8e4" />
      <Flower x={1092} y={684} color="#e7c98f" scale={0.9} />
      <Flower x={1016} y={626} color="#f0d6a4" scale={0.8} />

      <g fill="#fff5cf">
        <circle
          className="world-scene__pollen"
          cx="470"
          cy="300"
          r="3"
          opacity="0.7"
        />
        <circle
          className="world-scene__pollen"
          cx="760"
          cy="250"
          r="2.5"
          opacity="0.6"
          style={{ animationDelay: "1.4s" }}
        />
        <circle
          className="world-scene__pollen"
          cx="1010"
          cy="330"
          r="3"
          opacity="0.55"
          style={{ animationDelay: "2.6s" }}
        />
        <circle
          className="world-scene__pollen"
          cx="610"
          cy="390"
          r="2"
          opacity="0.6"
          style={{ animationDelay: "3.4s" }}
        />
      </g>
    </svg>
  );
}

export default WorldScene;
