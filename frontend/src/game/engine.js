import {
    RESOURCES,
    RESOURCE_KEYS,
    VILLAGE_VERSION,
    WELCOME_TABLE,
} from "./data";
import { getPendingRewards } from "./progress";

const LOG_LIMIT = 8;

function prependLog(log, entry) {
    return [entry, ...log].slice(0, LOG_LIMIT);
}

export function createInitialState(planId = "journey", now = new Date()) {
    const at = now.toISOString();

    return {
        version: VILLAGE_VERSION,
        planId,
        resources: {
            wood: 0,
            stone: 0,
            food: 0,
        },
        claimedRewards: {},
        log: [
            {
                id: "village-start",
                kind: "day",
                text: "The village is quiet. Complete a small step to help it grow.",
                at,
            },
        ],
        createdAt: at,
        updatedAt: at,
    };
}

export function isMilestoneComplete(state) {
    return RESOURCE_KEYS.every(
        (key) => (state?.resources?.[key] ?? 0) >= WELCOME_TABLE[key]
    );
}

export function getMilestone(state) {
    const rows = RESOURCE_KEYS.map((key) => {
        const current = state?.resources?.[key] ?? 0;
        const target = WELCOME_TABLE[key];

        return {
            key,
            label: RESOURCES[key].label,
            current,
            target,
            percent: Math.min(100, Math.round((current / target) * 100)),
        };
    });

    return {
        rows,
        complete: rows.every((row) => row.current >= row.target),
    };
}

export function summarizeReward(reward) {
    return RESOURCE_KEYS.filter((key) => reward?.[key])
        .map((key) => `${reward[key]} ${RESOURCES[key].label.toLowerCase()}`)
        .join(", ");
}

export function claimRewards(state, plan, now = new Date()) {
    const pending = getPendingRewards(state, plan);

    if (!pending.length) {
        return {
            state,
            granted: [],
            reason: "nothing-to-claim",
        };
    }

    const at = now.toISOString();
    const resources = { ...state.resources };
    const claimedRewards = { ...state.claimedRewards };
    let log = state.log;

    const granted = pending.map((item) => {
        for (const [resource, amount] of Object.entries(item.reward)) {
            resources[resource] = (resources[resource] ?? 0) + amount;
        }

        claimedRewards[item.key] = {
            dayId: item.dayId,
            slot: item.slot,
            domain: item.domain,
            reward: item.reward,
            claimedAt: at,
        };

        log = prependLog(log, {
            id: `claim-${item.key}`,
            kind: "gather",
            text: `${item.title ?? "A small step"} brought ${summarizeReward(item.reward)}.`,
            at,
        });

        return item;
    });

    let next = {
        ...state,
        resources,
        claimedRewards,
        log,
        updatedAt: at,
    };

    if (!isMilestoneComplete(state) && isMilestoneComplete(next)) {
        next = {
            ...next,
            log: prependLog(next.log, {
                id: "welcome-table-ready",
                kind: "milestone",
                text: "The welcome table is ready. The village has enough for the next chapter.",
                at,
            }),
        };
    }

    return {
        state: next,
        granted,
        reason: null,
    };
}
