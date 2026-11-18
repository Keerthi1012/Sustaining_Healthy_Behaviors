import { useEffect, useMemo, useState } from "react";

import { getSkyState } from "./skyTime";
import "./SkyScene.css";

const STARS = [
    { x: 8, y: 14, r: 1.7 },
    { x: 17, y: 26, r: 1.2 },
    { x: 24, y: 9, r: 1.5 },
    { x: 31, y: 21, r: 1.1 },
    { x: 38, y: 34, r: 1.6 },
    { x: 45, y: 12, r: 1.2 },
    { x: 52, y: 27, r: 1.4 },
    { x: 58, y: 7, r: 1.1 },
    { x: 64, y: 19, r: 1.6 },
    { x: 71, y: 30, r: 1.2 },
    { x: 77, y: 11, r: 1.5 },
    { x: 83, y: 24, r: 1.1 },
    { x: 89, y: 16, r: 1.7 },
    { x: 95, y: 31, r: 1.3 },
    { x: 13, y: 38, r: 1.1 },
    { x: 27, y: 41, r: 1.3 },
    { x: 42, y: 44, r: 1.1 },
    { x: 60, y: 39, r: 1.2 },
    { x: 86, y: 42, r: 1.1 },
];

function SkyScene({ quiet = false, className = "" }) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const refresh = () => setNow(new Date());
        const interval = window.setInterval(refresh, 60000);

        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", refresh);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener("focus", refresh);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, []);

    const sky = useMemo(() => getSkyState(now), [now]);

    return (
        <div
            className={`sky-scene ${quiet ? "sky-scene--quiet" : ""} ${className}`.trim()}
            aria-hidden="true"
            style={{
                "--sky-top": sky.skyTop,
                "--sky-bottom": sky.skyBottom,
                "--hill-far": sky.hillFar,
                "--hill-mid": sky.hillMid,
                "--hill-near": sky.hillNear,
                "--sky-ground": sky.ground,
                "--sun-color": sky.sunColor,
                "--sun-glow": sky.sunGlow,
                "--moon-color": "#f3eeda",
                "--moon-glow": "rgba(243, 238, 218, 0.35)",
                "--star-opacity": sky.stars,
            }}
        >
            <span
                className="sky-scene__sun-glow"
                style={{
                    left: `${sky.sun.x}%`,
                    top: `${sky.sun.y}%`,
                    opacity: sky.sun.opacity,
                }}
            />
            <span
                className="sky-scene__sun-core"
                style={{
                    left: `${sky.sun.x}%`,
                    top: `${sky.sun.y}%`,
                    opacity: sky.sun.opacity,
                }}
            />
            <span
                className="sky-scene__moon-glow"
                style={{
                    left: `${sky.moon.x}%`,
                    top: `${sky.moon.y}%`,
                    opacity: sky.moon.opacity,
                }}
            />
            <span
                className="sky-scene__moon-core"
                style={{
                    left: `${sky.moon.x}%`,
                    top: `${sky.moon.y}%`,
                    opacity: sky.moon.opacity,
                }}
            />

            <svg
                className="sky-scene__art"
                viewBox="0 0 1200 760"
                preserveAspectRatio="none"
                focusable="false"
            >
                <g className="sky-scene__stars">
                    {STARS.map((star) => (
                        <circle
                            key={`${star.x}-${star.y}`}
                            cx={star.x * 12}
                            cy={star.y * 7.6}
                            r={star.r * 1.6}
                        />
                    ))}
                </g>

                <path
                    className="sky-scene__hill sky-scene__hill--far"
                    d="M0 470 C 210 430, 430 492, 640 455 C 850 418, 1030 478, 1200 448 L 1200 760 L 0 760 Z"
                />
                <path
                    className="sky-scene__hill sky-scene__hill--mid"
                    d="M0 566 C 240 528, 470 586, 700 548 C 900 516, 1060 566, 1200 540 L 1200 760 L 0 760 Z"
                />
                <path
                    className="sky-scene__hill sky-scene__hill--near"
                    d="M0 652 C 250 622, 520 668, 760 642 C 980 618, 1100 654, 1200 636 L 1200 760 L 0 760 Z"
                />
                <path
                    className="sky-scene__ground"
                    d="M0 704 L 1200 704 L 1200 760 L 0 760 Z"
                />
            </svg>
        </div>
    );
}

export default SkyScene;
