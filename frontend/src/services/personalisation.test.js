import { describe, expect, it } from "vitest";

import {
    applyWeeklyPersonalisation,
    getActionPosterior,
    sampleBeta,
} from "./personalisation";

function makeEntry(id, overrides = {}) {
    return {
        id,
        habitId: id,
        domain: "movement",
        title: id,
        measure: "duration_minutes",
        dose: 5,
        plannedDose: 5,
        durationLabel: "5 min",
        status: "planned",
        completedAt: null,
        feedback: null,
        adapted: false,
        week: 1,
        dayIndex: 0,
        fallback: {
            dose: 3,
            durationLabel: "3 min",
        },
        ...overrides,
    };
}

function makeDay(index, primary) {
    return {
        id: `d${index}`,
        date: `2026-01-${String(index + 1).padStart(2, "0")}`,
        week: Math.floor(index / 7) + 1,
        dayOfWeek: (index % 7) + 1,
        primary,
        secondary: null,
    };
}

function makePlan() {
    const days = [];

    for (let index = 0; index < 14; index += 1) {
        const week = Math.floor(index / 7) + 1;
        const dayIndex = index % 7;
        let primary;

        if (index === 0) {
            primary = makeEntry("A", {
                week,
                dayIndex,
                status: "completed",
                completedAt: "2026-01-01T08:00:00.000Z",
                feedback: {
                    difficulty: "easy",
                    safety: "none",
                    enjoyment: "loved",
                },
            });
        } else if (index === 1) {
            primary = makeEntry("B", {
                week,
                dayIndex,
                status: "completed",
                completedAt: "2026-01-02T08:00:00.000Z",
                feedback: {
                    difficulty: "difficult",
                    safety: "none",
                    enjoyment: "not_for_me",
                },
            });
        } else if (index === 2) {
            primary = makeEntry("C", {
                week,
                dayIndex,
                status: "completed",
                completedAt: "2026-01-03T08:00:00.000Z",
                feedback: {
                    difficulty: "easy",
                    safety: "none",
                    enjoyment: "okay",
                },
            });
        } else {
            primary = makeEntry(["A", "B", "C"][dayIndex % 3], {
                week,
                dayIndex,
            });
        }

        days.push(makeDay(index, primary));
    }

    return {
        id: "plan",
        days,
        adaptations: [],
        safetyPause: false,
    };
}

describe("personalisation posterior", () => {
    it("rewards enjoyment and penalises safety pauses", () => {
        const enjoyed = getActionPosterior({
            resolved: 2,
            effective: 2,
            enjoyed: 2,
            safetyPauses: 0,
        });
        const paused = getActionPosterior({
            resolved: 2,
            effective: 0,
            enjoyed: 0,
            safetyPauses: 1,
        });

        expect(enjoyed.alpha).toBeGreaterThan(paused.alpha);
        expect(paused.beta).toBeGreaterThan(enjoyed.beta);
        expect(sampleBeta(2, 2, () => 0.5)).toBeGreaterThan(0);
        expect(sampleBeta(2, 2, () => 0.5)).toBeLessThan(1);
    });
});

describe("weekly personalisation", () => {
    it("reorders future weeks without touching the completed week", () => {
        const plan = makePlan();
        const next = applyWeeklyPersonalisation(
            plan,
            "d0",
            "primary",
            {
                random: () => 0.9,
                now: "2026-01-08T08:00:00.000Z",
            }
        );

        expect(next).not.toBe(plan);
        expect(next.days[0]).toBe(plan.days[0]);
        expect(next.days[1]).toBe(plan.days[1]);
        expect(next.days[7].primary.id).toBe("A");
        expect(next.days[13].primary.id).toBe("B");
        expect(next.adaptations.at(-1)).toMatchObject({
            type: "personalised_week",
            sourceDayId: "d0",
            targetWeeks: [2],
        });
    });

    it("never grows a movement dose above the backend ceiling", () => {
        const plan = makePlan();
        plan.days[0].primary.feedback.enjoyment = "loved";
        plan.days[7].primary = makeEntry("A", {
            week: 2,
            dose: 7,
            plannedDose: 7,
            durationLabel: "7 min",
            progressionLevels: [
                { level: 1, minutes: 5 },
                { level: 2, minutes: 7 },
            ],
        });

        const next = applyWeeklyPersonalisation(
            plan,
            "d0",
            "primary",
            { random: () => 0.9 }
        );
        const futureA = next.days
            .slice(7)
            .map((day) => day.primary)
            .find((entry) => entry.id === "A");

        expect(futureA.dose).toBeLessThanOrEqual(7);
    });

    it("keeps a future step at its gentle fallback after a safety pause", () => {
        const plan = makePlan();
        plan.days[0].primary.feedback = {
            difficulty: "easy",
            safety: "pain",
            enjoyment: "loved",
        };

        const next = applyWeeklyPersonalisation(
            plan,
            "d0",
            "primary",
            { random: () => 0.9 }
        );
        const futureA = next.days
            .slice(7)
            .map((day) => day.primary)
            .find((entry) => entry.id === "A");

        expect(futureA.dose).toBe(3);
        expect(futureA.personalisation.reasonCode).toBe("safety_hold");
    });

    it("does nothing while the plan is safety paused", () => {
        const plan = {
            ...makePlan(),
            safetyPause: true,
        };

        expect(
            applyWeeklyPersonalisation(plan, "d0", "primary")
        ).toBe(plan);
    });

    it("does nothing when there is no later week", () => {
        const plan = {
            ...makePlan(),
            days: makePlan().days.slice(0, 7),
        };

        expect(
            applyWeeklyPersonalisation(plan, "d0", "primary")
        ).toBe(plan);
    });
});
