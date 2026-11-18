import { useId } from "react";

function GhafTree({ x, y, scale = 1, light = false, canopy, trunk, glow }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${scale})`}>
            <path
                d="M0 0 C-7 -22 -8 -48 -2 -76"
                fill="none"
                stroke={trunk}
                strokeLinecap="round"
                strokeWidth="12"
            />
            <path
                d="M-2 -42 C-24 -48 -42 -62 -54 -80"
                fill="none"
                stroke={trunk}
                strokeLinecap="round"
                strokeWidth="7"
            />
            <path
                d="M-1 -54 C20 -58 39 -70 52 -86"
                fill="none"
                stroke={trunk}
                strokeLinecap="round"
                strokeWidth="7"
            />
            <ellipse cx="-36" cy="-88" rx="52" ry="24" fill={canopy} />
            <ellipse cx="10" cy="-92" rx="58" ry="27" fill={canopy} />
            <ellipse cx="52" cy="-84" rx="44" ry="21" fill={canopy} />
            <ellipse cx="2" cy="-103" rx="48" ry="22" fill={light ? glow : canopy} opacity={light ? 0.9 : 0.6} />
            <ellipse cx="-4" cy="-91" rx="36" ry="13" fill="#fff4d5" opacity="0.13" />
        </g>
    );
}

function Flower({ x, y, color, scale = 1 }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${scale})`}>
            <path d="M0 0 L0 -13" stroke="#6f8a61" strokeWidth="2" fill="none" />
            <circle cx="0" cy="-16" r="3.4" fill={color} />
            <circle cx="-4.2" cy="-13" r="2.6" fill={color} opacity="0.86" />
            <circle cx="4.2" cy="-13" r="2.6" fill={color} opacity="0.86" />
            <circle cx="0" cy="-10" r="2.4" fill={color} opacity="0.72" />
        </g>
    );
}

