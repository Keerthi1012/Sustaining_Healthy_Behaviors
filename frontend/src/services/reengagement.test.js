import { describe, expect, it } from "vitest";

import { buildPlan } from "./planEngine";
import {
    LAPSE_THRESHOLD_DAYS,
    REENGAGEMENT_STATES,
    getReengagementMessageKey,
    getReengagementState,
    isReminderState,
} from "./reengagement";

const profile = {
    primaryGoalId: "movement",
    goalIds: ["movement"],
    answers: {
        activity: "A little active",
        time: "10 minutes",
        barrier: "Not enough time",
    },
};

function build(startDate = new Date(2026, 0, 5)) {
    return buildPlan(profile, startDate);
}

describe("getReengagementState", () => {
    it("is safe without a plan", () => {
        expect(getReengagementState(null, "2026-01-10")).toMatchObject({
            state: REENGAGEMENT_STATES.ON_TRACK,
            daysSinceLastComplete: 0,
            missedCount: 0,
            smallerStepOffered: false,
        });

        expect(
            getReengagementState({ days: [] }, "2026-01-10").state
        ).toBe(REENGAGEMENT_STATES.ON_TRACK);
    });

    it("is on-track on the first day", () => {
        const plan = build();
        const result = getReengagementState(plan, "2026-01-05");

        expect(result.state).toBe(REENGAGEMENT_STATES.ON_TRACK);
        expect(result.daysSinceLastComplete).toBe(0);
        expect(result.smallerStepOffered).toBe(false);
    });

    it("is slipping before the welcome-back threshold", () => {
        const plan = build();
        const result = getReengagementState(plan, "2026-01-07");

        expect(result.state).toBe(REENGAGEMENT_STATES.SLIPPING);
        expect(result.daysSinceLastComplete).toBe(2);
        expect(result.daysSinceLastComplete).toBeLessThan(
            LAPSE_THRESHOLD_DAYS
        );
        expect(result.smallerStepOffered).toBe(true);
        expect(result.missedCount).toBeGreaterThan(0);
    });

    it("becomes lapsed at the welcome-back threshold", () => {
        const plan = build();
        const result = getReengagementState(plan, "2026-01-08");

        expect(result.state).toBe(REENGAGEMENT_STATES.LAPSED);
        expect(result.daysSinceLastComplete).toBe(
            LAPSE_THRESHOLD_DAYS
        );
        expect(result.smallerStepOffered).toBe(false);
    });

    it("reports paused before other states", () => {
        const plan = { ...build(), paused: true };
        const result = getReengagementState(plan, "2026-01-08");

        expect(result.state).toBe(REENGAGEMENT_STATES.PAUSED);
        expect(result.smallerStepOffered).toBe(false);
    });

    it("marks reminder states", () => {
        expect(isReminderState(REENGAGEMENT_STATES.SLIPPING)).toBe(true);
        expect(isReminderState(REENGAGEMENT_STATES.LAPSED)).toBe(true);
        expect(isReminderState(REENGAGEMENT_STATES.ON_TRACK)).toBe(
            false
        );
        expect(isReminderState(REENGAGEMENT_STATES.PAUSED)).toBe(false);
    });

    it("maps states to message keys", () => {
        expect(
            getReengagementMessageKey(REENGAGEMENT_STATES.SLIPPING)
        ).toBe("world.reengagement.slipping.body");
        expect(
            getReengagementMessageKey(REENGAGEMENT_STATES.LAPSED)
        ).toBe("world.reengagement.lapsed.body");
        expect(
            getReengagementMessageKey(REENGAGEMENT_STATES.PAUSED)
        ).toBe("world.reengagement.paused.body");
        expect(
            getReengagementMessageKey(REENGAGEMENT_STATES.ON_TRACK)
        ).toBe("world.reengagement.onTrack.body");
    });
});
