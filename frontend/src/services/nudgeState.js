import { toDateKey } from "../utils/date";

const STORAGE_PREFIX = "sproutly.nudges.v1";
const DOMAINS = ["movement", "sleep", "nutrition", "smoking"];

function getStorageKey(userId) {
    return userId
        ? `${STORAGE_PREFIX}.${encodeURIComponent(userId)}`
        : STORAGE_PREFIX;
}

function getStorage() {
    if (typeof window === "undefined") return null;

    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function normalizeLastSent(value) {
    const source = value && typeof value === "object" ? value : {};
    const lastSentAtByDomain = {};

    DOMAINS.forEach((domain) => {
        if (typeof source[domain] === "string") {
            lastSentAtByDomain[domain] = source[domain];
        }
    });

    return lastSentAtByDomain;
}

export function normalizeNudgeState(value, now = new Date()) {
    const source = value && typeof value === "object" ? value : {};
    const date = toDateKey(now);
    const count = Number(source.count);

    return {
        date,
        count:
            source.date === date && Number.isFinite(count) && count > 0
                ? Math.min(24, Math.round(count))
                : 0,
        lastSentAtByDomain: normalizeLastSent(
            source.lastSentAtByDomain
        ),
        snoozedUntil:
            typeof source.snoozedUntil === "string"
                ? source.snoozedUntil
                : null,
    };
}

export function loadNudgeState(userId, now = new Date()) {
    const storage = getStorage();

    if (!storage) return normalizeNudgeState(null, now);

    try {
        const raw = storage.getItem(getStorageKey(userId));
        return normalizeNudgeState(
            raw ? JSON.parse(raw) : null,
            now
        );
    } catch {
        return normalizeNudgeState(null, now);
    }
}

export function saveNudgeState(userId, state, now = new Date()) {
    const storage = getStorage();

    if (!storage) return false;

    try {
        storage.setItem(
            getStorageKey(userId),
            JSON.stringify(normalizeNudgeState(state, now))
        );
        return true;
    } catch {
        return false;
    }
}

export function recordNudgeSent(userId, domain, now = new Date()) {
    const state = loadNudgeState(userId, now);
    const next = {
        ...state,
        count: state.count + 1,
        lastSentAtByDomain: {
            ...state.lastSentAtByDomain,
            [domain]: now.toISOString(),
        },
    };

    saveNudgeState(userId, next, now);

    return next;
}

export function snoozeNudges(userId, minutes = 90, now = new Date()) {
    const state = loadNudgeState(userId, now);
    const next = {
        ...state,
        snoozedUntil: new Date(
            now.getTime() + minutes * 60 * 1000
        ).toISOString(),
    };

    saveNudgeState(userId, next, now);

    return next;
}

export function clearNudgeState(userId) {
    const storage = getStorage();

    if (!storage) return false;

    try {
        storage.removeItem(getStorageKey(userId));
        return true;
    } catch {
        return false;
    }
}

export { getStorageKey as getNudgeStorageKey };
