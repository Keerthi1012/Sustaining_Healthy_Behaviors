import {
    getCompletedEntries,
    getPlannedEntries,
    getRestedEntries,
} from "./planEngine";
import { toDateKey } from "../utils/date";

export function getMeasurement(plan, activities = []) {
    const planned = getPlannedEntries(plan);
    const completed = getCompletedEntries(plan);
    const rested = getRestedEntries(plan);
    const eligibleCount = Math.max(0, planned.length - rested.length);
    const persistence = eligibleCount
        ? Math.round((completed.length / eligibleCount) * 100)
        : 0;
    const movementEntries = completed.filter(
        (entry) => entry.domain === "movement"
    );
    const sleepEntries = completed.filter((entry) => entry.domain === "sleep");
    const movementMinutes = movementEntries.reduce(
        (total, entry) => total + (entry.dose ?? 0),
        0
    );
    const syncedMinutes = activities.reduce(
        (total, activity) => total + (activity.duration_minutes ?? 0),
        0
    );
    const activeDays = new Set(
        completed.map((entry) => toDateKey(entry.completedAt))
    ).size;
    const restedDays = new Set(
        rested.map((entry) => toDateKey(entry.restedAt))
    ).size;
    const returnCount = (plan.adaptations ?? []).filter(
        (adaptation) => adaptation.type === "return"
    ).length;
    const smallerSteps = (plan.adaptations ?? []).filter(
        (adaptation) => adaptation.type === "smaller"
    ).length;

    return {
        persistence,
        completedCount: completed.length,
        plannedCount: planned.length,
        eligibleCount,
        restedCount: rested.length,
        restedDays,
        activeDays,
        movementMinutes,
        sleepActions: sleepEntries.length,
        syncedMinutes,
        returnCount,
        smallerSteps,
        returnedAfterPause: returnCount > 0,
        lastCompletedAt: completed
            .map((entry) => entry.completedAt)
            .sort()
            .at(-1) ?? null,
        lastRestedAt: rested
            .map((entry) => entry.restedAt)
            .sort()
            .at(-1) ?? null,
    };
}
