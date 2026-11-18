import { DEFAULT_READINESS, normalizeReadiness } from "./readiness";

export const ARRIVAL_TIME_VALUES = [2, 5, 10];

export const MOOD_READINESS = {
    calm: { energy: "good", headspace: "light" },
    hopeful: { energy: "okay", headspace: "light" },
    tired: { energy: "low", headspace: "neutral" },
    heavy: { energy: "low", headspace: "heavy" },
    restless: { energy: "okay", headspace: "heavy" },
};

export const ARRIVAL_WEATHER_VALUES = ["mild", "hot", "rainy", "cold"];

export function getMoodReadiness(mood) {
    return MOOD_READINESS[mood] ?? null;
}

export function buildArrivalReadiness(
    { mood, time, weather } = {},
    fallback = DEFAULT_READINESS
) {
    const base = normalizeReadiness(fallback ?? DEFAULT_READINESS);
    const derived = getMoodReadiness(mood) ?? {};
    const nextTime = Number(time);

    return normalizeReadiness({
        ...base,
        ...derived,
        time: ARRIVAL_TIME_VALUES.includes(nextTime) ? nextTime : base.time,
        weather: ARRIVAL_WEATHER_VALUES.includes(weather)
            ? weather
            : base.weather,
    });
}
