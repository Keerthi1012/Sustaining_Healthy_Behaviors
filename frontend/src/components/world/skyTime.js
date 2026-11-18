const SUNRISE = 330;
const SUNSET = 1110;
const FADE = 30;
const SUNSET_GLOW = 45;

const KEYFRAMES = [
    {
        at: 0,
        skyTop: "#101827",
        skyBottom: "#25344a",
        hillFar: "#1a2434",
        hillMid: "#22303f",
        hillNear: "#2b3a4a",
        ground: "#33465a",
        sunColor: "#ffe8b1",
        stars: 0.9,
    },
    {
        at: 270,
        skyTop: "#141f2f",
        skyBottom: "#2b3b50",
        hillFar: "#1d2836",
        hillMid: "#263442",
        hillNear: "#2f3f4f",
        ground: "#37495d",
        sunColor: "#ffe8b1",
        stars: 0.75,
    },
    {
        at: 330,
        skyTop: "#b9c6d6",
        skyBottom: "#f7d3ae",
        hillFar: "#a9bcb0",
        hillMid: "#93a995",
        hillNear: "#7f9a85",
        ground: "#71907c",
        sunColor: "#ffd9a0",
        stars: 0.12,
    },
    {
        at: 450,
        skyTop: "#cbe0e0",
        skyBottom: "#edf0dd",
        hillFar: "#b8cfbd",
        hillMid: "#9fbfa6",
        hillNear: "#87ad91",
        ground: "#79a486",
        sunColor: "#fff3cd",
        stars: 0,
    },
    {
        at: 720,
        skyTop: "#c6dfe4",
        skyBottom: "#e8f0e3",
        hillFar: "#b6d0bd",
        hillMid: "#9cbda4",
        hillNear: "#84ab90",
        ground: "#78a384",
        sunColor: "#fffbe8",
        stars: 0,
    },
    {
        at: 990,
        skyTop: "#cfe0dd",
        skyBottom: "#f2e5cb",
        hillFar: "#bccfb4",
        hillMid: "#a1b99b",
        hillNear: "#88a68a",
        ground: "#7a9e80",
        sunColor: "#ffeec2",
        stars: 0,
    },
    {
        at: 1110,
        skyTop: "#e2bb92",
        skyBottom: "#f7d6a6",
        hillFar: "#b3b492",
        hillMid: "#97a47b",
        hillNear: "#7f9069",
        ground: "#71866a",
        sunColor: "#ffcf87",
        stars: 0.1,
    },
    {
        at: 1200,
        skyTop: "#6d6891",
        skyBottom: "#dfa289",
        hillFar: "#4d4d6b",
        hillMid: "#3f4a63",
        hillNear: "#35465a",
        ground: "#2f4353",
        sunColor: "#ffb27a",
        stars: 0.45,
    },
    {
        at: 1290,
        skyTop: "#101827",
        skyBottom: "#25344a",
        hillFar: "#1a2434",
        hillMid: "#22303f",
        hillNear: "#2b3a4a",
        ground: "#33465a",
        sunColor: "#ffe8b1",
        stars: 0.85,
    },
    {
        at: 1440,
        skyTop: "#101827",
        skyBottom: "#25344a",
        hillFar: "#1a2434",
        hillMid: "#22303f",
        hillNear: "#2b3a4a",
        ground: "#33465a",
        sunColor: "#ffe8b1",
        stars: 0.9,
    },
];

function hexToRgb(hex) {
    const value = hex.replace("#", "");
    const full =
        value.length === 3
            ? value
                  .split("")
                  .map((char) => char + char)
                  .join("")
            : value;

    return [
        Number.parseInt(full.slice(0, 2), 16),
        Number.parseInt(full.slice(2, 4), 16),
        Number.parseInt(full.slice(4, 6), 16),
    ];
}

function lerp(from, to, amount) {
    return from + (to - from) * amount;
}

function smoothstep(amount) {
    return amount * amount * (3 - 2 * amount);
}

function mixColor(fromHex, toHex, amount) {
    const from = hexToRgb(fromHex);
    const to = hexToRgb(toHex);

    return from.map((channel, index) => Math.round(lerp(channel, to[index], amount)));
}

function toRgb([red, green, blue]) {
    return `rgb(${red}, ${green}, ${blue})`;
}

function toRgba([red, green, blue], alpha) {
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function findBracket(minutes) {
    for (let index = 0; index < KEYFRAMES.length - 1; index += 1) {
        const current = KEYFRAMES[index];
        const next = KEYFRAMES[index + 1];

        if (minutes >= current.at && minutes <= next.at) {
            const span = next.at - current.at || 1;
            const amount = smoothstep((minutes - current.at) / span);

            return { current, next, amount };
        }
    }

    return { current: KEYFRAMES[0], next: KEYFRAMES[0], amount: 0 };
}

function arcPosition(progress) {
    return {
        x: 42 + 52 * progress,
        y: 40 - 26 * Math.sin(Math.PI * progress),
    };
}

function sunState(minutes) {
    if (minutes < SUNRISE || minutes > SUNSET + SUNSET_GLOW) {
        return { ...arcPosition(0), opacity: 0 };
    }

    const progress = Math.min(
        1,
        Math.max(0, (minutes - SUNRISE) / (SUNSET - SUNRISE))
    );
    const fadeIn = Math.min(1, (minutes - SUNRISE) / FADE);
    const fadeOut =
        minutes <= SUNSET ? 1 : Math.max(0, 1 - (minutes - SUNSET) / SUNSET_GLOW);

    return {
        ...arcPosition(progress),
        opacity: Math.max(0, Math.min(fadeIn, fadeOut)),
    };
}

function moonState(minutes) {
    const nightLength = 1440 - (SUNSET - SUNRISE);

    if (minutes >= SUNSET || minutes <= SUNRISE) {
        const elapsed =
            minutes >= SUNSET ? minutes - SUNSET : minutes + 1440 - SUNSET;
        const remaining = nightLength - elapsed;
        const progress = elapsed / nightLength;
        const fadeIn = Math.min(1, elapsed / FADE);
        const fadeOut = Math.min(1, remaining / FADE);

        return {
            ...arcPosition(progress),
            opacity: Math.max(0, Math.min(fadeIn, fadeOut)),
        };
    }

    return { ...arcPosition(0), opacity: 0 };
}

export function getSkyState(now = new Date()) {
    const date = now instanceof Date ? now : new Date(now);
    const minutes =
        date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
    const { current, next, amount } = findBracket(minutes);
    const sun = sunState(minutes);
    const moon = moonState(minutes);
    const sunColor = mixColor(current.sunColor, next.sunColor, amount);

    return {
        minutes,
        skyTop: toRgb(mixColor(current.skyTop, next.skyTop, amount)),
        skyBottom: toRgb(mixColor(current.skyBottom, next.skyBottom, amount)),
        hillFar: toRgb(mixColor(current.hillFar, next.hillFar, amount)),
        hillMid: toRgb(mixColor(current.hillMid, next.hillMid, amount)),
        hillNear: toRgb(mixColor(current.hillNear, next.hillNear, amount)),
        ground: toRgb(mixColor(current.ground, next.ground, amount)),
        sunColor: toRgb(sunColor),
        sunGlow: toRgba(sunColor, 0.45),
        stars: lerp(current.stars, next.stars, amount),
        sun: {
            x: sun.x,
            y: sun.y,
            opacity: sun.opacity,
        },
        moon: {
            x: moon.x,
            y: moon.y,
            opacity: moon.opacity,
        },
    };
}
