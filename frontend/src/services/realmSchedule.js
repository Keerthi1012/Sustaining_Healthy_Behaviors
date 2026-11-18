import { daysBetween, toDateKey } from "../utils/date";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_WINDOWS_PER_REALM = 4;
const MAX_WINDOW_MINUTES = 8 * 60;
const WIND_DOWN_LEAD_MINUTES = 30;
const DEFAULT_ROTATION_ANCHOR = "2026-01-01";

export const SHIFT_MODES = {
    DAY: "day",
    NIGHT: "night",
    ROTATING: "rotating",
    CUSTOM: "custom",
};

export const REALM_DOMAINS = [
    "movement",
    "sleep",
    "nutrition",
    "smoking",
];

export const PREFERRED_TIME_WINDOWS = {
    morning: [{ start: "07:00", end: "09:00" }],
    midday: [{ start: "12:00", end: "14:00" }],
    evening: [{ start: "19:00", end: "21:00" }],
    night: [{ start: "22:00", end: "22:30" }],
};

const PRESETS = {
    day: {
        windows: {
            movement: [{ start: "19:00", end: "21:00" }],
            sleep: [{ start: "22:00", end: "22:30" }],
            nutrition: [
                { start: "08:00", end: "09:30" },
                { start: "12:30", end: "13:30" },
                { start: "18:30", end: "19:30" },
            ],
            smoking: [
                { start: "13:00", end: "15:00" },
                { start: "20:00", end: "22:00" },
            ],
        },
        quietHours: { start: "23:30", end: "07:00" },
    },
    night: {
        windows: {
            movement: [{ start: "17:00", end: "19:00" }],
            sleep: [{ start: "09:00", end: "11:00" }],
            nutrition: [
                { start: "16:30", end: "18:00" },
                { start: "23:00", end: "00:30" },
                { start: "04:30", end: "06:00" },
            ],
            smoking: [
                { start: "02:00", end: "04:00" },
                { start: "14:00", end: "16:00" },
            ],
        },
        quietHours: { start: "11:00", end: "16:30" },
    },
};

function cloneWindow(window) {
    return { start: window.start, end: window.end };
}

function cloneWindows(windows) {
    return (windows ?? []).map(cloneWindow);
}

function cloneWindowMap(windows) {
    const map = {};

    REALM_DOMAINS.forEach((domain) => {
        map[domain] = cloneWindows(windows?.[domain]);
    });

    return map;
}

function clampInteger(value, min, max, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) return fallback;

    return Math.min(max, Math.max(min, Math.round(number)));
}

export function toMinutes(value) {
    if (!TIME_PATTERN.test(String(value ?? ""))) return null;

    const [hours, minutes] = String(value).split(":").map(Number);
    return hours * 60 + minutes;
}

export function isSameWindow(left, right) {
    return left.start === right.start && left.end === right.end;
}

export function getWindowLengthMinutes(window) {
    const start = toMinutes(window?.start);
    const end = toMinutes(window?.end);

    if (start === null || end === null || start === end) {
        return 0;
    }

    return (end - start + 1440) % 1440 || 1440;
}

export function normalizeWindowList(value, fallback = []) {
    if (!Array.isArray(value)) {
        return cloneWindows(fallback);
    }

    if (value.length === 0) {
        return [];
    }

    const cleaned = value
        .filter((window) => window && typeof window === "object")
        .map((window) => ({
            start: String(window.start ?? ""),
            end: String(window.end ?? ""),
        }))
        .filter(
            (window) =>
                TIME_PATTERN.test(window.start) &&
                TIME_PATTERN.test(window.end) &&
                window.start !== window.end &&
                getWindowLengthMinutes(window) <= MAX_WINDOW_MINUTES
        )
        .filter(
            (window, index, all) =>
                all.findIndex((other) =>
                    isSameWindow(other, window)
                ) === index
        )
        .sort(
            (left, right) =>
                toMinutes(left.start) - toMinutes(right.start)
        )
        .slice(0, MAX_WINDOWS_PER_REALM);

    return cleaned.length ? cleaned : cloneWindows(fallback);
}

