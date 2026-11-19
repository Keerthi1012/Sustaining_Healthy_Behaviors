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

    // Track last login date for dull state
    const lastLogin = at;

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
        // Mood-based character state
        mood: null,              // current mood: calm, hopeful, tired, heavy, restless
        moodStepsSinceChange: 0, // count of steps since mood last changed
        characterState: "neutral", // "neutral", "low-energy", or "happy"
        // Dull village state after many days without login
        lastLogin,               // track last login date
        isDull: false,           // will be updated in claimRewards after checking days since last login
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
        lastLogin: at, // update last login date to now
    };

    // Calculate dull state: village is dull if last login was more than 2 days ago
    const oneDay = 24 * 60 * 60 * 1000;
    const daysSinceLastLogin = (now - new Date(state.lastLogin)) / oneDay;
    const isDull = daysSinceLastLogin > 2; // more than 2 days = dull village

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

    // Add celebration for layer unlocks
    const layerNames = ["clear", "horizon", "stars", "birds", "trail", "pond", "garden", "berries"];
    const previouslyUnlocked =
        state.unlockedLayers instanceof Set
            ? state.unlockedLayers
            : new Set(state.unlockedLayers ?? []);
    const newUnlocks = layerNames.filter((layer) => !previouslyUnlocked.has(layer));
    let celebration = state.celebration;
    if (newUnlocks.length > 0 && !celebration) {
        celebration = {
            type: "layer-unlock",
            layers: newUnlocks,
            at,
            duration: 5000,
        };
    }

    // Track mood-based character state
    const currentMood = state.mood;
    const moodStepsSinceChange = state.moodStepsSinceChange || 0;
    
    // Determine new mood based on step domain (simplified mapping)
    const newMood = pending?.[0]?.domain || currentMood;
    
    // Update character state: after enough steps, character becomes happy
    const characterState = moodStepsSinceChange >= 3 || newMood !== currentMood
        ? "happy"
        : "low-energy";
    
    const newMoodSteps = newMood !== currentMood ? 0 : moodStepsSinceChange + 1;

    return {
        state: {
            ...next,
            unlockedLayers: new Set([...(state.unlockedLayers || []), ...newUnlocks]),
            celebration,
            mood: newMood,
            moodStepsSinceChange: newMoodSteps,
            characterState,
            isDull, // village dull state after many days without login
        },
        granted,
        reason: null,
    };
}
