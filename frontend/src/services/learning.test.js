import { describe, expect, it } from "vitest";

import {
    getActionLedger,
    getAggregateFeedbackAdjustment,
    getLearningInsight,
    getLearningSummary,
    getRecentFeedback,
} from "./learning";

function planFrom(records) {
    const days = [];

    records.forEach(
        ({
            dayIndex = 0,
            slot = "primary",
            id = "movement-walk-5",
            domain = "movement",
            title = "A five-minute walk",
            status = "completed",
            completedAt = null,
            feedback = {},
            ...entry
        }) => {
            const day = days[dayIndex] ?? {
                id: `day-${dayIndex}`,
                primary: null,
                secondary: null,
            };

            day[slot] = {
                id,
                domain,
                title,
                status,
                completedAt,
                feedback: {
                    difficulty: "comfortable",
                    barrier: "Nothing in particular",
                    safety: "none",
                    ...feedback,
                },
                ...entry,
            };
            days[dayIndex] = day;
        }
    );

    return { days };
}

describe("learning ledger", () => {
    it("includes completed and paused feedback in the ledger", () => {
        const plan = planFrom([
            {
                dayIndex: 0,
                completedAt: "2026-01-05T08:00:00.000Z",
                feedback: { difficulty: "comfortable" },
            },
            {
                dayIndex: 1,
                completedAt: "2026-01-06T08:00:00.000Z",
                status: "paused",
                feedback: {
                    difficulty: "difficult",
                    barrier: "Discomfort or pain",
                    safety: "pain",
                },
            },
            {
                dayIndex: 2,
                completedAt: "2026-01-07T08:00:00.000Z",
                feedback: { difficulty: "easy", barrier: "Low energy" },
            },
        ]);

        const { insight, actions } = getLearningSummary(plan);

        expect(insight.hasData).toBe(true);
        expect(insight.totalResolved).toBe(3);
        expect(insight.completedCount).toBe(2);
        expect(insight.pausedCount).toBe(1);
        expect(insight.safetyPauses).toBe(1);
        expect(insight.effectiveCount).toBe(2);
        expect(insight.challengingCount).toBe(2);
        expect(insight.comfortRate).toBe(67);
        expect(insight.topBarrier).toEqual({
            barrier: "Discomfort or pain",
            count: 1,
        });
        expect(actions[0]).toMatchObject({
            actionId: "movement-walk-5",
            completed: 2,
            paused: 1,
            resolved: 3,
            effective: 2,
            comfortRate: 67,
        });
    });

    it("tracks enjoyment alongside comfort and safety", () => {
        const plan = planFrom([
            {
                dayIndex: 0,
                completedAt: "2026-01-05T08:00:00.000Z",
                feedback: {
                    difficulty: "comfortable",
                    enjoyment: "loved",
                },
            },
            {
                dayIndex: 1,
                completedAt: "2026-01-06T08:00:00.000Z",
                feedback: {
                    difficulty: "difficult",
                    enjoyment: "not_for_me",
                },
            },
            {
                dayIndex: 2,
                completedAt: "2026-01-07T08:00:00.000Z",
                feedback: {
                    difficulty: "easy",
                    enjoyment: "okay",
                },
            },
        ]);

        const { insight, actions } = getLearningSummary(plan);

        expect(insight).toMatchObject({
            enjoymentCaptured: 3,
            enjoyedCount: 1,
            notForMeCount: 1,
            enjoymentRate: 50,
        });
        expect(actions[0]).toMatchObject({
            enjoymentCaptured: 3,
            enjoyed: 1,
            notForMe: 1,
            enjoymentRate: 50,
        });
    });

    it("groups the ledger by action", () => {
        const plan = planFrom([
            {
                dayIndex: 0,
                completedAt: "2026-01-05T08:00:00.000Z",
                id: "movement-walk-5",
                title: "A five-minute walk",
            },
            {
                dayIndex: 1,
                completedAt: "2026-01-06T08:00:00.000Z",
                id: "movement-mobility-3",
                title: "Wake up your body",
                feedback: { difficulty: "difficult" },
            },
            {
                dayIndex: 2,
                completedAt: "2026-01-07T08:00:00.000Z",
                id: "movement-mobility-3",
                title: "Wake up your body",
            },
        ]);

        const actions = getActionLedger(plan);

        expect(actions).toHaveLength(2);
        expect(actions.find((item) => item.actionId === "movement-walk-5"))
            .toMatchObject({ resolved: 1, effective: 1, comfortRate: 100 });
        expect(
            actions.find((item) => item.actionId === "movement-mobility-3")
        ).toMatchObject({ resolved: 2, effective: 1, comfortRate: 50 });
    });

    it("keeps safety pauses visible in the insight", () => {
        const plan = planFrom([
            {
                dayIndex: 0,
                completedAt: "2026-01-05T08:00:00.000Z",
                status: "paused",
                feedback: {
                    difficulty: "too_much",
                    barrier: "Hot weather",
                    safety: "concerning_symptom",
                },
            },
        ]);

        const insight = getLearningInsight(plan);

        expect(insight.safetyPauses).toBe(1);
        expect(insight.topAction.safetyPauses).toBe(1);
        expect(insight.guidance).toBe("hold");
    });

    it("returns an empty insight when no feedback exists", () => {
        const insight = getLearningInsight({ days: [] });

        expect(insight).toMatchObject({
            hasData: false,
            totalResolved: 0,
            comfortRate: 0,
            topAction: null,
            topBarrier: null,
            guidance: "steady",
        });
    });
});