function WorldScene({ growth = 0.35, className = "" }) {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const id = (name) => `${uid}-${name}`;
    const extraFlowers = Math.round(growth * 5);

    return (
        <svg
            className={`world-scene ${className}`.trim()}
            viewBox="0 0 1200 760"
            preserveAspectRatio="xMidYMax slice"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#777493" />
                    <stop offset="34%" stopColor="#c99b8d" />
                    <stop offset="66%" stopColor="#efc59c" />
                    <stop offset="100%" stopColor="#f8ecd2" />
                </linearGradient>

                <radialGradient id={id("sun-glow")} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#ffe6a8" stopOpacity="0.95" />
                    <stop offset="45%" stopColor="#ffd18a" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#ffd18a" stopOpacity="0" />
                </radialGradient>

                <linearGradient id={id("far-dune")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d8bb94" />
                    <stop offset="100%" stopColor="#c4a37e" />
                </linearGradient>

                <linearGradient id={id("mid-dune")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c6ad87" />
                    <stop offset="100%" stopColor="#ab9069" />
                </linearGradient>

                <linearGradient id={id("near-dune")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9f9c72" />
                    <stop offset="100%" stopColor="#77845f" />
                </linearGradient>

                <linearGradient id={id("water")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d9e9dd" />
                    <stop offset="100%" stopColor="#a7c9bf" />
                </linearGradient>

                <linearGradient id={id("path")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f4e5c8" />
                    <stop offset="100%" stopColor="#dec8a1" />
                </linearGradient>

                <linearGradient id={id("trunk")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#80603f" />
                    <stop offset="100%" stopColor="#57402b" />
                </linearGradient>

                <linearGradient id={id("canopy")} x1="0" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stopColor="#7f9a63" />
                    <stop offset="100%" stopColor="#4c6a4b" />
                </linearGradient>

                <linearGradient id={id("canopy-light")} x1="0" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stopColor="#b1b97a" />
                    <stop offset="100%" stopColor="#7f9a58" />
                </linearGradient>

                <radialGradient id={id("lantern")} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#ffe7a8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#ffe7a8" stopOpacity="0" />
                </radialGradient>

                <filter id={id("soft")} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="8" />
                </filter>
            </defs>

            <rect width="1200" height="760" fill={`url(#${id("sky")})`} />

            <circle cx="872" cy="224" r="190" fill={`url(#${id("sun-glow")})`} />
            <circle cx="872" cy="224" r="54" fill="#ffe4a6" opacity="0.92" />

            <g fill="#fff6df" opacity="0.72">
                <circle cx="188" cy="112" r="2.4" />
                <circle cx="286" cy="76" r="1.8" />
                <circle cx="430" cy="132" r="2" />
                <circle cx="1010" cy="92" r="2.2" />
                <circle cx="1112" cy="144" r="1.6" />
            </g>

            <g
                fill="none"
                stroke="#5c6570"
                strokeLinecap="round"
                strokeWidth="2.6"
                opacity="0.4"
            >
                <path d="M260 190 q11 -8 22 0 q11 -8 22 0" />
                <path d="M322 168 q8 -6 16 0 q8 -6 16 0" />
                <path d="M966 182 q9 -7 18 0 q9 -7 18 0" />
            </g>

            <path
                d="M0 404 C118 354 214 382 324 368 C446 352 548 394 674 376 C806 356 930 394 1044 370 C1112 356 1160 366 1200 360 L1200 760 L0 760 Z"
                fill={`url(#${id("far-dune")})`}
            />
            <path
                d="M0 468 C146 414 270 446 404 430 C542 414 654 458 792 438 C936 416 1050 452 1200 426 L1200 760 L0 760 Z"
                fill={`url(#${id("mid-dune")})`}
            />

            <ellipse cx="928" cy="512" rx="186" ry="48" fill={`url(#${id("water")})`} />
            <ellipse cx="902" cy="498" rx="108" ry="16" fill="#f2faf3" opacity="0.55" />
            <path
                d="M748 512 C790 490 826 492 858 512 C890 532 926 534 960 516 C1000 494 1046 500 1090 522"
                fill="none"
                stroke="#7fa99c"
                strokeLinecap="round"
                strokeWidth="4"
                opacity="0.5"
            />

            <path
                d="M0 566 C156 516 308 544 470 526 C650 506 806 548 972 524 C1060 512 1132 526 1200 514 L1200 760 L0 760 Z"
                fill={`url(#${id("near-dune")})`}
            />

            <path
                d="M530 760 C562 700 622 666 610 614 C600 570 632 540 668 516 L702 524 C666 552 654 578 674 618 C710 692 738 724 768 760 Z"
                fill={`url(#${id("path")})`}
            />
            <path
                d="M592 760 C618 712 660 680 648 630 C638 596 660 566 690 546"
                fill="none"
                stroke="#fbf2de"
                strokeWidth="6"
                opacity="0.5"
            />

            <GhafTree
                x={158}
                y={568}
                scale={1.2}
                canopy={`url(#${id("canopy")})`}
                trunk={`url(#${id("trunk")})`}
                glow={`url(#${id("canopy-light")})`}
            />
            <GhafTree
                x={286}
                y={590}
                scale={0.82}
                light
                canopy={`url(#${id("canopy")})`}
                trunk={`url(#${id("trunk")})`}
                glow={`url(#${id("canopy-light")})`}
            />
            <GhafTree
                x={1048}
                y={572}
                scale={1.08}
                canopy={`url(#${id("canopy")})`}
                trunk={`url(#${id("trunk")})`}
                glow={`url(#${id("canopy-light")})`}
            />
            <GhafTree
                x={948}
                y={606}
                scale={0.72}
                light
                canopy={`url(#${id("canopy")})`}
                trunk={`url(#${id("trunk")})`}
                glow={`url(#${id("canopy-light")})`}
            />

            <g transform="translate(218 496)">
                <ellipse cx="0" cy="46" rx="76" ry="16" fill="#4d5b46" opacity="0.16" filter={`url(#${id("soft")})`} />
                <rect x="-38" y="-22" width="76" height="50" rx="5" fill="#efe2c8" stroke="#d2bd99" />
                <path d="M-52 -22 L0 -62 L52 -22 Z" fill="#8a6042" />
                <rect x="-10" y="2" width="20" height="26" rx="2" fill="#6a4b32" />
                <rect x="-29" y="-10" width="14" height="14" rx="2" fill="#ffe8b2" stroke="#c9a86a" strokeWidth="1.4" />
                <rect x="15" y="-10" width="14" height="14" rx="2" fill="#ffe8b2" stroke="#c9a86a" strokeWidth="1.4" />
                <circle cx="0" cy="-38" r="32" fill={`url(#${id("lantern")})`} />
                <circle cx="0" cy="-38" r="4" fill="#ffe8b2" />
                <path d="M0 -62 L0 -74" stroke="#6a4b32" strokeWidth="3" strokeLinecap="round" />
            </g>

            <g fill="none" stroke="#6f8a61" strokeLinecap="round" strokeWidth="2" opacity="0.6">
                <path d="M84 690 q-7 -22 -2 -38" />
                <path d="M96 692 q5 -20 16 -30" />
                <path d="M386 652 q-7 -20 -2 -34" />
                <path d="M398 654 q5 -18 14 -26" />
                <path d="M874 666 q-7 -20 -2 -34" />
                <path d="M886 668 q5 -18 14 -26" />
                <path d="M1118 694 q-6 -18 -1 -30" />
            </g>

            <Flower x={110} y={690} color="#e7c98f" />
            <Flower x={350} y={656} color="#f0d6a4" scale={0.85} />
            <Flower x={842} y={674} color="#d9c8e4" />
            <Flower x={1084} y={702} color="#e7c98f" scale={0.9} />
            <Flower x={1010} y={644} color="#f0d6a4" scale={0.8} />

            {Array.from({ length: extraFlowers }).map((_, index) => (
                <Flower
                    key={`growth-flower-${index}`}
                    x={458 + index * 38}
                    y={700 - (index % 3) * 12}
                    color={index % 2 === 0 ? "#f0d6a4" : "#d9c8e4"}
                    scale={0.7 + (index % 3) * 0.1}
                />
            ))}

            <g fill="#ffe7a8">
                <circle className="world-scene__pollen" cx="470" cy="340" r="3" opacity="0.7" />
                <circle className="world-scene__pollen" cx="760" cy="292" r="2.5" opacity="0.6" style={{ animationDelay: "1.4s" }} />
                <circle className="world-scene__pollen" cx="1014" cy="362" r="3" opacity="0.55" style={{ animationDelay: "2.6s" }} />
                <circle className="world-scene__pollen" cx="612" cy="420" r="2" opacity="0.6" style={{ animationDelay: "3.4s" }} />
                <circle className="world-scene__pollen" cx="330" cy="452" r="2.4" opacity="0.5" style={{ animationDelay: "4.2s" }} />
            </g>
        </svg>
    );
}

export default WorldScene;
