import { useId } from "react";

function MeadowTree({
    x,
    y,
    scale = 1,
    canopy,
    canopyLight,
    trunk,
    blossom,
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${scale})`}>
            <path
                d="M0 0 C-4 -28 -3 -54 1 -78"
                fill="none"
                stroke={trunk}
                strokeLinecap="round"
                strokeWidth="9"
            />
            <path
                d="M0 -38 C-18 -44 -32 -56 -42 -70"
                fill="none"
                stroke={trunk}
                strokeLinecap="round"
                strokeWidth="5"
            />
            <path
                d="M0 -48 C17 -52 29 -62 38 -74"
                fill="none"
                stroke={trunk}
                strokeLinecap="round"
                strokeWidth="5"
            />
            <ellipse cx="-28" cy="-82" rx="38" ry="24" fill={canopy} />
            <ellipse cx="18" cy="-88" rx="44" ry="28" fill={canopy} />
            <ellipse cx="-4" cy="-102" rx="35" ry="22" fill={canopyLight} />
            <ellipse cx="26" cy="-72" rx="27" ry="17" fill={canopy} opacity="0.7" />
            <circle cx="-28" cy="-94" r="3" fill={blossom} opacity="0.8" />
            <circle cx="15" cy="-104" r="2.5" fill={blossom} opacity="0.72" />
            <circle cx="40" cy="-82" r="2.2" fill={blossom} opacity="0.6" />
        </g>
    );
}

function Flower({ x, y, color, scale = 1 }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${scale})`}>
            <path d="M0 0 L0 -11" stroke="#708a62" strokeWidth="1.8" fill="none" />
            <circle cx="0" cy="-14" r="3" fill={color} />
            <circle cx="-3.6" cy="-11.5" r="2.3" fill={color} opacity="0.85" />
            <circle cx="3.6" cy="-11.5" r="2.3" fill={color} opacity="0.85" />
            <circle cx="0" cy="-8.8" r="2.1" fill={color} opacity="0.72" />
        </g>
    );
}

