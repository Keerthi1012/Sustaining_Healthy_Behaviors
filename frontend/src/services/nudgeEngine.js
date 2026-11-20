import { toDateKey } from "../utils/date";
import { isWithinQuietHours } from "./reminderService";
import {
    REALM_DOMAINS,
    findActiveWindow,
    fromMinutes,
    getActiveSchedule,
    getWindowPosition,
    isWithinWindow,
    normalizeSchedule,
    toMinutes,
} from "./realmSchedule";

export const NUDGE_REASONS = {
    DISABLED: "disabled",
    NO_PLAN: "no_plan",
    PAUSED: "paused",
    SAFETY_PAUSE: "safety_pause",
    SNOOZED: "snoozed",
    QUIET_HOURS: "quiet_hours",
    DAILY_CAP: "daily_cap",
    NO_OPEN_MOMENT: "no_open_moment",
    COOLDOWN: "cooldown",
    OUTSIDE_WINDOW: "outside_window",
};

export const NUDGE_INTENSITIES = {
    GENTLE: "gentle",
    TIMELY: "timely",
    CLOSING: "closing",
};

const SLOT_ORDER = ["primary", "secondary"];

function rejection(reason) {
    return { show: false, reason };
}

function parseTimestamp(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const timestamp =
        value instanceof Date ? value.getTime() : Date.parse(value);

    return Number.isFinite(timestamp) ? timestamp : null;
}

export function getOpenMoments(plan, now = new Date(), dateKey = null) {
    if (!plan || !Array.isArray(plan.days)) return [];

    const todayKey = dateKey ?? toDateKey(now);
    const moments = [];

    plan.days.forEach((day) => {
        if (
            !day ||
            typeof day.date !== "string" ||
            day.date > todayKey ||
            (dateKey && day.date !== dateKey)
        ) {
            return;
        }

        SLOT_ORDER.forEach((slot, slotIndex) => {
            const entry = day[slot];

            if (
                !entry ||
                entry.status !== "planned" ||
                !entry.domain
            ) {
                return;
            }

            moments.push({
                domain: entry.domain,
                dayId: day.id,
                slot,
                slotIndex,
                date: day.date,
            });
        });
    });

    return moments.sort(
        (left, right) =>
            left.date.localeCompare(right.date) ||
            left.slotIndex - right.slotIndex
    );
}

export function getCompletedDomainsToday(plan, now = new Date(), dateKey = null) {
    const completed = new Set();

    if (!plan || !Array.isArray(plan.days)) return completed;

    const todayKey = dateKey ?? toDateKey(now);

    plan.days.forEach((day) => {
        if (!day || day.date !== todayKey) return;

        SLOT_ORDER.forEach((slot) => {
            const entry = day[slot];

            if (
                (entry?.status === "completed" ||
                    entry?.status === "rested") &&
                entry.domain
            ) {
                completed.add(entry.domain);
            }
        });
    });

    return completed;
}

export function getNudgeIntensity(progress) {
    if (!Number.isFinite(progress) || progress < 0.4) {
        return NUDGE_INTENSITIES.GENTLE;
    }

    if (progress < 0.75) {
        return NUDGE_INTENSITIES.TIMELY;
    }

    return NUDGE_INTENSITIES.CLOSING;
}

export function distanceToWindowMidpoint(window, now) {
    const start = toMinutes(window?.start);
    const end = toMinutes(window?.end);

    if (start === null || end === null || start === end) {
        return Number.POSITIVE_INFINITY;
    }

    const length = (end - start + 1440) % 1440 || 1440;
    const midpoint = (start + length / 2) % 1440;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const difference = Math.abs(minutes - midpoint);

    return Math.min(difference, 1440 - difference);
}

export function isCoolingDown(lastSentAt, minGapMinutes, now) {
    const timestamp = parseTimestamp(lastSentAt);

    if (timestamp === null) return false;

    return now.getTime() - timestamp < minGapMinutes * 60 * 1000;
}

function isSnoozed(snoozedUntil, now) {
    const timestamp = parseTimestamp(snoozedUntil);

    return timestamp !== null && timestamp > now.getTime();
}

