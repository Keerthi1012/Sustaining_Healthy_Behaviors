const SLOTS = ["primary", "secondary"];
const COMFORTABLE_DIFFICULTIES = ["easy", "comfortable"];
const CHALLENGING_DIFFICULTIES = [
    "difficult",
    "too_much",
    "uncomfortable",
];
export const ENJOYMENT_VALUES = ["not_for_me", "okay", "loved"];
export const ENJOYMENT_SCORES = {
    not_for_me: 0,
    okay: 1,
    loved: 2,
};
export const GENTLER_BARRIERS = [
    "Low energy",
    "Discomfort or pain",
    "Hot weather",
];

export function normalizeEnjoyment(value) {
    return ENJOYMENT_VALUES.includes(value) ? value : null;
}

function isRealBarrier(barrier) {
    return Boolean(barrier) && barrier !== "Nothing in particular";
}

function isSafetyConcern(record) {
    return record.safety !== "none";
}

function isEnjoyed(record) {
    return record.enjoyment === "loved";
}

function isNotForMe(record) {
    return record.enjoyment === "not_for_me";
}

function isComfortable(record) {
    return (
        record.status === "completed" &&
        !isSafetyConcern(record) &&
        COMFORTABLE_DIFFICULTIES.includes(record.difficulty)
    );
}

function isChallenging(record) {
    return (
        record.status === "paused" ||
        isSafetyConcern(record) ||
        CHALLENGING_DIFFICULTIES.includes(record.difficulty) ||
        GENTLER_BARRIERS.includes(record.barrier)
    );
}

function timeValue(record) {
    const parsed = Date.parse(record.recordedAt ?? "");
    if (Number.isFinite(parsed)) {
        return parsed;
    }

    return record.dayIndex * 1000 + record.slotIndex;
}

function compareRecords(left, right) {
    return (
        timeValue(right) - timeValue(left) ||
        right.dayIndex - left.dayIndex ||
        right.slotIndex - left.slotIndex
    );
}

function collectResolved(plan) {
    const days = Array.isArray(plan?.days) ? plan.days : [];
    const records = [];

    days.forEach((day, dayIndex) => {
        SLOTS.forEach((slot, slotIndex) => {
            const entry = day?.[slot];

            if (!entry?.feedback) return;
            if (entry.status !== "completed" && entry.status !== "paused") {
                return;
            }

            records.push({
                dayId: day.id,
                slot,
                dayIndex,
                slotIndex,
                actionId: entry.id,
                habitId: entry.habitId ?? entry.id,
                domain: entry.domain,
                title: entry.title,
                status: entry.status,
                difficulty: entry.feedback.difficulty ?? "difficult",
                barrier: entry.feedback.barrier ?? null,
                safety: entry.feedback.safety ?? "none",
                enjoyment: normalizeEnjoyment(entry.feedback.enjoyment),
                recordedAt: entry.completedAt ?? null,
            });
        });
    });

    return records;
}

