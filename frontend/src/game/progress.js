import { getActivityReward } from "./data";
import {
    getActionableDay,
    getDayResolution,
    isDayResolved,
    isSlotResolved,
} from "../services/planEngine";

export const SLOT_ORDER = ["primary", "secondary"];

export function getRewardKey(planId, dayId, slot) {
    return `${planId}:${dayId}:${slot}`;
}

export function getDaySlots(day) {
    if (!day) return [];

    return SLOT_ORDER.filter((slot) => Boolean(day[slot])).map((slot) => ({
        slot,
        entry: day[slot],
    }));
}

export function isEntryResolved(entry) {
    return isSlotResolved(entry);
}

export function getDayProgress(day) {
    return getDayResolution(day);
}

export function getVillageProgress(plan) {
    const days = plan?.days ?? [];
    const actionable = getActionableDay(plan);
    const currentIndex = actionable
        ? days.findIndex((day) => day.id === actionable.id)
        : -1;

    const statuses = days.map((day, index) => {
        const progress = getDayProgress(day);

        if (currentIndex === -1) {
            return {
                ...progress,
                index,
                status: isDayResolved(day) ? "completed" : "optional",
            };
        }

        if (index === currentIndex) {
            return { ...progress, index, status: "current" };
        }

        return {
            ...progress,
            index,
            status:
                index < currentIndex
                    ? progress.complete
                        ? "completed"
                        : "optional"
                    : "locked",
        };
    });

    return {
        days: statuses,
        currentIndex,
        currentDayId: currentIndex === -1 ? null : days[currentIndex].id,
        currentDayNumber: currentIndex === -1 ? days.length : currentIndex + 1,
        completedCount: statuses.filter((day) => day.status === "completed")
            .length,
        total: days.length,
        allComplete: days.length > 0 && days.every(isDayResolved),
    };
}

export function getUnlockedDays(plan) {
    return getVillageProgress(plan).days.filter(
        (day) => day.status !== "locked"
    );
}

export function getPendingRewards(village, plan) {
    const planId = plan?.id ?? village?.planId ?? "journey";
    const claimed = village?.claimedRewards ?? {};
    const rewards = [];

    for (const dayStatus of getUnlockedDays(plan)) {
        const day = plan.days[dayStatus.index];

        for (const { slot, entry } of getDaySlots(day)) {
            if (entry.status !== "completed") continue;

            const key = getRewardKey(planId, day.id, slot);

            if (claimed[key]) continue;

            rewards.push({
                key,
                dayId: day.id,
                slot,
                domain: entry.domain,
                title: entry.title,
                reward: getActivityReward(entry, slot),
            });
        }
    }

    return rewards;
}

export function getPendingRewardTotals(village, plan) {
    const items = getPendingRewards(village, plan);
    const resources = {};

    for (const item of items) {
        for (const [resource, amount] of Object.entries(item.reward)) {
            resources[resource] = (resources[resource] ?? 0) + amount;
        }
    }

    return {
        count: items.length,
        resources,
        items,
    };
}
