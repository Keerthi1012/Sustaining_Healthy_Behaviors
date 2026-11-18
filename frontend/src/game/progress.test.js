import { describe, expect, it } from "vitest";
import { getActivityReward } from "./data";
import {
    getDayProgress,
    getPendingRewards,
    getPendingRewardTotals,
    getRewardKey,
    getVillageProgress,
    isEntryResolved,
} from "./progress";
import { getActionableDay } from "../services/planEngine";

function entry(domain, status = "planned", title = "A step") {
    return { domain, status, title, durationLabel: "5 min" };
}

function day(id, primary, secondary = null) {
    return { id, primary, secondary };
}

function makePlan(days) {
    return { id: "plan-1", days };
}

describe("village rewards", () => {
    it("maps a reward by domain and slot", () => {
        expect(getActivityReward({ domain: "movement" }, "primary")).toEqual({
            wood: 2,
        });
        expect(getActivityReward({ domain: "sleep" }, "primary")).toEqual({
            food: 2,
        });
        expect(getActivityReward({ domain: "nutrition" }, "primary")).toEqual({
            food: 2,
        });
        expect(getActivityReward({ domain: "smoking" }, "primary")).toEqual({
            stone: 2,
        });
        expect(getActivityReward({ domain: "movement" }, "secondary")).toEqual({
            wood: 1,
            stone: 1,
        });
        expect(getActivityReward({ domain: "sleep" }, "secondary")).toEqual({
            food: 1,
            stone: 1,
        });
        expect(getActivityReward({ domain: "unknown" }, "primary")).toEqual({
            stone: 2,
        });
    });

    it("builds a stable reward key", () => {
        expect(getRewardKey("plan-1", "day-1", "primary")).toBe(
            "plan-1:day-1:primary"
        );
    });

    it("treats completed and safety-paused steps as resolved", () => {
        expect(isEntryResolved(entry("movement", "completed"))).toBe(true);
        expect(isEntryResolved(entry("movement", "paused"))).toBe(true);
        expect(isEntryResolved(entry("movement", "planned"))).toBe(false);
        expect(isEntryResolved(null)).toBe(false);
    });
});

describe("village day progression", () => {
    it("opens only the first day and locks the rest", () => {
        const plan = makePlan([
            day("d1", entry("movement")),
            day("d2", entry("sleep")),
            day("d3", entry("movement")),
        ]);
        const progress = getVillageProgress(plan);

        expect(progress.days.map((item) => item.status)).toEqual([
            "current",
            "locked",
            "locked",
        ]);
        expect(progress.currentDayId).toBe("d1");
        expect(progress.currentDayNumber).toBe(1);
        expect(progress.completedCount).toBe(0);
        expect(progress.allComplete).toBe(false);
    });

    it("unlocks the next day once the previous one is complete", () => {
        const plan = makePlan([
            day("d1", entry("movement", "completed")),
            day("d2", entry("sleep")),
            day("d3", entry("movement")),
        ]);
        const progress = getVillageProgress(plan);

        expect(progress.days.map((item) => item.status)).toEqual([
            "completed",
            "current",
            "locked",
        ]);
        expect(progress.currentDayId).toBe("d2");
        expect(progress.completedCount).toBe(1);
    });

    it("counts a safety-paused day as complete so it never locks the user out", () => {
        const plan = makePlan([
            day("d1", entry("movement", "paused")),
            day("d2", entry("sleep")),
        ]);
        const progress = getVillageProgress(plan);

        expect(progress.days[0].status).toBe("completed");
        expect(progress.currentDayId).toBe("d2");
    });

    it("opens the next primary while keeping an earlier second focus optional", () => {
        const plan = makePlan([
            day("d1", entry("movement", "completed"), entry("sleep")),
            day("d2", entry("sleep")),
        ]);
        const progress = getVillageProgress(plan);

        expect(progress.days[0]).toMatchObject({
            status: "optional",
            total: 2,
            resolved: 1,
            complete: false,
        });
        expect(progress.days[1].status).toBe("current");
        expect(progress.currentDayId).toBe("d2");
        expect(progress.allComplete).toBe(false);
    });

    it("does not report completion while an optional step waits", () => {
        const plan = makePlan([
            day("d1", entry("movement", "completed"), entry("sleep")),
        ]);
        const progress = getVillageProgress(plan);

        expect(progress.currentIndex).toBe(-1);
        expect(progress.days[0].status).toBe("optional");
        expect(progress.allComplete).toBe(false);

        const complete = makePlan([
            day(
                "d1",
                entry("movement", "completed"),
                entry("sleep", "completed")
            ),
        ]);

        expect(getVillageProgress(complete).allComplete).toBe(true);
    });

    it("reports a day with no scheduled steps explicitly", () => {
        const plan = makePlan([{ id: "d1", primary: null, secondary: null }]);
        const progress = getVillageProgress(plan);

        expect(getDayProgress(plan.days[0])).toMatchObject({
            empty: true,
            complete: false,
        });
        expect(progress.days[0].status).toBe("completed");
    });

    it("shows the village and the wellness home the same open day", () => {
        const plan = makePlan([
            day("d1", entry("movement", "completed")),
            day("d2", entry("sleep")),
            day("d3", entry("movement")),
        ]);

        expect(getVillageProgress(plan).currentDayId).toBe("d2");
        expect(getActionableDay(plan).id).toBe("d2");
    });
});

