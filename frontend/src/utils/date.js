export function toDateKey(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function addDays(value, amount) {
    const date = value instanceof Date ? new Date(value) : new Date(value);
    date.setDate(date.getDate() + amount);
    return date;
}

export function daysBetween(startKey, endKey) {
    const start = new Date(`${startKey}T00:00:00`);
    const end = new Date(`${endKey}T00:00:00`);
    return Math.round((end - start) / 86400000);
}

export function formatDate(dateKey, options = {}) {
    return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        ...options,
    });
}

export function isPast(dateKey, todayKey) {
    return dateKey < todayKey;
}

export function isToday(dateKey, todayKey) {
    return dateKey === todayKey;
}

export function isFuture(dateKey, todayKey) {
    return dateKey > todayKey;
}
