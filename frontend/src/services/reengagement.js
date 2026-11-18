import { toDateKey } from "../utils/date";
import {
    getActionableDay,
    getLapseInfo,
    getOptionalActionableStep,
} from "./planEngine";

export const REENGAGEMENT_STATES = {
    ON_TRACK: "on-track",
    SLIPPING: "slipping",
    LAPSED: "lapsed",
    PAUSED: "paused",
};

export const LAPSE_THRESHOLD_DAYS = 3;

const EMPTY_STATE = {
    state: REENGAGEMENT_STATES.ON_TRACK,
    daysSinceLastComplete: 0,
    missedCount: 0,
    smallerStepOffered: false,
    lapseThresholdDays: LAPSE_THRESHOLD_DAYS,
};

function hasUsablePlan(plan) {
    return Boolean(plan) && Array.isArray(plan.days) && plan.days.length > 0;
}

function getDaysSinceLastComplete(plan, todayKey) {
    if (!hasUsablePlan(plan)) return 0;

    return Math.max(0, getLapseInfo(plan, todayKey).daysSinceLastComplete);
}

export function getReengagementState(plan, todayKey = toDateKey()) {
    if (!hasUsablePlan(plan)) {
        return { ...EMPTY_STATE };
    }

    const lapse = getLapseInfo(plan, todayKey);
    const daysSinceLastComplete = Math.max(
        0,
        lapse.daysSinceLastComplete
    );

    if (plan.paused) {
        return {
            ...EMPTY_STATE,
            state: REENGAGEMENT_STATES.PAUSED,
            daysSinceLastComplete,
            missedCount: lapse.missedCount,
        };
    }

    if (
        lapse.needsReturn ||
        daysSinceLastComplete >= LAPSE_THRESHOLD_DAYS
    ) {
        return {
            ...EMPTY_STATE,
            state: REENGAGEMENT_STATES.LAPSED,
            daysSinceLastComplete,
            missedCount: lapse.missedCount,
        };
    }

    if (daysSinceLastComplete >= 1 || lapse.missedCount > 0) {
        return {
            ...EMPTY_STATE,
            state: REENGAGEMENT_STATES.SLIPPING,
            daysSinceLastComplete,
            missedCount: lapse.missedCount,
            smallerStepOffered: Boolean(
                getActionableDay(plan) ||
                    getOptionalActionableStep(plan)
            ),
        };
    }

    return {
        ...EMPTY_STATE,
        missedCount: lapse.missedCount,
    };
}

export function getReengagementMessageKey(state) {
    switch (state) {
        case REENGAGEMENT_STATES.SLIPPING:
            return "world.reengagement.slipping.body";
        case REENGAGEMENT_STATES.LAPSED:
            return "world.reengagement.lapsed.body";
        case REENGAGEMENT_STATES.PAUSED:
            return "world.reengagement.paused.body";
        default:
            return "world.reengagement.onTrack.body";
    }
}

export function isReminderState(state) {
    return (
        state === REENGAGEMENT_STATES.SLIPPING ||
        state === REENGAGEMENT_STATES.LAPSED
    );
}

export { getDaysSinceLastComplete };