function normalizeWindowMap(value, fallback) {
    const source = value && typeof value === "object" ? value : {};
    const map = {};

    REALM_DOMAINS.forEach((domain) => {
        map[domain] = normalizeWindowList(
            source[domain],
            fallback?.[domain] ?? []
        );
    });

    return map;
}

function normalizeQuietHours(value, fallback) {
    const source = value && typeof value === "object" ? value : {};

    return {
        start: TIME_PATTERN.test(source.start)
            ? source.start
            : fallback.start,
        end: TIME_PATTERN.test(source.end)
            ? source.end
            : fallback.end,
    };
}

function normalizeRotation(value) {
    const source = value && typeof value === "object" ? value : {};
    const first =
        source.first === SHIFT_MODES.NIGHT
            ? SHIFT_MODES.NIGHT
            : SHIFT_MODES.DAY;
    const requestedSecond =
        source.second === SHIFT_MODES.NIGHT
            ? SHIFT_MODES.NIGHT
            : SHIFT_MODES.DAY;

    return {
        anchorDate:
            DATE_PATTERN.test(source.anchorDate) &&
            !Number.isNaN(Date.parse(`${source.anchorDate}T00:00:00`))
                ? source.anchorDate
                : DEFAULT_ROTATION_ANCHOR,
        cycleDays: clampInteger(source.cycleDays, 1, 28, 7),
        first,
        second:
            requestedSecond === first
                ? first === SHIFT_MODES.DAY
                    ? SHIFT_MODES.NIGHT
                    : SHIFT_MODES.DAY
                : requestedSecond,
    };
}

export function getSchedulePreset(mode = SHIFT_MODES.DAY) {
    const preset =
        mode === SHIFT_MODES.NIGHT ? PRESETS.night : PRESETS.day;

    return {
        version: 1,
        mode:
            mode === SHIFT_MODES.NIGHT ||
            mode === SHIFT_MODES.CUSTOM ||
            mode === SHIFT_MODES.ROTATING
                ? mode
                : SHIFT_MODES.DAY,
        windows: cloneWindowMap(preset.windows),
        rotation: normalizeRotation(),
        maxPerDay: 2,
        minGapMinutes: 90,
        quietHours: { ...preset.quietHours },
    };
}

export const DEFAULT_SCHEDULE = getSchedulePreset(SHIFT_MODES.DAY);

export function normalizeSchedule(value) {
    const source = value && typeof value === "object" ? value : {};
    const mode = Object.values(SHIFT_MODES).includes(source.mode)
        ? source.mode
        : SHIFT_MODES.DAY;
    const preset = getSchedulePreset(mode);

    return {
        version: 1,
        mode,
        windows: normalizeWindowMap(source.windows, preset.windows),
        rotation: normalizeRotation(source.rotation),
        maxPerDay: clampInteger(source.maxPerDay, 1, 6, preset.maxPerDay),
        minGapMinutes: clampInteger(
            source.minGapMinutes,
            15,
            720,
            preset.minGapMinutes
        ),
        quietHours: normalizeQuietHours(
            source.quietHours,
            preset.quietHours
        ),
    };
}

export function getPreferredTimeWindow(preferred) {
    const windows = PREFERRED_TIME_WINDOWS[preferred];

    return windows ? cloneWindows(windows) : null;
}

export function fromMinutes(minutes) {
    const total =
        ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
    const hours = String(Math.floor(total / 60)).padStart(2, "0");
    const mins = String(total % 60).padStart(2, "0");

    return `${hours}:${mins}`;
}

export function applySleepWindDown(schedule, windDownTime) {
    const normalized = normalizeSchedule(schedule);
    const end = toMinutes(windDownTime);

    if (end === null) return normalized;

    const start = (end - WIND_DOWN_LEAD_MINUTES + 1440) % 1440;
    const window = {
        start: fromMinutes(start),
        end: fromMinutes(end),
    };

    return {
        ...normalized,
        windows: {
            ...normalized.windows,
            sleep: [window],
        },
    };
}

