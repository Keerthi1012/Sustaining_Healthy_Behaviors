import { afterEach, describe, expect, it, vi } from "vitest";
import {
    addSecondaryGoal,
    applyEcosystemContext,
    applyProgressionDecision,
    applyReadiness,
    applyReturn,
    buildPlan,
    buildPlanAsync,
    completeSlot,
    getActionableDay,
    getActionableDayIndex,
    getCompletedEntries,
    getDayResolution,
    getGrowth,
    getLapseInfo,
    getOptionalActionableStep,
    getPlannedEntries,
    getPlanProgress,
    isPrimaryResolved,
    shrinkSlot,
} from "./planEngine";
import { addDays, toDateKey } from "../utils/date";
import { setDemoClock } from "./demoClock";
import { DEFAULT_ECOSYSTEM_CONTEXT } from "./ecosystemStore";

const movementProfile = {
    primaryGoalId: "movement",
    goalIds: ["movement"],
    answers: {
        activity: "A little active",
        time: "10 minutes",
        barrier: "Not enough time",
    },
};

const startDate = new Date(2026, 0, 5);

describe("planEngine", () => {
    it("builds a four-week movement plan from the onboarding profile", () => {
        const plan = buildPlan(movementProfile, startDate);

        expect(plan.days).toHaveLength(28);
        expect(plan.startDate).toBe("2026-01-05");
        expect(plan.primaryGoalId).toBe("movement");
        expect(plan.days[0].primary.domain).toBe("movement");
        expect(plan.days[0].primary.dose).toBeLessThanOrEqual(10);
        expect(plan.days[0].primary.status).toBe("planned");
    });

    it("uses comfortable time as an upper bound for movement", () => {
        const plan = buildPlan(
            {
                ...movementProfile,
                answers: {
                    ...movementProfile.answers,
                    time: "30 minutes",
                    comfortableTime: "2 minutes",
                },
            },
            startDate
        );

        expect(plan.days[0].primary.dose).toBeLessThanOrEqual(2);
    });

    it("adapts today's step to readiness without changing the planned dose", () => {
        const plan = buildPlan(
            {
                ...movementProfile,
                answers: {
                    ...movementProfile.answers,
                    time: "30 minutes",
                },
            },
            startDate
        );
        const dayId = plan.days[0].id;
        const plannedDose = plan.days[0].primary.dose;
        const next = applyReadiness(plan, dayId, "primary", {
            energy: "low",
            time: 2,
            weather: "mild",
            headspace: "neutral",
        });
        const adapted = next.days[0].primary;

        expect(adapted.plannedDose).toBe(plannedDose);
        expect(adapted.dose).toBeLessThanOrEqual(2);
        expect(adapted.readiness).toEqual({
            energy: "low",
            time: 2,
            weather: "mild",
            headspace: "neutral",
        });
        expect(adapted.readinessTag).toBe("low");
        expect(adapted.adapted).toBe(true);
        expect(next.adaptations.at(-1)).toMatchObject({
            type: "readiness",
            dayId,
            slot: "primary",
        });
    });

    it("restores the planned dose when readiness improves", () => {
        const plan = buildPlan(movementProfile, startDate);
        const dayId = plan.days[0].id;
        const plannedDose = plan.days[0].primary.dose;
        const smaller = applyReadiness(plan, dayId, "primary", {
            energy: "low",
            time: 2,
            weather: "mild",
            headspace: "heavy",
        });
        const restored = applyReadiness(smaller, dayId, "primary", {
            energy: "good",
            time: 10,
            weather: "mild",
            headspace: "light",
        });

        expect(restored.days[0].primary.dose).toBe(plannedDose);
        expect(restored.days[0].primary.plannedDose).toBe(plannedDose);
        expect(restored.days[0].primary.readinessTag).toBeNull();
    });

    it("keeps readiness changes indoors when the weather is hot", () => {
        const plan = buildPlan(movementProfile, startDate);
        const next = applyReadiness(
            plan,
            plan.days[0].id,
            "primary",
            {
                energy: "okay",
                time: 10,
                weather: "hot",
                headspace: "neutral",
            }
        );

        expect(next.days[0].primary.readinessTag).toBe("hot");
        expect(next.days[0].primary.anchor).toMatch(/indoors|shade/i);
    });

    it("preserves readiness when ecosystem context is re-applied", () => {
        const plan = buildPlan(movementProfile, startDate);
        const dayId = plan.days[0].id;
        const ready = applyReadiness(plan, dayId, "primary", {
            energy: "low",
            time: 2,
            weather: "rainy",
            headspace: "heavy",
        });
        const context = {
            ...DEFAULT_ECOSYSTEM_CONTEXT,
            contextFlags: {
                ...DEFAULT_ECOSYSTEM_CONTEXT.contextFlags,
                extremeHeatMode: true,
            },
        };
        const next = applyEcosystemContext(ready, context);

        expect(next.days[0].primary.readiness).toEqual(
            ready.days[0].primary.readiness
        );
        expect(next.days[0].primary.readinessTag).toBe("rainy");
        expect(next.days[0].primary.dose).toBeLessThanOrEqual(
            ready.days[0].primary.dose
        );
    });

    it("does not change a completed step when readiness is saved", () => {
        const plan = buildPlan(movementProfile, startDate);
        const dayId = plan.days[0].id;
        const completed = completeSlot(plan, dayId, "primary", {
            difficulty: "easy",
            barrier: "Nothing in particular",
            safety: "none",
        });
        const next = applyReadiness(completed, dayId, "primary", {
            energy: "low",
            time: 2,
            weather: "rainy",
            headspace: "heavy",
        });

        expect(next).toBe(completed);
    });

    it("stamps a simulated completion timestamp when provided", () => {
        const plan = buildPlan(movementProfile, startDate);
        const now = "2026-01-07T19:30:00.000Z";

        const next = completeSlot(
            plan,
            plan.days[0].id,
            "primary",
            {
                difficulty: "easy",
                barrier: "Nothing in particular",
                safety: "none",
            },
            { now }
        );

        expect(next.days[0].primary.completedAt).toBe(now);
    });

    it("builds a sleep-first plan from the sleep challenge answer", () => {
        const sleepProfile = {
            primaryGoalId: "sleep",
            goalIds: ["sleep"],
            answers: {
                sleepHours: "6-7 hours",
                sleepChallenge: "Difficulty falling asleep",
                barrier: "Racing thoughts",
            },
        };

        const plan = buildPlan(sleepProfile, startDate);

        expect(plan.days[0].primary.domain).toBe("sleep");
        expect(plan.days[0].primary.id).toBe("sleep-wind-down");
        expect(plan.days[0].primary.status).toBe("planned");
    });

    it("builds local fallback plans for nutrition and smoking", () => {
        const nutrition = buildPlan(
            {
                primaryGoalId: "nutrition",
                goalIds: ["nutrition"],
                answers: {},
            },
            startDate
        );
        const smoking = buildPlan(
            {
                primaryGoalId: "smoking",
                goalIds: ["smoking"],
                answers: {},
            },
            startDate
        );

        expect(nutrition.days[0].primary.domain).toBe("nutrition");
        expect(nutrition.days[0].primary.id).toBe(
            "nutrition-veggie-first"
        );
        expect(smoking.days[0].primary.domain).toBe("smoking");
        expect(smoking.days[0].primary.id).toBe("smoking-delay-5");
    });

    it("makes the next movement step gentler after too much difficulty", () => {
        const plan = buildPlan(movementProfile, startDate);
        const next = completeSlot(plan, plan.days[0].id, "primary", {
            difficulty: "too_much",
            barrier: "Nothing in particular",
            safety: "none",
        });

        expect(next.days[0].primary.status).toBe("completed");
        expect(next.days[1].primary.adapted).toBe(true);
        expect(next.days[1].primary.dose).toBe(
            next.days[1].primary.fallback.dose
        );
        expect(next.adaptations).toHaveLength(1);
        expect(next.adaptations[0]).toMatchObject({
            type: "adjusted",
            targetDayId: next.days[1].id,
            targetSlot: "primary",
        });
    });

    it("records which step a smaller offer targets", () => {
        const plan = buildPlan(movementProfile, startDate);
        const smaller = shrinkSlot(
            plan,
            plan.days[0].id,
            "primary"
        );

        expect(smaller.adaptations[0]).toMatchObject({
            type: "smaller",
            targetDayId: plan.days[0].id,
            targetSlot: "primary",
        });
        expect(smaller.days[0].primary.adapted).toBe(true);
    });

    it("does not record an adaptation when no barrier was reported", () => {
        const plan = buildPlan(movementProfile, startDate);
        const next = completeSlot(plan, plan.days[0].id, "primary", {
            difficulty: "comfortable",
            barrier: "Nothing in particular",
            safety: "none",
        });

        expect(next.days[0].primary.status).toBe("completed");
        expect(next.adaptations).toEqual([]);
    });

    it("uses recent aggregate feedback when choosing the next movement step", () => {
        const plan = buildPlan(movementProfile, startDate);
        const seeded = {
            ...plan,
            days: plan.days.map((day, index) => {
                if (index === 0) {
                    return {
                        ...day,
                        primary: {
                            ...day.primary,
                            status: "completed",
                            completedAt: "2026-01-05T08:00:00.000Z",
                            feedback: {
                                difficulty: "too_much",
                                barrier: "Low energy",
                                safety: "none",
                            },
                        },
                    };
                }

                if (index === 1) {
                    return {
                        ...day,
                        primary: {
                            ...day.primary,
                            status: "completed",
                            completedAt: "2026-01-06T08:00:00.000Z",
                            feedback: {
                                difficulty: "difficult",
                                barrier: "Low energy",
                                safety: "none",
                            },
                        },
                    };
                }

                return day;
            }),
        };

        const next = completeSlot(seeded, seeded.days[2].id, "primary", {
            difficulty: "comfortable",
            barrier: "Nothing in particular",
            safety: "none",
        });

        expect(next.days[3].primary.adapted).toBe(true);
        expect(next.days[3].primary.dose).toBe(
            next.days[3].primary.fallback.dose
        );
        expect(next.adaptations.at(-1)).toMatchObject({
            type: "adjusted",
            targetDayId: next.days[3].id,
            targetSlot: "primary",
        });
    });

    it("does not increase the next step after a recent safety pause", () => {
        const plan = buildPlan(movementProfile, startDate);
        const seeded = {
            ...plan,
            days: plan.days.map((day, index) =>
                index === 0
                    ? {
                          ...day,
                          primary: {
                              ...day.primary,
                              status: "paused",
                              completedAt: "2026-01-05T08:00:00.000Z",
                              feedback: {
                                  difficulty: "comfortable",
                                  barrier: "Nothing in particular",
                                  safety: "pain",
                              },
                          },
                      }
                    : day
            ),
        };
        const before = seeded.days[2].primary.dose;
        const next = completeSlot(seeded, seeded.days[1].id, "primary", {
            difficulty: "comfortable",
            barrier: "Nothing in particular",
            safety: "none",
        });

        expect(next.days[2].primary.dose).toBe(before);
    });

    it("pauses the plan and avoids completion when safety is flagged", () => {
        const plan = buildPlan(movementProfile, startDate);
        const next = completeSlot(plan, plan.days[0].id, "primary", {
            difficulty: "comfortable",
            barrier: "Nothing in particular",
            safety: "pain",
        });

        expect(next.days[0].primary.status).toBe("paused");
        expect(next.safetyPause).toBe(true);
        expect(next.adaptations[0]).toMatchObject({
            type: "safety_pause",
            targetDayId: plan.days[0].id,
            targetSlot: "primary",
        });
    });

    it("detects a lapse and offers a smaller return without resetting", () => {
        const plan = buildPlan(movementProfile, startDate);
        const todayKey = "2026-01-10";
        const lapse = getLapseInfo(plan, todayKey);

        expect(lapse.needsReturn).toBe(true);
        expect(lapse.missedCount).toBe(5);

        const returned = applyReturn(plan);
        const actionable = getActionableDay(returned);

        // The next unfinished day is kept and softened, never quietly excused.
        expect(actionable.id).toBe(plan.days[0].id);
        expect(actionable.primary.status).toBe("planned");
        expect(actionable.primary.adapted).toBe(true);
        expect(actionable.primary.dose).toBe(actionable.primary.fallback.dose);
        expect(
            returned.days.every((day) => day.primary.status !== "paused")
        ).toBe(true);
        expect(returned.adaptations).toContainEqual(
            expect.objectContaining({
                type: "return",
                targetDayId: plan.days[0].id,
                targetSlot: "primary",
            })
        );
    });

    it("does not treat a fresh plan as lapsed because a demo date is ahead of it", () => {
        const plan = buildPlan(movementProfile);
        const futureDemoKey = toDateKey(addDays(new Date(), 5));

        setDemoClock("12:00", futureDemoKey);

        const lapse = getLapseInfo(plan, futureDemoKey);

        expect(lapse.needsReturn).toBe(false);
        expect(lapse.missedCount).toBe(0);
        expect(lapse.daysSinceLastComplete).toBe(0);
    });

    it("still detects a lapse for a backdated plan viewed from a future demo date", () => {
        const plan = buildPlan(movementProfile, addDays(new Date(), -6));
        const futureDemoKey = toDateKey(addDays(new Date(), 1));

        setDemoClock("12:00", futureDemoKey);

        const lapse = getLapseInfo(plan, futureDemoKey);

        expect(lapse.needsReturn).toBe(true);
        expect(lapse.daysSinceLastComplete).toBe(7);
        expect(lapse.missedCount).toBe(7);
    });

    it("adds a second focus to current and future days only", () => {
        const plan = buildPlan(movementProfile);
        const next = addSecondaryGoal(plan, movementProfile, "sleep");
        const todayKey = toDateKey();

        expect(next.secondaryGoalId).toBe("sleep");
        expect(next.goalIds).toEqual(["movement", "sleep"]);
        expect(
            next.days
                .filter((day) => day.date < todayKey)
                .every((day) => day.secondary === null)
        ).toBe(true);
        expect(
            next.days.find((day) => day.date === todayKey)?.secondary?.domain
        ).toBe("sleep");
    });

    it("calculates growth from moments in the progression window", () => {
        const plan = buildPlan(movementProfile, startDate);

        expect(getGrowth(plan)).toBe(0);

        const next = completeSlot(plan, plan.days[0].id, "primary", {
            difficulty: "easy",
            barrier: "Nothing in particular",
            safety: "none",
        });

        // Day 1 is resolved and Day 2 is open, so the window has two moments.
        expect(getGrowth(next)).toBe(0.5);
    });

    it("counts multiple completions made on the same calendar day", () => {
        const futureStart = addDays(new Date(), 10);
        const plan = buildPlan(movementProfile, futureStart);
        const feedback = {
            difficulty: "easy",
            barrier: "Nothing in particular",
            safety: "none",
        };

        let next = completeSlot(plan, plan.days[0].id, "primary", feedback);

        expect(getCompletedEntries(next)).toHaveLength(1);
        expect(getPlannedEntries(next)).toHaveLength(2);
        expect(getGrowth(next)).toBe(0.5);

        next = completeSlot(next, plan.days[1].id, "primary", feedback);

        expect(getCompletedEntries(next)).toHaveLength(2);
        expect(getPlannedEntries(next)).toHaveLength(3);
        expect(getGrowth(next)).toBeCloseTo(2 / 3);
    });
});

