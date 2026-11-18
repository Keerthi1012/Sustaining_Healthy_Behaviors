export const READINESS_ENERGY_VALUES = ["low", "okay", "good"];
export const READINESS_HEADSPACE_VALUES = ["heavy", "neutral", "light"];
export const READINESS_WEATHER_VALUES = ["mild", "hot", "rainy", "cold"];
export const READINESS_TIME_VALUES = [2, 5, 10];

export const DEFAULT_READINESS = {
    energy: "okay",
    time: 5,
    weather: "mild",
    headspace: "neutral",
};

function normalizeValue(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
}

export function normalizeReadiness(value) {
    const source = value ?? {};

    return {
        energy: normalizeValue(
            source.energy,
            READINESS_ENERGY_VALUES,
            DEFAULT_READINESS.energy
        ),
        time: normalizeValue(
            Number(source.time),
            READINESS_TIME_VALUES,
            DEFAULT_READINESS.time
        ),
        weather: normalizeValue(
            source.weather,
            READINESS_WEATHER_VALUES,
            DEFAULT_READINESS.weather
        ),
        headspace: normalizeValue(
            source.headspace,
            READINESS_HEADSPACE_VALUES,
            DEFAULT_READINESS.headspace
        ),
    };
}

export function isSameReadiness(left, right) {
    const normalizedLeft = normalizeReadiness(left);
    const normalizedRight = normalizeReadiness(right);

    return (
        normalizedLeft.energy === normalizedRight.energy &&
        normalizedLeft.time === normalizedRight.time &&
        normalizedLeft.weather === normalizedRight.weather &&
        normalizedLeft.headspace === normalizedRight.headspace
    );
}
