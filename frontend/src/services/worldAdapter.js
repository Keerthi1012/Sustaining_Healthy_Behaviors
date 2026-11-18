import { toDateKey } from "../utils/date";

export function summarizeActivities(activities = [], todayKey = toDateKey()) {
    const sorted = [...activities].sort(
        (left, right) =>
            new Date(right.started_at).getTime() -
            new Date(left.started_at).getTime()
    );
    const todayMinutes = sorted
        .filter((activity) => toDateKey(activity.started_at) === todayKey)
        .reduce(
            (total, activity) => total + (activity.duration_minutes ?? 0),
            0
        );
    const totalMinutes = sorted.reduce(
        (total, activity) => total + (activity.duration_minutes ?? 0),
        0
    );

    return {
        count: sorted.length,
        todayMinutes,
        totalMinutes,
        lastActivity: sorted[0] ?? null,
    };
}

export function activityToGrowthNote(activity) {
    if (!activity) return null;
    return `Movement history synced: ${activity.duration_minutes ?? 0} minutes recorded.`;
}