function topEntry(counts) {
    const entries = Object.entries(counts);

    if (!entries.length) {
        return null;
    }

    entries.sort(
        (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
    );

    return { key: entries[0][0], count: entries[0][1] };
}

function buildActionLedger(records) {
    const byAction = new Map();

    records.forEach((record) => {
        const key =
            record.actionId ??
            record.habitId ??
            `${record.domain ?? "unknown"}:${record.title ?? "unknown"}`;
        let item = byAction.get(key);

        if (!item) {
            item = {
                actionId: record.actionId ?? key,
                habitId: record.habitId ?? null,
                domain: record.domain ?? null,
                title: record.title ?? null,
                completed: 0,
                paused: 0,
                effective: 0,
                challenging: 0,
                safetyPauses: 0,
                enjoyed: 0,
                notForMe: 0,
                enjoymentTotal: 0,
                enjoymentCaptured: 0,
                barriers: {},
                lastRecord: null,
            };
            byAction.set(key, item);
        }

        if (record.status === "paused") {
            item.paused += 1;
        } else {
            item.completed += 1;
        }

        if (isComfortable(record)) item.effective += 1;
        if (isChallenging(record)) item.challenging += 1;
        if (isSafetyConcern(record)) item.safetyPauses += 1;
        if (isEnjoyed(record)) item.enjoyed += 1;
        if (isNotForMe(record)) item.notForMe += 1;
        if (record.enjoyment) {
            item.enjoymentCaptured += 1;
            item.enjoymentTotal += ENJOYMENT_SCORES[record.enjoyment];
        }
        if (isRealBarrier(record.barrier)) {
            item.barriers[record.barrier] =
                (item.barriers[record.barrier] ?? 0) + 1;
        }
        if (!item.lastRecord || compareRecords(record, item.lastRecord) < 0) {
            item.lastRecord = record;
        }
    });

    return Array.from(byAction.values())
        .map((item) => {
            const resolved = item.completed + item.paused;
            const barrier = topEntry(item.barriers);

            return {
                actionId: item.actionId,
                habitId: item.habitId,
                domain: item.domain,
                title: item.title,
                completed: item.completed,
                paused: item.paused,
                resolved,
                effective: item.effective,
                challenging: item.challenging,
                safetyPauses: item.safetyPauses,
                enjoyed: item.enjoyed,
                notForMe: item.notForMe,
                enjoymentCaptured: item.enjoymentCaptured,
                enjoymentRate: item.enjoymentCaptured
                    ? Math.round(
                          (item.enjoymentTotal /
                              (item.enjoymentCaptured * 2)) *
                              100
                      )
                    : 0,
                comfortRate: resolved
                    ? Math.round((item.effective / resolved) * 100)
                    : 0,
                topBarrier: barrier?.key ?? null,
                lastDifficulty: item.lastRecord?.difficulty ?? null,
                lastRecordedAt: item.lastRecord?.recordedAt ?? null,
            };
        })
        .sort(
            (left, right) =>
                right.effective - left.effective ||
                right.resolved - left.resolved ||
                left.actionId.localeCompare(right.actionId)
        );
}

function getGuidance(recent) {
    if (!recent.length) {
        return "steady";
    }

    if (recent.some(isSafetyConcern)) {
        return "hold";
    }

    const challenging = recent.filter(isChallenging).length;
    const comfortable = recent.filter(isComfortable).length;

    if (challenging >= 2) {
        return "gentler";
    }

    if (comfortable >= 2 && challenging === 0) {
        return "increase";
    }

    return "steady";
}

function buildInsight(plan, records, options = {}) {
    const lookback = options.lookback ?? 3;
    const recent = getRecentFeedback(plan, { lookback });
    const barriers = {};

    records.forEach((record) => {
        if (isRealBarrier(record.barrier)) {
            barriers[record.barrier] = (barriers[record.barrier] ?? 0) + 1;
        }
    });

    const actions = buildActionLedger(records);
    const topAction = actions[0] ?? null;
    const barrier = topEntry(barriers);
    const totalResolved = records.length;
    const effectiveCount = records.filter(isComfortable).length;
    const enjoymentCaptured = records.filter(
        (record) => record.enjoyment
    ).length;
    const enjoymentTotal = records.reduce(
        (total, record) =>
            total + (ENJOYMENT_SCORES[record.enjoyment] ?? 0),
        0
    );

    return {
        hasData: totalResolved > 0,
        totalResolved,
        completedCount: records.filter(
            (record) => record.status === "completed"
        ).length,
        pausedCount: records.filter((record) => record.status === "paused")
            .length,
        safetyPauses: records.filter(isSafetyConcern).length,
        effectiveCount,
        challengingCount: records.filter(isChallenging).length,
        comfortRate: totalResolved
            ? Math.round((effectiveCount / totalResolved) * 100)
            : 0,
        enjoymentCaptured,
        enjoyedCount: records.filter(isEnjoyed).length,
        notForMeCount: records.filter(isNotForMe).length,
        enjoymentRate: enjoymentCaptured
            ? Math.round(
                  (enjoymentTotal / (enjoymentCaptured * 2)) * 100
              )
            : 0,
        topAction,
        topBarrier: barrier
            ? { barrier: barrier.key, count: barrier.count }
            : null,
        recentDifficulty: recent[0]?.difficulty ?? null,
        guidance: getGuidance(recent),
        sampleSize: recent.length,
    };
}

export function getRecentFeedback(plan, options = {}) {
    const {
        domain = null,
        lookback = 5,
        excludeDayId = null,
        excludeSlot = null,
    } = options;

    return collectResolved(plan)
        .filter((record) => !domain || record.domain === domain)
        .filter(
            (record) =>
                !(
                    record.dayId === excludeDayId &&
                    record.slot === excludeSlot
                )
        )
        .sort(compareRecords)
        .slice(0, Math.max(0, lookback));
}

export function getAggregateFeedbackAdjustment(plan, options = {}) {
    const recent = getRecentFeedback(plan, {
        ...options,
        lookback: options.lookback ?? 3,
    });
    const direction = getGuidance(recent);
    const reasonCode =
        direction === "gentler"
            ? "recent_challenge"
            : direction === "hold"
              ? "recent_safety"
              : direction === "increase"
                ? "recent_comfort"
                : recent.length
                  ? "mixed_recent"
                  : "no_history";

    return {
        direction,
        reasonCode,
        sampleSize: recent.length,
    };
}

export function getLearningSummary(plan, options = {}) {
    const records = collectResolved(plan);

    return {
        insight: buildInsight(plan, records, options),
        actions: buildActionLedger(records),
    };
}

export function getLearningInsight(plan, options = {}) {
    return getLearningSummary(plan, options).insight;
}

export function getActionLedger(plan) {
    return getLearningSummary(plan).actions;
}