describe("sequential day selection", () => {
    const feedback = {
        difficulty: "easy",
        barrier: "Nothing in particular",
        safety: "none",
    };

    it("opens the first day before anything is done", () => {
        const plan = buildPlan(movementProfile, startDate);

        expect(getActionableDay(plan).id).toBe(plan.days[0].id);
        expect(getActionableDayIndex(plan)).toBe(0);
    });

    it("opens the next day once the previous day is finished", () => {
        const plan = buildPlan(movementProfile, startDate);
        const next = completeSlot(
            plan,
            plan.days[0].id,
            "primary",
            feedback
        );

        expect(getActionableDay(next).id).toBe(plan.days[1].id);
    });

    it("does not skip unfinished days when the calendar moves on", () => {
        const plan = buildPlan(movementProfile, addDays(new Date(), -5));
        const next = completeSlot(
            plan,
            plan.days[0].id,
            "primary",
            feedback
        );

        // The calendar has moved on, but the second day is still the open one.
        expect(plan.days[1].date < toDateKey()).toBe(true);
        expect(getActionableDay(next).id).toBe(plan.days[1].id);
        expect(getLapseInfo(next, toDateKey()).missedCount).toBe(4);
    });

    it("treats a safety-paused step as a finished day", () => {
        const plan = buildPlan(movementProfile, startDate);
        const next = completeSlot(plan, plan.days[0].id, "primary", {
            difficulty: "comfortable",
            barrier: "Nothing in particular",
            safety: "pain",
        });

        expect(getActionableDay(next).id).toBe(plan.days[1].id);
    });

    it("opens the next primary step while keeping a second focus optional", () => {
        const plan = buildPlan(movementProfile);
        const withSecond = addSecondaryGoal(
            plan,
            movementProfile,
            "sleep"
        );
        const next = completeSlot(
            withSecond,
            withSecond.days[0].id,
            "primary",
            feedback
        );

        expect(getActionableDay(next).id).toBe(withSecond.days[1].id);
        expect(isPrimaryResolved(next.days[0])).toBe(true);

        const optional = getOptionalActionableStep(next);

        expect(optional.day.id).toBe(withSecond.days[0].id);
        expect(optional.slot).toBe("secondary");
        expect(optional.entry.domain).toBe("sleep");

        const finished = completeSlot(
            next,
            optional.day.id,
            optional.slot,
            feedback
        );

        expect(getOptionalActionableStep(finished).day.id).toBe(
            withSecond.days[1].id
        );
    });

    it("does not invent an optional step when there is no second focus", () => {
        const plan = buildPlan(movementProfile, startDate);
        const next = completeSlot(
            plan,
            plan.days[0].id,
            "primary",
            feedback
        );

        expect(getOptionalActionableStep(next)).toBeNull();
    });

    it("lets primary steps finish while optional steps wait", () => {
        const plan = addSecondaryGoal(
            buildPlan(movementProfile),
            movementProfile,
            "sleep"
        );
        const finished = {
            ...plan,
            days: plan.days.map((day) => ({
                ...day,
                primary: { ...day.primary, status: "completed" },
            })),
        };

        expect(getActionableDay(finished)).toBeNull();
        expect(getOptionalActionableStep(finished).day.id).toBe(
            plan.days[0].id
        );
    });

    it("reports the steps of a day and finds no day when the plan is done", () => {
        const plan = buildPlan(movementProfile, startDate);

        expect(getDayResolution(plan.days[0])).toMatchObject({
            total: 1,
            resolved: 0,
            complete: false,
            empty: false,
        });

        const finished = {
            ...plan,
            days: plan.days.map((day) => ({
                ...day,
                primary: { ...day.primary, status: "completed" },
            })),
        };

        expect(getActionableDay(finished)).toBeNull();
    });
});

