const STORAGE_KEY = "sproutly.demo-clock.v1";
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DEMO_CLOCK_EVENT = "sproutly:demo-clock";

function getStorage() {
    if (typeof window === "undefined") return null;

    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function toTimeString(value) {
    if (value instanceof Date) {
        const hours = String(value.getHours()).padStart(2, "0");
        const minutes = String(value.getMinutes()).padStart(2, "0");

        return `${hours}:${minutes}`;
    }

    return typeof value === "string" ? value : "";
}

function toDateString(value) {
    if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    return typeof value === "string" && DATE_PATTERN.test(value)
        ? value
        : null;
}

function toStoredState(value, current = null) {
    const source =
        value && typeof value === "object" && !(value instanceof Date)
            ? value
            : { time: value };
    const time = toTimeString(source.time);

    if (!TIME_PATTERN.test(time)) return null;

    let date;

    if (source.date === undefined) {
        date = current?.date ?? null;
    } else if (source.date === null || source.date === "") {
        date = null;
    } else {
        date = toDateString(source.date);

        if (!date) return null;
    }

    return { time, date };
}

function emitChange() {
    if (typeof window === "undefined") return;

    try {
        window.dispatchEvent(new Event(DEMO_CLOCK_EVENT));
    } catch {
        // The clock still applies for this session.
    }
}

export function getDemoClock() {
    const storage = getStorage();

    if (!storage) return null;

    try {
        const raw = storage.getItem(STORAGE_KEY);
        const state = raw ? JSON.parse(raw) : null;

        if (
            state?.enabled !== true ||
            !TIME_PATTERN.test(String(state.time ?? ""))
        ) {
            return null;
        }

        return {
            enabled: true,
            time: state.time,
            date:
                typeof state.date === "string" &&
                DATE_PATTERN.test(state.date)
                    ? state.date
                    : null,
            updatedAt:
                typeof state.updatedAt === "string"
                    ? state.updatedAt
                    : null,
        };
    } catch {
        return null;
    }
}

export function isDemoClockEnabled() {
    return getDemoClock() !== null;
}

export function setDemoClock(value, date) {
    if (value === null || value === undefined) {
        return clearDemoClock();
    }

    const current = getDemoClock();
    const state = toStoredState(
        date === undefined ? value : { time: value, date },
        current
    );

    if (!state) return false;

    const storage = getStorage();

    if (!storage) return false;

    try {
        storage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                enabled: true,
                time: state.time,
                date: state.date,
                updatedAt: new Date().toISOString(),
            })
        );
    } catch {
        return false;
    }

    emitChange();

    return true;
}

export function clearDemoClock() {
    const storage = getStorage();

    if (!storage) return false;

    try {
        storage.removeItem(STORAGE_KEY);
    } catch {
        return false;
    }

    emitChange();

    return true;
}

export function getNow(reference = new Date()) {
    const base =
        reference instanceof Date
            ? new Date(reference.getTime())
            : new Date(reference);
    const demo = getDemoClock();

    if (!demo) return base;

    if (demo.date) {
        const [year, month, day] = demo.date.split("-").map(Number);

        base.setFullYear(year, month - 1, day);
    }

    const [hours, minutes] = demo.time.split(":").map(Number);

    base.setHours(hours, minutes, 0, 0);

    return base;
}

export function subscribeDemoClock(listener) {
    if (typeof window === "undefined") return () => {};

    window.addEventListener(DEMO_CLOCK_EVENT, listener);

    return () => {
        window.removeEventListener(DEMO_CLOCK_EVENT, listener);
    };
}