function MeadowScene({ growth = 0.35, className = "" }) {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const id = (name) => `${uid}-${name}`;
    const extraFlowers = Math.round(growth * 6);

    return (
        <svg
            className={`world-scene meadow-scene ${className}`.trim()}
            viewBox="0 0 1200 760"
            preserveAspectRatio="xMidYMax slice"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c8dbd7" />
                    <stop offset="34%" stopColor="#dfe6d6" />
                    <stop offset="64%" stopColor="#f2e7d2" />
                    <stop offset="100%" stopColor="#f8efdf" />
                </linearGradient>

                <radialGradient id={id("dawn")} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#fff4cd" stopOpacity="0.95" />
                    <stop offset="40%" stopColor="#f8dfaa" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f8dfaa" stopOpacity="0" />
                </radialGradient>

                <linearGradient id={id("far-hill")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cbdbc0" />
                    <stop offset="100%" stopColor="#b6cba9" />
                </linearGradient>

                <linearGradient id={id("mid-hill")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b5cb9f" />
                    <stop offset="100%" stopColor="#9dbb8c" />
                </linearGradient>

                <linearGradient id={id("near-hill")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9cb781" />
                    <stop offset="100%" stopColor="#7e9d71" />
                </linearGradient>

                <linearGradient id={id("foreground")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8ba878" />
                    <stop offset="100%" stopColor="#6f8d67" />
                </linearGradient>

                <linearGradient id={id("path")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f6ead1" />
                    <stop offset="100%" stopColor="#e2cfab" />
                </linearGradient>

                <linearGradient id={id("water")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dcece3" />
                    <stop offset="100%" stopColor="#a9cbbf" />
                </linearGradient>

                <linearGradient id={id("trunk")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#886e54" />
                    <stop offset="100%" stopColor="#634f3c" />
                </linearGradient>

                <linearGradient id={id("canopy")} x1="0" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stopColor="#8fa979" />
                    <stop offset="100%" stopColor="#5f7d59" />
                </linearGradient>

                <linearGradient id={id("canopy-light")} x1="0" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stopColor="#c0cd91" />
                    <stop offset="100%" stopColor="#94ad72" />
                </linearGradient>

                <radialGradient id={id("window-glow")} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#ffe8b4" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#ffe8b4" stopOpacity="0" />
                </radialGradient>

                <filter id={id("soft")} x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="10" />
                </filter>
            </defs>

            <rect width="1200" height="760" fill={`url(#${id("sky")})`} />

            <circle cx="858" cy="214" r="214" fill={`url(#${id("dawn")})`} />
            <circle cx="858" cy="214" r="48" fill="#ffe8b1" opacity="0.78" />

            <g fill="none" stroke="#71877c" strokeLinecap="round" strokeWidth="2.3" opacity="0.32">
                <path d="M214 166 q10 -7 20 0 q10 -7 20 0" />
                <path d="M270 144 q8 -6 16 0 q8 -6 16 0" />
                <path d="M940 152 q9 -7 18 0 q9 -7 18 0" />
            </g>

            <g fill="#fff8e5" opacity="0.58">
                <circle cx="180" cy="104" r="2.2" />
                <circle cx="352" cy="72" r="1.7" />
                <circle cx="1066" cy="92" r="2" />
                <circle cx="1124" cy="150" r="1.5" />
            </g>

            <path
                d="M0 418 C122 374 228 396 338 384 C468 370 578 406 706 390 C840 372 958 404 1084 384 C1134 376 1172 382 1200 378 L1200 760 L0 760 Z"
                fill={`url(#${id("far-hill")})`}
            />

            <g opacity="0.5" filter={`url(#${id("soft")})`}>
                <ellipse cx="296" cy="442" rx="170" ry="22" fill="#f7f3e5" />
                <ellipse cx="906" cy="430" rx="210" ry="18" fill="#f7f3e5" />
            </g>

            <path
                d="M0 482 C144 432 286 458 420 444 C572 428 690 468 828 450 C966 432 1078 464 1200 444 L1200 760 L0 760 Z"
                fill={`url(#${id("mid-hill")})`}
            />

            <path
                d="M-20 560 C124 510 254 542 394 520 C536 498 660 542 806 520 C950 498 1060 526 1220 498 L1220 760 L-20 760 Z"
                fill={`url(#${id("near-hill")})`}
            />

            <ellipse cx="208" cy="568" rx="132" ry="24" fill={`url(#${id("water")})`} />
            <ellipse cx="190" cy="558" rx="64" ry="7" fill="#f1f8f1" opacity="0.55" />
            <path
                d="M106 560 C142 548 174 550 204 560 C232 570 260 568 286 558"
                fill="none"
                stroke="#84aa9c"
                strokeLinecap="round"
                strokeWidth="3"
                opacity="0.52"
            />

            <path
                d="M694 760 C724 704 752 664 742 612 C732 564 770 536 816 506 L854 516 C808 546 788 576 812 620 C844 680 874 720 900 760 Z"
                fill={`url(#${id("path")})`}
            />
            <path
                d="M760 760 C782 710 810 674 800 626 C792 590 820 560 854 538"
                fill="none"
                stroke="#fbf2dc"
                strokeWidth="5"
                opacity="0.52"
            />

            <path
                d="M0 634 C140 588 300 616 462 598 C634 578 782 618 950 596 C1050 584 1130 596 1200 586 L1200 760 L0 760 Z"
                fill={`url(#${id("foreground")})`}
            />

            <MeadowTree
                x={118}
                y={560}
                scale={1.1}
                canopy={`url(#${id("canopy")})`}
                canopyLight={`url(#${id("canopy-light")})`}
                trunk={`url(#${id("trunk")})`}
                blossom="#f4d8c6"
            />
            <MeadowTree
                x={254}
                y={602}
                scale={0.7}
                canopy={`url(#${id("canopy")})`}
                canopyLight={`url(#${id("canopy-light")})`}
                trunk={`url(#${id("trunk")})`}
                blossom="#f0e0b8"
            />
            <MeadowTree
                x={1060}
                y={570}
                scale={1.22}
                canopy={`url(#${id("canopy")})`}
                canopyLight={`url(#${id("canopy-light")})`}
                trunk={`url(#${id("trunk")})`}
                blossom="#f3d8d1"
            />
            <MeadowTree
                x={962}
                y={608}
                scale={0.76}
                canopy={`url(#${id("canopy")})`}
                canopyLight={`url(#${id("canopy-light")})`}
                trunk={`url(#${id("trunk")})`}
                blossom="#f0e0b8"
            />

            <g transform="translate(386 506)">
                <ellipse cx="0" cy="52" rx="80" ry="16" fill="#506547" opacity="0.15" filter={`url(#${id("soft")})`} />
                <rect x="-42" y="-20" width="84" height="50" rx="7" fill="#f2e5cc" stroke="#d9c6a5" />
                <path d="M-58 -20 L0 -64 L58 -20 Z" fill="#987052" />
                <path d="M-46 -20 L0 -53 L46 -20 Z" fill="#b38a65" opacity="0.75" />
                <rect x="-12" y="4" width="24" height="26" rx="3" fill="#765640" />
                <rect x="-32" y="-8" width="14" height="14" rx="3" fill="#ffe7b2" stroke="#c9a86a" strokeWidth="1.3" />
                <rect x="18" y="-8" width="14" height="14" rx="3" fill="#ffe7b2" stroke="#c9a86a" strokeWidth="1.3" />
                <circle cx="0" cy="-38" r="34" fill={`url(#${id("window-glow")})`} />
                <path d="M0 -64 L0 -78" stroke="#765640" strokeWidth="3" strokeLinecap="round" />
                <circle cx="0" cy="-82" r="3.5" fill="#f6cf83" />
            </g>

            <g fill="none" stroke="#6b8960" strokeLinecap="round" strokeWidth="2" opacity="0.55">
                <path d="M66 706 q-6 -20 -1 -34" />
                <path d="M78 708 q5 -18 14 -27" />
                <path d="M528 680 q-6 -19 -1 -32" />
                <path d="M540 682 q5 -17 13 -25" />
                <path d="M908 698 q-6 -20 -1 -34" />
                <path d="M920 700 q5 -18 14 -27" />
                <path d="M1140 716 q-6 -18 -1 -30" />
                <path d="M1152 718 q5 -16 12 -24" />
            </g>

            <Flower x={98} y={720} color="#f0d3bd" />
            <Flower x={482} y={690} color="#f4e2b1" scale={0.9} />
            <Flower x={870} y={712} color="#e6d4e6" />
            <Flower x={1114} y={728} color="#f0d3bd" scale={0.92} />
            <Flower x={1008} y={676} color="#f4e2b1" scale={0.8} />
            <Flower x={318} y={714} color="#e6d4e6" scale={0.76} />

            {Array.from({ length: extraFlowers }).map((_, index) => (
                <Flower
                    key={`meadow-growth-${index}`}
                    x={566 + index * 41}
                    y={728 - (index % 3) * 11}
                    color={index % 2 === 0 ? "#f4e2b1" : "#ead6dd"}
                    scale={0.72 + (index % 3) * 0.1}
                />
            ))}

            <g fill="#fff1c9" opacity="0.7">
                <circle cx="488" cy="348" r="2.8" />
                <circle cx="786" cy="300" r="2.3" opacity="0.58" />
                <circle cx="1022" cy="372" r="2.6" opacity="0.55" />
                <circle cx="592" cy="446" r="1.8" opacity="0.6" />
                <circle cx="344" cy="478" r="2.1" opacity="0.5" />
            </g>
        </svg>
    );
}

export default MeadowScene;