describe("plan progress", () => {
    const feedback = {
        difficulty: "easy",
        barrier: "Nothing in particular",
        safety: "none",
    };

    it("counts the moments that are already resolved", () => {
        const plan = buildPlan(movementProfile, startDate);

        expect(getPlanProgress(plan)).toEqual({
            resolved: 0,
            total: 28,
            percent: 0,
        });

        const oneDone = completeSlot(
            plan,
            plan.days[0].id,
            "primary",
            feedback
        );

        expect(getPlanProgress(oneDone)).toEqual({
            resolved: 1,
            total: 28,
            percent: 4,
        });
    });

    it("counts a safety-paused moment as kept", () => {
        const plan = buildPlan(movementProfile, startDate);
        const paused = completeSlot(plan, plan.days[0].id, "primary", {
            difficulty: "comfortable",
            barrier: "Nothing in particular",
            safety: "pain",
        });

        expect(getPlanProgress(paused).resolved).toBe(1);
    });

    it("reports a finished plan and an empty plan safely", () => {
        const plan = buildPlan(movementProfile, startDate);
        const finished = {
            ...plan,
            days: plan.days.map((day) => ({
                ...day,
                primary: { ...day.primary, status: "completed" },
            })),
        };

        expect(getPlanProgress(finished)).toEqual({
            resolved: 28,
            total: 28,
            percent: 100,
        });

        expect(getPlanProgress({ days: [] })).toEqual({
            resolved: 0,
            total: 0,
            percent: 0,
        });
    });
});

