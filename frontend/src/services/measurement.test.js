import { describe, expect, it } from "vitest";
import { buildPlan, completeSlot } from "./planEngine";
import { getMeasurement } from "./measurement";
import { addDays } from "../utils/date";

const profile = {
    primaryGoalId: "movement",
    goalIds: ["movement"],
    answers: {
        activity: "A little active",
        time: "10 minutes",
        barrier: "Not enough time",
    },
};

const feedback = {
    difficulty: "comfortable",
    barrier: "Nothing in particular",
    safety: "none",
};

describe("measurement", () => {
    it("counts moments kept in one calendar day regardless of plan dates", () => {
        const plan = buildPlan(profile, addDays(new Date(), 10));

        const empty = getMeasurement(plan, []);

        expect(empty.plannedCount).toBe(1);
        expect(empty.completedCount).toBe(0);
        expect(empty.persistence).toBe(0);

        let next = completeSlot(plan, plan.days[0].id, "primary", feedback);
        const first = getMeasurement(next, []);

        expect(first.completedCount).toBe(1);
        expect(first.plannedCount).toBe(2);
        expect(first.persistence).toBe(50);
        expect(first.movementMinutes).toBeGreaterThan(0);

        next = completeSlot(next, plan.days[1].id, "primary", feedback);
        const second = getMeasurement(next, []);

        expect(second.completedCount).toBe(2);
        expect(second.plannedCount).toBe(3);
        expect(second.persistence).toBe(67);
        expect(second.movementMinutes).toBeGreaterThan(
            first.movementMinutes
        );
        expect(second.activeDays).toBe(1);
    });
});
