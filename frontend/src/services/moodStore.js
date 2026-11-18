import { toDateKey } from "../utils/date";

const STORAGE_PREFIX = "sproutly.mood.v1";
const MAX_ENTRIES = 60;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const MOOD_OPTIONS = [
    {
        id: "calm",
        emoji: "😌",
        labelKey: "mood.card.calm.label",
        hintKey: "mood.card.calm.hint",
        suggestionKey: "mood.suggestion.calm",
    },
    {
        id: "hopeful",
        emoji: "🌱",
        labelKey: "mood.card.hopeful.label",
        hintKey: "mood.card.hopeful.hint",
        suggestionKey: "mood.suggestion.hopeful",
    },
    {
        id: "tired",
        emoji: "😴",
        labelKey: "mood.card.tired.label",
        hintKey: "mood.card.tired.hint",
        suggestionKey: "mood.suggestion.tired",
    },
    {
        id: "heavy",
        emoji: "😔",
        labelKey: "mood.card.heavy.label",
        hintKey: "mood.card.heavy.hint",
        suggestionKey: "mood.suggestion.heavy",
    },
    {
        id: "restless",
        emoji: "🌀",
        labelKey: "mood.card.restless.label",
        hintKey: "mood.card.restless.hint",
        suggestionKey: "mood.suggestion.restless",
    },
];

export const MOOD_IDS = MOOD_OPTIONS.map((option) => option.id);

export function getMoodOption(id) {
    return MOOD_OPTIONS.find((option) => option.id === id) ?? null;
}

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

export function normalizeMoodEntry(value, now = new Date()) {
    if (!value || typeof value !== "object") return null;

    const mood = MOOD_IDS.includes(value.mood) ? value.mood : null;

    if (!mood) return null;

    return {
        date:
            typeof value.date === "string" &&
            DATE_PATTERN.test(value.date)
                ? value.date
                : toDateKey(now),
        mood,
        createdAt:
            typeof value.createdAt === "string"
                ? value.createdAt
                : now.toISOString(),
    };
}

export function loadMoodHistory(userId, now = new Date()) {
    const storage = getStorage();

    if (!storage) return [];

    try {
        const raw = storage.getItem(getStorageKey(userId));
        const state = raw ? JSON.parse(raw) : null;
        const entries = Array.isArray(state?.entries)
            ? state.entries
            : [];

        return entries
            .map((entry) => normalizeMoodEntry(entry, now))
            .filter(Boolean)
            .slice(0, MAX_ENTRIES);
    } catch {
        return [];
    }
}

export function getMoodEntry(userId, dateKey = toDateKey()) {
    return (
        loadMoodHistory(userId).find(
            (entry) => entry.date === dateKey
        ) ?? null
    );
}

export function saveMoodEntry(userId, mood, now = new Date()) {
    if (!MOOD_IDS.includes(mood)) return null;

    const entry = {
        date: toDateKey(now),
        mood,
        createdAt: now.toISOString(),
    };
    const storage = getStorage();

    if (!storage) return entry;

    const history = loadMoodHistory(userId, now).filter(
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
        // The check-in still applies for this session.
    }

    return entry;
}

export function getMoodStreak(userId, now = new Date()) {
    const history = loadMoodHistory(userId, now);
    const dates = new Set(history.map((entry) => entry.date));
    let streak = 0;
    const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    while (dates.has(toDateKey(cursor))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

export function clearMoodHistory(userId) {
    const storage = getStorage();

    if (!storage) return false;

    try {
        storage.removeItem(getStorageKey(userId));
        return true;
    } catch {
        return false;
    }
}

export { getStorageKey as getMoodStorageKey };