const backendHabit = {
    habit_id: "movement-walk-5",
    domain: "movement",
    title: "Short walk",
    description: "Take a short walk at a convenient time during your day.",
    progression_profiles: [
        {
            metric: "duration_minutes",
            starting_level: 1,
            levels: [
                { level: 1, name: "Getting started", target: { metric: "duration_minutes", value: 5 } },
                { level: 2, name: "Building consistency", target: { metric: "duration_minutes", value: 7 } },
                { level: 3, name: "Growing stronger", target: { metric: "duration_minutes", value: 10 } },
                { level: 4, name: "Making it a routine", target: { metric: "duration_minutes", value: 15 } },
            ],
        },
    ],
    com_b_components: ["reflective_motivation", "automatic_motivation"],
    bct_mappings: [
        { bct_id: "1.4", implementation: "Plan when the walk happens.", delivery_method: "interactive_planning" },
        { bct_id: "8.7", implementation: "Increase the walk when feedback supports it.", delivery_method: "progression_engine" },
    ],
    progression: {
        enabled: true,
        strategy: "feedback_gated",
        lookback_sessions: 5,
        min_successful_sessions: 2,
        required_feedback: ["easy", "comfortable"],
    },
    safety_considerations: ["Adapt the activity to the user's ability."],
    clinical_basis:
        "WHO (2020) removed the 10-minute minimum bout, so brief walks count.",
    active: true,
};

