import { isReminderState } from "./reengagement";

const STORAGE_PREFIX = "sproutly.reminders.v1";
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const REMINDER_CHANNELS = {
    IN_APP: "in_app",
    BROWSER: "browser",
};

export const REMINDER_CADENCES = {
    DAILY: "daily",
    TWICE_DAILY: "twice_daily",
};

export const DEFAULT_REMINDER_PREFERENCES = {
    enabled: false,
    cadence: REMINDER_CADENCES.DAILY,
    channel: REMINDER_CHANNELS.IN_APP,
    quietHours: {
        start: "21:00",
        end: "08:00",
    },
};

function normalizeTime(value, fallback) {
    return typeof value === "string" && TIME_PATTERN.test(value)
        ? value
        : fallback;
}

export function normalizeReminderPreferences(value) {
    const source = value ?? {};
    const quietHours = source.quietHours ?? {};

    return {
        enabled: source.enabled === true,
        cadence:
            source.cadence === REMINDER_CADENCES.TWICE_DAILY
                ? REMINDER_CADENCES.TWICE_DAILY
                : REMINDER_CADENCES.DAILY,
        channel:
            source.channel === REMINDER_CHANNELS.BROWSER
                ? REMINDER_CHANNELS.BROWSER
                : REMINDER_CHANNELS.IN_APP,
        quietHours: {
            start: normalizeTime(
                quietHours.start,
                DEFAULT_REMINDER_PREFERENCES.quietHours.start
            ),
            end: normalizeTime(
                quietHours.end,
                DEFAULT_REMINDER_PREFERENCES.quietHours.end
            ),
        },
    };
}

export function getCadenceMinutes(cadence) {
    return cadence === REMINDER_CADENCES.TWICE_DAILY ? 12 * 60 : 24 * 60;
}

function toMinutes(value) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
}

export function isWithinQuietHours(now, quietHours) {
    const normalized = normalizeReminderPreferences({
        quietHours,
    }).quietHours;
    const start = toMinutes(normalized.start);
    const end = toMinutes(normalized.end);
    const minutes = now.getHours() * 60 + now.getMinutes();

    if (start === end) return false;
    if (start < end) return minutes >= start && minutes < end;

    return minutes >= start || minutes < end;
}

function hasCadenceElapsed(lastSentAt, cadence, now) {
    if (!lastSentAt) return true;

    const last = Date.parse(lastSentAt);
    if (!Number.isFinite(last)) return true;

    return (
        now.getTime() - last >=
        getCadenceMinutes(cadence) * 60 * 1000
    );
}

export function getReminderStorageKey(userId) {
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

export function loadReminderState(userId) {
    const storage = getStorage();

    if (!storage) return { lastSentAt: null };

    try {
        const raw = storage.getItem(getReminderStorageKey(userId));
        const state = raw ? JSON.parse(raw) : null;

        return {
            lastSentAt:
                typeof state?.lastSentAt === "string"
                    ? state.lastSentAt
                    : null,
        };
    } catch {
        return { lastSentAt: null };
    }
}

export function saveReminderState(userId, state) {
    const storage = getStorage();

    if (!storage) return false;

    try {
        storage.setItem(
            getReminderStorageKey(userId),
            JSON.stringify({
                lastSentAt:
                    typeof state?.lastSentAt === "string"
                        ? state.lastSentAt
                        : null,
            })
        );
        return true;
    } catch {
        return false;
    }
}

export function clearReminderState(userId) {
    const storage = getStorage();

    if (!storage) return false;

    try {
        storage.removeItem(getReminderStorageKey(userId));
        return true;
    } catch {
        return false;
    }
}

export function getNotificationSupport(globalObject = globalThis) {
    const NotificationConstructor = globalObject?.Notification;
    const supported =
        typeof NotificationConstructor === "function";

    return {
        supported,
        permission: supported
            ? NotificationConstructor.permission ?? "default"
            : "unsupported",
    };
}

export async function requestNotificationPermission(
    globalObject = globalThis
) {
    const support = getNotificationSupport(globalObject);

    if (!support.supported) return "unsupported";

    try {
        return await globalObject.Notification.requestPermission();
    } catch {
        return "denied";
    }
}

export function sendBrowserNotification({
    title,
    body,
    tag = "sproutly-reminder",
    globalObject = globalThis,
} = {}) {
    const support = getNotificationSupport(globalObject);

    if (!support.supported || support.permission !== "granted") {
        return false;
    }

    try {
        new globalObject.Notification(title, {
            body,
            tag,
            silent: true,
        });
        return true;
    } catch {
        return false;
    }
}

export function getReminderDecision({
    preferences,
    state,
    now = new Date(),
    lastSentAt = null,
    permission = "default",
    supported = true,
} = {}) {
    const normalized = normalizeReminderPreferences(preferences);

    if (!normalized.enabled || !isReminderState(state)) {
        return { shouldShow: false, channel: "none" };
    }

    if (isWithinQuietHours(now, normalized.quietHours)) {
        return { shouldShow: false, channel: "none" };
    }

    if (
        !hasCadenceElapsed(lastSentAt, normalized.cadence, now)
    ) {
        return { shouldShow: false, channel: "none" };
    }

    const browserReady =
        normalized.channel === REMINDER_CHANNELS.BROWSER &&
        supported &&
        permission === "granted";

    return {
        shouldShow: true,
        channel: browserReady
            ? REMINDER_CHANNELS.BROWSER
            : REMINDER_CHANNELS.IN_APP,
    };
}