export function applyPreferredTime(schedule, domain, preferred) {
    const normalized = normalizeSchedule(schedule);
    const windows = getPreferredTimeWindow(preferred);

    if (!windows || !REALM_DOMAINS.includes(domain)) {
        return normalized;
    }

    return {
        ...normalized,
        windows: {
            ...normalized.windows,
            [domain]: windows,
        },
    };
}

export function buildScheduleFromProfile(profile = {}, options = {}) {
    const shiftWorker = Boolean(
        options.shiftWorker ??
            profile.ecosystemContext?.contextFlags?.shiftWorker ??
            profile.shiftWorker
    );
    let schedule = getSchedulePreset(
        shiftWorker ? SHIFT_MODES.NIGHT : SHIFT_MODES.DAY
    );
    const preferredTimes =
        options.preferredTimes ?? profile.preferredTimes ?? {};

    REALM_DOMAINS.forEach((domain) => {
        if (preferredTimes[domain]) {
            schedule = applyPreferredTime(
                schedule,
                domain,
                preferredTimes[domain]
            );
        }
    });

    const primary = profile.primaryGoalId;
    const primaryPreferred = profile.answers?.preferredTime;

    if (primary && primaryPreferred) {
        schedule = applyPreferredTime(
            schedule,
            primary,
            primaryPreferred
        );
    }

    if (primary === "sleep" && profile.answers?.windDownTime) {
        schedule = applySleepWindDown(
            schedule,
            profile.answers.windDownTime
        );
    }

    return normalizeSchedule(schedule);
}

export function resolveJourneySchedule(journey, options = {}) {
    const stored = journey?.preferences?.schedule;

    if (stored) return normalizeSchedule(stored);

    return buildScheduleFromProfile(journey?.profile ?? {}, {
        shiftWorker: options.shiftWorker,
    });
}

export function getActiveShift(schedule, now = new Date()) {
    const normalized = normalizeSchedule(schedule);

    if (normalized.mode !== SHIFT_MODES.ROTATING) {
        return normalized.mode;
    }

    const rotation = normalized.rotation;
    const elapsedDays = Math.max(
        0,
        daysBetween(rotation.anchorDate, toDateKey(now))
    );
    const cycleIndex =
        Math.floor(elapsedDays / rotation.cycleDays) % 2;

    return cycleIndex === 0 ? rotation.first : rotation.second;
}

export function getActiveSchedule(schedule, now = new Date()) {
    const normalized = normalizeSchedule(schedule);
    const shift = getActiveShift(normalized, now);

    if (normalized.mode !== SHIFT_MODES.ROTATING) {
        return { ...normalized, shift };
    }

    const preset = getSchedulePreset(
        shift === SHIFT_MODES.NIGHT
            ? SHIFT_MODES.NIGHT
            : SHIFT_MODES.DAY
    );

    return {
        ...normalized,
        shift,
        windows: preset.windows,
        source: "rotation",
    };
}

export function isWithinWindow(now, window) {
    if (!window) return false;

    const start = toMinutes(window.start);
    const end = toMinutes(window.end);

    if (start === null || end === null || start === end) {
        return false;
    }

    const minutes = now.getHours() * 60 + now.getMinutes();

    if (start < end) {
        return minutes >= start && minutes < end;
    }

    return minutes >= start || minutes < end;
}

export function getWindowPosition(window, now) {
    const start = toMinutes(window?.start);
    const end = toMinutes(window?.end);

    if (start === null || end === null || start === end) {
        return 0;
    }

    const length = (end - start + 1440) % 1440 || 1440;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const elapsed = (minutes - start + 1440) % 1440;

    return Math.min(1, elapsed / length);
}

export function findActiveWindow(windows, domain, now) {
    const list = windows?.[domain] ?? [];

    return list.find((window) => isWithinWindow(now, window)) ?? null;
}

export function getActiveWindow(domain, schedule, now = new Date()) {
    const active = getActiveSchedule(schedule, now);
    const window = findActiveWindow(active.windows, domain, now);

    return window ? { ...window, domain, shift: active.shift } : null;
}

export function formatWindow(window) {
    return window ? `${window.start}–${window.end}` : "";
}

export function getScheduleTimeOptions() {
    return Object.keys(PREFERRED_TIME_WINDOWS);
}