function backendVariant({ id, title, minutes }) {
    return {
        ...backendHabit,
        habit_id: id,
        title,
        description: title,
        progression_profiles: [
            {
                ...backendHabit.progression_profiles[0],
                levels: minutes.map((value, index) => ({
                    level: index + 1,
                    name: [
                        "Getting started",
                        "Building consistency",
                        "Growing stronger",
                        "Making it a routine",
                    ][index],
                    target: { metric: "duration_minutes", value },
                })),
            },
        ],
    };
}

function stubCatalog(habits = [backendHabit]) {
    const fetchMock = vi.fn(async () => ({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({
            schema_version: "1.0.0",
            domain: "movement",
            habits,
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    return fetchMock;
}

function stubDomainCatalog(catalogs) {
    const fetchMock = vi.fn(async (url) => {
        const domain = String(url).split("/").at(-1);
        const habits = catalogs[domain];

        return {
            ok: Boolean(habits),
            status: habits ? 200 : 404,
            headers: { get: () => "application/json" },
            json: async () =>
                habits
                    ? {
                        schema_version: "1.0.0",
                        domain,
                        habits,
                    }
                    : { detail: "not found" },
        };
    });

    vi.stubGlobal("fetch", fetchMock);

    return fetchMock;
}

const nutritionHabit = {
    ...backendHabit,
    habit_id: "nutrition-veggie-first",
    domain: "nutrition",
    title: "Add a vegetable first",
    description: "Add one vegetable to a meal.",
    progression_profiles: [
        {
            ...backendHabit.progression_profiles[0],
            levels: [2, 3, 5, 7].map((value, index) => ({
                level: index + 1,
                name: [
                    "Getting started",
                    "Building consistency",
                    "Growing stronger",
                    "Making it a routine",
                ][index],
                target: { metric: "duration_minutes", value },
            })),
        },
    ],
};

describe("backend progression flag", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("keeps the local catalog when the flag is off", async () => {
        vi.stubEnv("VITE_USE_BACKEND_PROGRESSION", "false");
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        const plan = await buildPlanAsync(movementProfile, startDate);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(plan.days[0].primary.id).toBe(
            buildPlan(movementProfile, startDate).days[0].primary.id
        );
    });

    it("uses the backend catalog when the flag is on", async () => {
        vi.stubEnv("VITE_USE_BACKEND_PROGRESSION", "true");
        const fetchMock = stubCatalog();

        const plan = await buildPlanAsync(movementProfile, startDate, {
            token: "abc",
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/habits/movement",
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer abc",
                }),
            })
        );
        expect(plan.days[0].primary.id).toBe("movement-walk-5");
        expect(plan.days[0].primary.dose).toBe(5);
        expect(plan.days[0].primary.progressionLevels).toHaveLength(4);
    });

    it("falls back to the local catalog when the backend is unavailable", async () => {
        vi.stubEnv("VITE_USE_BACKEND_PROGRESSION", "true");
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new Error("offline");
            })
        );

        const plan = await buildPlanAsync(movementProfile, startDate);

        expect(plan.days[0].primary.id).toBe(
            buildPlan(movementProfile, startDate).days[0].primary.id
        );
    });

    it("applies a backend progression increase to the next movement step", async () => {
        vi.stubEnv("VITE_USE_BACKEND_PROGRESSION", "true");
        stubCatalog();

        const plan = await buildPlanAsync(movementProfile, startDate);
        const dayId = plan.days[0].id;
        const completed = completeSlot(
            plan,
            dayId,
            "primary",
            {
                difficulty: "easy",
                barrier: "Nothing in particular",
                safety: "none",
            },
            { useBackendProgression: true }
        );

        const next = await applyProgressionDecision(
            completed,
            dayId,
            "primary",
            {
                useBackendProgression: true,
                evaluate: async () => ({
                    action: "increase",
                    reason: "The user met the progression criteria.",
                    current_level: 1,
                    recommended_level: 2,
                    current_target: 5,
                    recommended_target: 7,
                }),
            }
        );

        expect(next.days[1].primary.dose).toBe(7);
        expect(next.days[1].primary.progressionLevel).toBe(2);
        expect(next.days[1].primary.durationLabel).toBe("7 min");
        expect(next.adaptations.at(-1)).toMatchObject({
            type: "adjusted",
            targetDayId: next.days[1].id,
            targetSlot: "primary",
        });
    });

    it("mirrors the progression rules when the backend evaluation fails", async () => {
        vi.stubEnv("VITE_USE_BACKEND_PROGRESSION", "true");
        stubCatalog();

        let plan = await buildPlanAsync(movementProfile, startDate);

        for (let index = 0; index < 2; index += 1) {
            const dayId = plan.days[index].id;

            plan = completeSlot(
                plan,
                dayId,
                "primary",
                {
                    difficulty: "comfortable",
                    barrier: "Nothing in particular",
                    safety: "none",
                },
                { useBackendProgression: true }
            );
            plan = await applyProgressionDecision(
                plan,
                dayId,
                "primary",
                {
                    useBackendProgression: true,
                    evaluate: async () => {
                        throw new Error("offline");
                    },
                }
            );
        }

        expect(plan.days[2].primary.dose).toBe(7);
        expect(plan.days[2].primary.progressionLevel).toBe(2);
    });

    it("rotates through backend habits instead of repeating one", async () => {
        vi.stubEnv("VITE_USE_BACKEND_PROGRESSION", "true");
        stubCatalog([
            backendHabit,
            backendVariant({
                id: "movement-mobility-3",
                title: "Wake up your body",
                minutes: [3, 5, 7, 10],
            }),
        ]);

        const plan = await buildPlanAsync(movementProfile, startDate);

        expect(plan.days[0].primary.habitId).toBe("movement-walk-5");
        expect(plan.days[1].primary.habitId).toBe("movement-mobility-3");
        expect(plan.days[2].primary.habitId).toBe("movement-walk-5");
    });

    it("keeps feedback history separate for each backend habit", async () => {
        vi.stubEnv("VITE_USE_BACKEND_PROGRESSION", "true");
        stubCatalog([
            backendHabit,
            backendVariant({
                id: "movement-mobility-3",
                title: "Wake up your body",
                minutes: [3, 5, 7, 10],
            }),
        ]);

        let plan = await buildPlanAsync(movementProfile, startDate);
        const feedback = {
            difficulty: "comfortable",
            barrier: "Nothing in particular",
            safety: "none",
        };
        const offline = async () => {
            throw new Error("offline");
        };

        plan = completeSlot(
            plan,
            plan.days[0].id,
            "primary",
            feedback,
            { useBackendProgression: true }
        );
        plan = await applyProgressionDecision(
            plan,
            plan.days[0].id,
            "primary",
            { useBackendProgression: true, evaluate: offline }
        );

        plan = completeSlot(
            plan,
            plan.days[1].id,
            "primary",
            feedback,
            { useBackendProgression: true }
        );
        plan = await applyProgressionDecision(
            plan,
            plan.days[1].id,
            "primary",
            { useBackendProgression: true, evaluate: offline }
        );

        // The mobility habit has one session of its own, not two shared ones.
        expect(plan.days[3].primary.habitId).toBe("movement-mobility-3");
        expect(plan.days[3].primary.progressionLevel).toBe(1);
        expect(plan.days[3].primary.dose).toBe(3);
    });

    it("lifts a backend dose above spare time and caps it at ten minutes", async () => {
        vi.stubEnv("VITE_USE_BACKEND_PROGRESSION", "true");
        stubCatalog();

        const shortProfile = {
            ...movementProfile,
            answers: { ...movementProfile.answers, time: "5 minutes" },
        };
        const plan = await buildPlanAsync(shortProfile, startDate);

        expect(plan.days[0].primary.dose).toBe(5);

        const completed = completeSlot(
            plan,
            plan.days[0].id,
            "primary",
            {
                difficulty: "easy",
                barrier: "Nothing in particular",
                safety: "none",
            },
            { useBackendProgression: true }
        );
        const next = await applyProgressionDecision(
            completed,
            plan.days[0].id,
            "primary",
            {
                useBackendProgression: true,
                evaluate: async () => ({
                    action: "increase",
                    reason: "The user met the progression criteria.",
                    current_level: 1,
                    recommended_level: 4,
                    current_target: 5,
                    recommended_target: 15,
                }),
            }
        );

        expect(next.days[1].primary.dose).toBe(10);
        expect(next.days[1].primary.progressionLevel).toBe(4);
        expect(next.days[1].primary.durationLabel).toBe("10 min");
    });
    it("fetches backend catalogs for every goal domain in the plan", async () => {
        vi.stubEnv("VITE_USE_BACKEND_PROGRESSION", "true");
        const fetchMock = stubDomainCatalog({
            nutrition: [nutritionHabit],
            sleep: [
                {
                    ...backendHabit,
                    habit_id: "sleep-wind-down",
                    domain: "sleep",
                    title: "A ten-minute wind-down",
                    progression_profiles: [
                        {
                            ...backendHabit.progression_profiles[0],
                            levels: [10, 12, 15, 20].map(
                                (value, index) => ({
                                    level: index + 1,
                                    name: [
                                        "Getting started",
                                        "Building consistency",
                                        "Growing stronger",
                                        "Making it a routine",
                                    ][index],
                                    target: {
                                        metric: "duration_minutes",
                                        value,
                                    },
                                })
                            ),
                        },
                    ],
                },
            ],
        });

        const plan = await buildPlanAsync(
            {
                primaryGoalId: "nutrition",
                secondaryGoalId: "sleep",
                goalIds: ["nutrition", "sleep"],
                answers: {},
            },
            startDate
        );

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/habits/nutrition",
            expect.anything()
        );
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/habits/sleep",
            expect.anything()
        );
        expect(plan.days[0].primary.domain).toBe("nutrition");
        expect(plan.days[0].primary.source).toBe("backend");
        expect(plan.days[0].primary.dose).toBe(2);
        expect(plan.days[0].secondary.domain).toBe("sleep");
        expect(plan.days[0].secondary.dose).toBe(10);
    });

    it("applies backend progression to a nutrition habit", async () => {
        vi.stubEnv("VITE_USE_BACKEND_PROGRESSION", "true");
        stubDomainCatalog({ nutrition: [nutritionHabit] });

        const plan = await buildPlanAsync(
            {
                primaryGoalId: "nutrition",
                goalIds: ["nutrition"],
                answers: {},
            },
            startDate
        );
        const dayId = plan.days[0].id;
        const completed = completeSlot(
            plan,
            dayId,
            "primary",
            {
                difficulty: "easy",
                barrier: "Nothing in particular",
                safety: "none",
            },
            { useBackendProgression: true }
        );
        const next = await applyProgressionDecision(
            completed,
            dayId,
            "primary",
            {
                useBackendProgression: true,
                evaluate: async () => ({
                    action: "increase",
                    reason: "The user met the progression criteria.",
                    current_level: 1,
                    recommended_level: 2,
                    current_target: 2,
                    recommended_target: 3,
                }),
            }
        );

        expect(next.days[1].primary.domain).toBe("nutrition");
        expect(next.days[1].primary.dose).toBe(3);
        expect(next.days[1].primary.progressionLevel).toBe(2);
    });
});