describe("pending rewards", () => {
    it("offers nothing until a step is completed", () => {
        const plan = makePlan([day("d1", entry("movement"))]);
        const village = { planId: "plan-1", claimedRewards: {} };

        expect(getPendingRewards(village, plan)).toEqual([]);
    });

    it("offers one reward for a completed step", () => {
        const plan = makePlan([
            day("d1", entry("movement", "completed", "A five-minute walk")),
            day("d2", entry("sleep")),
        ]);
        const village = { planId: "plan-1", claimedRewards: {} };
        const pending = getPendingRewards(village, plan);

        expect(pending).toHaveLength(1);
        expect(pending[0]).toMatchObject({
            key: "plan-1:d1:primary",
            dayId: "d1",
            slot: "primary",
            reward: { wood: 2 },
        });
    });

    it("never offers a reward from a locked day", () => {
        const plan = makePlan([
            day("d1", entry("movement")),
            day("d2", entry("sleep", "completed")),
        ]);
        const village = { planId: "plan-1", claimedRewards: {} };

        expect(getPendingRewards(village, plan)).toEqual([]);
    });

    it("offers only the finished day while the next day is unfinished", () => {
        const plan = makePlan([
            day("d1", entry("movement", "completed")),
            day("d2", entry("sleep")),
        ]);
        const village = { planId: "plan-1", claimedRewards: {} };
        const pending = getPendingRewards(village, plan);

        expect(pending).toHaveLength(1);
        expect(pending[0].dayId).toBe("d1");
    });

    it("keeps the ledger idempotent when the same day is claimed twice", () => {
        const plan = makePlan([
            day("d1", entry("movement", "completed")),
            day("d2", entry("sleep")),
        ]);
        const village = {
            planId: "plan-1",
            claimedRewards: { "plan-1:d1:primary": { reward: { wood: 2 } } },
        };

        expect(getPendingRewards(village, plan)).toEqual([]);
    });

    it("skips a step that was already claimed", () => {
        const plan = makePlan([day("d1", entry("movement", "completed"))]);
        const village = {
            planId: "plan-1",
            claimedRewards: {
                "plan-1:d1:primary": { reward: { wood: 2 } },
            },
        };

        expect(getPendingRewards(village, plan)).toEqual([]);
    });
});

describe("pending reward totals", () => {
    it("counts nothing while no step is complete", () => {
        const plan = makePlan([day("d1", entry("movement"))]);

        expect(getPendingRewardTotals(null, plan)).toMatchObject({
            count: 0,
            resources: {},
        });
    });

    it("adds up the rewards waiting in the village", () => {
        const plan = makePlan([
            day("d1", entry("movement", "completed")),
            day("d2", entry("sleep", "completed", "A calmer evening")),
        ]);

        expect(getPendingRewardTotals(null, plan)).toMatchObject({
            count: 2,
            resources: { wood: 2, food: 2 },
        });
    });

    it("adds the stone bonus of a second focus", () => {
        const plan = makePlan([
            day("d1", entry("movement", "completed"), entry("movement", "completed")),
        ]);

        expect(getPendingRewardTotals(null, plan)).toMatchObject({
            count: 2,
            resources: { wood: 3, stone: 1 },
        });
    });

    it("counts nothing once the reward has been gathered", () => {
        const plan = makePlan([day("d1", entry("movement", "completed"))]);
        const village = {
            planId: "plan-1",
            claimedRewards: { "plan-1:d1:primary": { reward: { wood: 2 } } },
        };

        expect(getPendingRewardTotals(village, plan)).toMatchObject({
            count: 0,
            resources: {},
        });
    });
});
