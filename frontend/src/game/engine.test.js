import { describe, expect, it } from "vitest";
import { VILLAGE_VERSION, WELCOME_TABLE } from "./data";
import {
    claimRewards,
    createInitialState,
    getMilestone,
    isMilestoneComplete,
} from "./engine";

function entry(domain, status = "planned", title = "A step") {
    return { domain, status, title, durationLabel: "5 min" };
}

function day(id, primary, secondary = null) {
    return { id, primary, secondary };
}

function makePlan(days) {
    return { id: "plan-1", days };
}

describe("village engine", () => {
    it("starts a new village with no supplies and no claims", () => {
        const state = createInitialState("plan-1");

        expect(state.version).toBe(VILLAGE_VERSION);
        expect(state.planId).toBe("plan-1");
        expect(state.resources).toEqual({ wood: 0, stone: 0, food: 0 });
        expect(state.claimedRewards).toEqual({});
        expect(state.log).toHaveLength(1);
    });

    it("gathers nothing when no step has been completed", () => {
        const plan = makePlan([day("d1", entry("movement"))]);
        const state = createInitialState("plan-1");
        const outcome = claimRewards(state, plan);

        expect(outcome.reason).toBe("nothing-to-claim");
        expect(outcome.granted).toEqual([]);
        expect(outcome.state).toBe(state);
    });

    it("grants the configured reward for a completed step", () => {
        const plan = makePlan([
            day("d1", entry("movement", "completed", "A five-minute walk")),
        ]);
        const state = createInitialState("plan-1");
        const outcome = claimRewards(state, plan);

        expect(outcome.granted).toHaveLength(1);
        expect(outcome.state.resources.wood).toBe(2);
        expect(outcome.state.claimedRewards["plan-1:d1:primary"]).toMatchObject({
            dayId: "d1",
            slot: "primary",
            reward: { wood: 2 },
        });
        expect(outcome.state.log[0].text).toMatch(/five-minute walk/i);
        expect(state.resources.wood).toBe(0);
    });

    it("grants one reward even when the same step is claimed twice", () => {
        const plan = makePlan([day("d1", entry("movement", "completed"))]);
        const first = claimRewards(createInitialState("plan-1"), plan);
        const second = claimRewards(first.state, plan);

        expect(second.reason).toBe("nothing-to-claim");
        expect(second.state.resources.wood).toBe(2);
    });

    it("notes the welcome table once the supplies are complete", () => {
        const plan = makePlan([day("d1", entry("movement", "completed"))]);
        const state = {
            ...createInitialState("plan-1"),
            resources: {
                wood: WELCOME_TABLE.wood - 2,
                stone: WELCOME_TABLE.stone,
                food: WELCOME_TABLE.food,
            },
        };

        expect(isMilestoneComplete(state)).toBe(false);

        const outcome = claimRewards(state, plan);

        expect(outcome.state.resources.wood).toBe(WELCOME_TABLE.wood);
        expect(isMilestoneComplete(outcome.state)).toBe(true);
        expect(getMilestone(outcome.state).complete).toBe(true);
        expect(outcome.state.log[0].kind).toBe("milestone");
    });
});
