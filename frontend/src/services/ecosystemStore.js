const STORAGE_KEY = "sproutly.ecosystem.v1";

export const SCREENING_OPTIONS = [
    "none",
    "prediabetes",
    "hypertension",
    "cardio_metabolic",
];

export const DEFAULT_ECOSYSTEM_CONTEXT = {
    source: "manual",
    healthAgeDelta: 0,
    screeningRisk: "none",
    wearableBaseline: {
        dailySteps: 6000,
        avgSleepMinutes: 420,
    },
    contextFlags: {
        extremeHeatMode: false,
        shiftWorker: false,
        fasting: false,
        mobilitySupport: false,
    },
    updatedAt: null,
};

const PRESETS = {
    desk_heat: {
        healthAgeDelta: 1,
        screeningRisk: "cardio_metabolic",
        wearableBaseline: {
            dailySteps: 4200,
            avgSleepMinutes: 390,
        },
        contextFlags: {
            extremeHeatMode: true,
            shiftWorker: false,
            fasting: false,
            mobilitySupport: false,
        },
    },
    shift_nurse: {
        healthAgeDelta: 2,
        screeningRisk: "hypertension",
        wearableBaseline: {
            dailySteps: 7600,
            avgSleepMinutes: 330,
        },
        contextFlags: {
            extremeHeatMode: false,
            shiftWorker: true,
            fasting: false,
            mobilitySupport: false,
        },
    },
    ramadan_focus: {
        healthAgeDelta: 0,
        screeningRisk: "prediabetes",
        wearableBaseline: {
            dailySteps: 5200,
            avgSleepMinutes: 380,
        },
        contextFlags: {
            extremeHeatMode: true,
            shiftWorker: false,
            fasting: true,
            mobilitySupport: false,
        },
    },
};

export const ABU_DHABI_PRESET_IDS = [
    "desk_heat",
    "shift_nurse",
    "ramadan_focus",
];

function clampInteger(value, min, max, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) return fallback;

    return Math.min(max, Math.max(min, Math.round(number)));
}

function normalizeSource(value) {
    return value === "sahatna_malaffi_demo" ? value : "manual";
}

function normalizeScreening(value) {
    return SCREENING_OPTIONS.includes(value) ? value : "none";
}

export function normalizeEcosystemContext(context) {
    const source = context ?? {};
    const baseline = source.wearableBaseline ?? {};
    const flags = source.contextFlags ?? {};

    return {
        source: normalizeSource(source.source),
        healthAgeDelta: clampInteger(source.healthAgeDelta, -5, 10, 0),
        screeningRisk: normalizeScreening(source.screeningRisk),
        wearableBaseline: {
            dailySteps: clampInteger(
                baseline.dailySteps,
                0,
                60000,
                DEFAULT_ECOSYSTEM_CONTEXT.wearableBaseline.dailySteps
            ),
            avgSleepMinutes: clampInteger(
                baseline.avgSleepMinutes,
                0,
                1440,
                DEFAULT_ECOSYSTEM_CONTEXT.wearableBaseline.avgSleepMinutes
            ),
        },
        contextFlags: {
            extremeHeatMode: Boolean(flags.extremeHeatMode),
            shiftWorker: Boolean(flags.shiftWorker),
            fasting: Boolean(flags.fasting),
            mobilitySupport: Boolean(flags.mobilitySupport),
        },
        updatedAt:
            typeof source.updatedAt === "string" ? source.updatedAt : null,
    };
}

function getStorageKey(userId) {
    return userId ? `${STORAGE_KEY}.${encodeURIComponent(userId)}` : STORAGE_KEY;
}

function getStorage() {
    if (typeof window === "undefined") return null;

    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function loadEcosystemContext(userId) {
    const storage = getStorage();
    const fallback = normalizeEcosystemContext(DEFAULT_ECOSYSTEM_CONTEXT);

    if (!storage) return fallback;

    try {
        const raw = storage.getItem(getStorageKey(userId));
        return raw
            ? normalizeEcosystemContext(JSON.parse(raw))
            : fallback;
    } catch {
        return fallback;
    }
}

export function saveEcosystemContext(userId, context) {
    const normalized = normalizeEcosystemContext({
        ...context,
        updatedAt: new Date().toISOString(),
    });
    const storage = getStorage();

    if (!storage) return normalized;

    try {
        storage.setItem(
            getStorageKey(userId),
            JSON.stringify(normalized)
        );
    } catch {
        return normalized;
    }

    return normalized;
}

export function resetEcosystemContext(userId) {
    const storage = getStorage();

    if (storage) {
        try {
            storage.removeItem(getStorageKey(userId));
        } catch {
            return normalizeEcosystemContext(DEFAULT_ECOSYSTEM_CONTEXT);
        }
    }

    return normalizeEcosystemContext(DEFAULT_ECOSYSTEM_CONTEXT);
}

export function getSampleAbuDhabiProfile(presetId) {
    const preset = PRESETS[presetId];

    if (!preset) return null;

    return normalizeEcosystemContext({
        ...preset,
        source: "sahatna_malaffi_demo",
    });
}