describe("aggregate feedback adjustment", () => {
    it("asks for a gentler step after repeated challenge", () => {
        const plan = planFrom([
            {
                dayIndex: 0,
                completedAt: "2026-01-05T08:00:00.000Z",
                feedback: { difficulty: "too_much" },
            },
            {
                dayIndex: 1,
                completedAt: "2026-01-06T08:00:00.000Z",
                feedback: { difficulty: "difficult", barrier: "Low energy" },
            },
        ]);

        expect(
            getAggregateFeedbackAdjustment(plan, { domain: "movement" })
        ).toMatchObject({
            direction: "gentler",
            reasonCode: "recent_challenge",
            sampleSize: 2,
        });
    });

    it("holds steady after a safety pause", () => {
        const plan = planFrom([
            {
                dayIndex: 0,
                completedAt: "2026-01-05T08:00:00.000Z",
                status: "paused",
                feedback: { difficulty: "comfortable", safety: "pain" },
            },
            {
                dayIndex: 1,
                completedAt: "2026-01-06T08:00:00.000Z",
                feedback: { difficulty: "comfortable" },
            },
        ]);

        expect(
            getAggregateFeedbackAdjustment(plan, { domain: "movement" })
        ).toMatchObject({
            direction: "hold",
            reasonCode: "recent_safety",
        });
    });

    it("recognises a comfortable run", () => {
        const plan = planFrom([
            {
                dayIndex: 0,
                completedAt: "2026-01-05T08:00:00.000Z",
                feedback: { difficulty: "comfortable" },
            },
            {
                dayIndex: 1,
                completedAt: "2026-01-06T08:00:00.000Z",
                feedback: { difficulty: "easy" },
            },
        ]);

        expect(
            getAggregateFeedbackAdjustment(plan, { domain: "movement" })
        ).toMatchObject({
            direction: "increase",
            reasonCode: "recent_comfort",
        });
    });

    it("excludes the current moment from recent feedback", () => {
        const plan = planFrom([
            {
                dayIndex: 0,
                completedAt: "2026-01-05T08:00:00.000Z",
                feedback: { difficulty: "too_much" },
            },
        ]);

        expect(
            getRecentFeedback(plan, {
                domain: "movement",
                excludeDayId: "day-0",
                excludeSlot: "primary",
            })
        ).toEqual([]);
        expect(
            getAggregateFeedbackAdjustment(plan, {
                domain: "movement",
                excludeDayId: "day-0",
                excludeSlot: "primary",
            })
        ).toMatchObject({
            direction: "steady",
            reasonCode: "no_history",
            sampleSize: 0,
        });
    });
});