export function getNudgeDecision({
    now = new Date(),
    schedule,
    plan,
    enabled = true,
    preferredChannel = "in_app",
    permission = "default",
    supported = true,
    lastSentAtByDomain = {},
    sentCountToday = 0,
    snoozedUntil = null,
    quietHours,
    dateKey = null,
} = {}) {
    if (!enabled) {
        return rejection(NUDGE_REASONS.DISABLED);
    }

    if (!plan || !Array.isArray(plan.days) || !plan.days.length) {
        return rejection(NUDGE_REASONS.NO_PLAN);
    }

    if (plan.paused) {
        return rejection(NUDGE_REASONS.PAUSED);
    }

    if (plan.safetyPause) {
        return rejection(NUDGE_REASONS.SAFETY_PAUSE);
    }

    if (isSnoozed(snoozedUntil, now)) {
        return rejection(NUDGE_REASONS.SNOOZED);
    }

    const normalized = normalizeSchedule(schedule);
    const active = getActiveSchedule(normalized, now);
    const resolvedQuietHours = quietHours ?? normalized.quietHours;

    if (isWithinQuietHours(now, resolvedQuietHours)) {
        return rejection(NUDGE_REASONS.QUIET_HOURS);
    }

    if (sentCountToday >= normalized.maxPerDay) {
        return rejection(NUDGE_REASONS.DAILY_CAP);
    }

    const moments = getOpenMoments(plan, now, dateKey);

    if (!moments.length) {
        return rejection(NUDGE_REASONS.NO_OPEN_MOMENT);
    }

    const completedDomains = getCompletedDomainsToday(
        plan,
        now,
        dateKey
    );
    const candidates = [];
    let sawCooldown = false;

    moments.forEach((moment) => {
        if (completedDomains.has(moment.domain)) return;

        const window = findActiveWindow(
            active.windows,
            moment.domain,
            now
        );

        if (!window) return;

        if (
            isCoolingDown(
                lastSentAtByDomain?.[moment.domain],
                normalized.minGapMinutes,
                now
            )
        ) {
            sawCooldown = true;
            return;
        }

        candidates.push({
            ...moment,
            window,
            score: distanceToWindowMidpoint(window, now),
        });
    });

    if (!candidates.length) {
        return rejection(
            sawCooldown
                ? NUDGE_REASONS.COOLDOWN
                : NUDGE_REASONS.OUTSIDE_WINDOW
        );
    }

    candidates.sort(
        (left, right) =>
            left.score - right.score ||
            left.date.localeCompare(right.date) ||
            left.slotIndex - right.slotIndex
    );

    const chosen = candidates[0];
    const progress = getWindowPosition(chosen.window, now);
    const intensity = getNudgeIntensity(progress);
    const channel =
        preferredChannel === "browser" &&
        supported &&
        permission === "granted"
            ? "browser"
            : "in_app";

    return {
        show: true,
        reason: "ready",
        domain: chosen.domain,
        shift: active.shift,
        window: { ...chosen.window },
        moment: {
            dayId: chosen.dayId,
            slot: chosen.slot,
            date: chosen.date,
        },
        intensity,
        copyBase: `nudges.${chosen.domain}.${intensity}`,
        channel,
    };
}

function getPlanDomains(plan) {
    const domains = new Set();

    (plan?.days ?? []).forEach((day) => {
        SLOT_ORDER.forEach((slot) => {
            const entry = day?.[slot];

            if (entry?.domain) {
                domains.add(entry.domain);
            }
        });
    });

    return REALM_DOMAINS.filter((domain) => domains.has(domain));
}

function getDomainMidpointTime(window) {
    const start = toMinutes(window?.start);
    const end = toMinutes(window?.end);

    if (start === null || end === null || start === end) {
        return null;
    }

    const length = (end - start + 1440) % 1440 || 1440;

    return fromMinutes(start + Math.floor(length / 2));
}

export function getNudgePresets({ schedule, plan, now = new Date() } = {}) {
    const active = getActiveSchedule(normalizeSchedule(schedule), now);

    return getPlanDomains(plan)
        .map((domain) => {
            const window = active.windows?.[domain]?.[0] ?? null;
            const time = getDomainMidpointTime(window);

            if (!window || !time) return null;

            return { domain, time, window: { ...window } };
        })
        .filter(Boolean);
}

export function getNudgeStatus({
    now = new Date(),
    schedule,
    plan,
    enabled = true,
    preferredChannel = "in_app",
    permission = "default",
    supported = true,
    lastSentAtByDomain = {},
    sentCountToday = 0,
    snoozedUntil = null,
    quietHours,
} = {}) {
    const normalized = normalizeSchedule(schedule);
    const active = getActiveSchedule(normalized, now);
    const resolvedQuietHours = quietHours ?? normalized.quietHours;
    const decision = getNudgeDecision({
        now,
        schedule: normalized,
        plan,
        enabled,
        preferredChannel,
        permission,
        supported,
        lastSentAtByDomain,
        sentCountToday,
        snoozedUntil,
        quietHours: resolvedQuietHours,
    });
    const completedDomains = getCompletedDomainsToday(plan, now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let next = null;

    getOpenMoments(plan, now)
        .map((moment) => moment.domain)
        .filter(
            (domain, index, list) =>
                list.indexOf(domain) === index &&
                !completedDomains.has(domain)
        )
        .forEach((domain) => {
            (active.windows?.[domain] ?? []).forEach((window) => {
                const start = toMinutes(window.start);

                if (start === null) return;

                const activeNow = isWithinWindow(now, window);
                const offset = activeNow
                    ? 0
                    : (start - nowMinutes + 1440) % 1440;

                if (!next || offset < next.offset) {
                    next = {
                        domain,
                        window: { ...window },
                        activeNow,
                        offset,
                    };
                }
            });
        });

    return {
        time: fromMinutes(nowMinutes),
        shift: active.shift,
        enabled,
        quietHours: { ...resolvedQuietHours },
        isQuietHours: isWithinQuietHours(now, resolvedQuietHours),
        count: sentCountToday,
        maxPerDay: normalized.maxPerDay,
        show: decision.show,
        reason: decision.reason,
        domain: decision.domain ?? null,
        window: decision.window ? { ...decision.window } : null,
        next: next
            ? {
                  domain: next.domain,
                  window: next.window,
                  activeNow: next.activeNow,
              }
            : null,
    };
}
