import { toDateKey } from "../utils/date";

const STORAGE_PREFIX = "sproutly.arrival.v1";
const MAX_ENTRIES = 30;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

export function normalizeArrivalEntry(value, now = new Date()) {
    if (!value || typeof value !== "object") return null;

    const skipped = value.skipped === true;
    const mood =
        typeof value.mood === "string" && value.mood ? value.mood : null;

    if (!mood && !skipped) return null;

    return {
        date:
            typeof value.date === "string" &&
            DATE_PATTERN.test(value.date)
                ? value.date
                : toDateKey(now),
        skipped,
        mood,
        time: Number.isFinite(Number(value.time))
            ? Number(value.time)
            : null,
        weather:
            typeof value.weather === "string" ? value.weather : null,
        applied:
            value.applied && typeof value.applied === "object"
                ? {
                      dayId: value.applied.dayId ?? null,
                      slot: value.applied.slot ?? null,
                      beforeDose: Number(value.applied.beforeDose) || 0,
                      afterDose: Number(value.applied.afterDose) || 0,
                      beforeLabel:
                          typeof value.applied.beforeLabel === "string"
                              ? value.applied.beforeLabel
                              : "",
                      afterLabel:
                          typeof value.applied.afterLabel === "string"
                              ? value.applied.afterLabel
                              : "",
                  }
                : null,
        updatedAt:
            typeof value.updatedAt === "string"
                ? value.updatedAt
                : now.toISOString(),
    };
}

export function loadArrivalHistory(userId, now = new Date()) {
    const storage = getStorage();

    if (!storage) return [];

    try {
        const raw = storage.getItem(getStorageKey(userId));
        const state = raw ? JSON.parse(raw) : null;
        const entries = Array.isArray(state?.entries)
            ? state.entries
            : [];

        return entries
            .map((entry) => normalizeArrivalEntry(entry, now))
            .filter(Boolean)
            .slice(0, MAX_ENTRIES);
    } catch {
        return [];
    }
}

export function getArrivalEntry(userId, dateKey = toDateKey()) {
    return (
        loadArrivalHistory(userId).find(
            (entry) => entry.date === dateKey
        ) ?? null
    );
}

export function saveArrivalEntry(userId, patch = {}, now = new Date()) {
    const entry = normalizeArrivalEntry(
        { ...patch, date: patch.date ?? toDateKey(now) },
        now
    );

    if (!entry) return null;

    const storage = getStorage();

    if (!storage) return entry;

    const history = loadArrivalHistory(userId, now).filter(
        (item) => item.date !== entry.date
    );

    try {
        storage.setItem(
            getStorageKey(userId),
            JSON.stringify({
                version: 1,
                entries: [entry, ...history].slice(0, MAX_ENTRIES),
            })
        );
    } catch {
        // The arrival check-in still applies for this session.
    }

    return entry;
}

export function isArrivalDone(userId, dateKey = toDateKey()) {
    return getArrivalEntry(userId, dateKey) !== null;
}

export function clearArrivalHistory(userId) {
    const storage = getStorage();

    if (!storage) return false;

    try {
        storage.removeItem(getStorageKey(userId));
        return true;
    } catch {
        return false;
    }
}

export { getStorageKey as getArrivalStorageKey };