describe("backend fallback safety", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("keeps local feedback adaptation when the plan fell back to local actions", async () => {
        vi.stubEnv("VITE_USE_BACKEND_PROGRESSION", "true");
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new Error("offline");
            })
        );

        const plan = await buildPlanAsync(movementProfile, startDate);

        expect(plan.days[0].primary.source).toBeUndefined();

        const next = completeSlot(
            plan,
            plan.days[0].id,
            "primary",
            {
                difficulty: "too_much",
                barrier: "Nothing in particular",
                safety: "none",
            },
            { useBackendProgression: true }
        );

        expect(next.days[1].primary.adapted).toBe(true);
        expect(next.days[1].primary.dose).toBe(
            next.days[1].primary.fallback.dose
        );
    });
});

describe("movement context and safety ceiling", () => {
    it("starts with gentle mobility for older adults or balance focus", () => {
        const plan = buildPlan(
            {
                ...movementProfile,
                answers: {
                    ...movementProfile.answers,
                    barrier: "Low energy",
                    context: "Age 65+ / balance focus",
                },
            },
            startDate
        );

        expect(plan.days[0].primary.id).toBe("movement-mobility-3");
        expect(plan.days[0].primary.dose).toBe(
            plan.days[0].primary.fallback.dose
        );
    });

    it("starts with a short walk for blood sugar or heart health", () => {
        const plan = buildPlan(
            {
                ...movementProfile,
                answers: {
                    ...movementProfile.answers,
                    barrier: "Low energy",
                    context: "Managing blood sugar or heart health",
                },
            },
            startDate
        );

        expect(plan.days[0].primary.id).toBe("movement-walk-5");
    });

    it("keeps discomfort or pain ahead of context preferences", () => {
        const plan = buildPlan(
            {
                ...movementProfile,
                answers: {
                    ...movementProfile.answers,
                    barrier: "Discomfort or pain",
                    context: "Managing blood sugar or heart health",
                },
            },
            startDate
        );

        expect(plan.days[0].primary.id).toBe("movement-mobility-3");
    });

    it("never schedules a movement bout over ten minutes", () => {
        const plan = buildPlan(
            {
                ...movementProfile,
                answers: {
                    ...movementProfile.answers,
                    time: "30 minutes",
                    barrier: "I lose motivation",
                },
            },
            startDate
        );

        expect(plan.days[0].primary.dose).toBeLessThanOrEqual(10);
    });
});
