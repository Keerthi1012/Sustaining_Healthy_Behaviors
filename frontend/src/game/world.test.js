import { describe, expect, it } from "vitest";

import { buildPlan, completeSlot } from "../services/planEngine";
import { addDays } from "../utils/date";
import {
    getGrowthCompletedEntries,
    getGrowthProgress,
    getRecentWorldMoments,
    getWorldGrowth,
    WORLD_REALMS,
} from "./world";

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

function makePlan(dayCount = 3) {
    const start = addDays(new Date(), -5);
    const plan = buildPlan(profile, start);

    return { ...plan, days: plan.days.slice(0, dayCount) };
}

describe("getWorldGrowth", () => {
    it("returns an empty growth model without a plan", () => {
        const growth = getWorldGrowth(null);

        expect(growth.total).toBe(0);
        expect(growth.unlocks).toEqual([]);
        expect(growth.layers).toEqual([]);
        expect(growth.next).toBeNull();
    });

    it("starts quiet before any step is completed", () => {
        const growth = getWorldGrowth(makePlan());

        expect(growth.total).toBe(0);
        expect(growth.layers).toEqual([]);
        expect(growth.next).not.toBeNull();
        expect(growth.next.remaining).toBe(1);
    });

    it("unlocks the first milestone of a realm after one step", () => {
        const base = makePlan();
        const plan = completeSlot(base, base.days[0].id, "primary", feedback);
        const growth = getWorldGrowth(plan);

        expect(growth.total).toBe(1);
        expect(growth.counts.movement).toBe(1);
        expect(growth.layers).toContain("flowers");
        expect(growth.unlocks[0].realmId).toBe("movement");
    });

    it("only counts completed entries toward milestones", () => {
        const growth = getWorldGrowth(makePlan());

        for (const realm of WORLD_REALMS) {
            expect(growth.counts[realm.id]).toBe(0);
        }
    });

    it("counts out-of-order demo completions across the whole plan", () => {
        const base = makePlan(3);
        const plan = completeSlot(
            base,
            base.days[2].id,
            "primary",
            feedback
        );

        expect(base.days[0].primary.status).toBe("planned");

        const growth = getWorldGrowth(plan);

        expect(growth.total).toBe(1);
        expect(growth.counts.movement).toBe(1);
        expect(growth.layers).toContain("flowers");
        expect(growth.unlocks[0].momentKey).toBe(
            "world.moment.movement.1"
        );
        expect(getGrowthCompletedEntries(plan)).toHaveLength(1);
        expect(getGrowthProgress(plan)).toEqual({
            completed: 1,
            planned: 3,
            percent: 33,
        });
    });

    it("counts completed secondary entries in their own realm", () => {
        const secondaryProfile = {
            ...profile,
            goalIds: ["movement", "sleep"],
            secondaryGoalId: "sleep",
        };
        const base = buildPlan(
            secondaryProfile,
            addDays(new Date(), -5)
        );
        const plan = {
            ...base,
            days: base.days.slice(0, 3),
        };
        const completed = completeSlot(
            plan,
            plan.days[2].id,
            "secondary",
            feedback
        );
        const growth = getWorldGrowth(completed);

        expect(growth.total).toBe(1);
        expect(growth.counts.sleep).toBe(1);
        expect(growth.layers).toContain("lantern");
        expect(getGrowthCompletedEntries(completed)).toHaveLength(1);
        expect(getGrowthProgress(completed).planned).toBe(6);
    });
});

describe("getRecentWorldMoments", () => {
    it("returns nothing before any step is completed", () => {
        expect(getRecentWorldMoments(makePlan())).toEqual([]);
    });

    it("lists completed steps most recent first", () => {
        const base = makePlan();
        const plan = completeSlot(base, base.days[0].id, "primary", feedback);
        const moments = getRecentWorldMoments(plan);

        expect(moments.length).toBe(1);
        expect(moments[0].domain).toBe("movement");
    });
});
