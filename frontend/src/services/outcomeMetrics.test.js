import { describe, expect, it } from "vitest";

import {
    applyReturn,
    buildPlan,
    completeSlot,
    shrinkSlot,
} from "./planEngine";
import { getOutcomeMetrics } from "./outcomeMetrics";

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

const safetyFeedback = {
    difficulty: "comfortable",
    barrier: "Nothing in particular",
    safety: "pain",
};

function build(startDate = new Date(2026, 0, 5)) {
    return buildPlan(profile, startDate);
}

function setCompletionDate(plan, dayIndex, slot, dateKey) {
    return {
        ...plan,
        days: plan.days.map((day, index) =>
            index === dayIndex
                ? {
                    ...day,
                    [slot]: {
                        ...day[slot],
                        completedAt: `${dateKey}T12:00:00`,
                    },
                }
                : day
        ),
    };
}

function completeDay(
    plan,
    dayIndex,
    options = {}
) {
    const day = plan.days[dayIndex];
    const slot = options.slot ?? "primary";
    const completed = completeSlot(
        plan,
        day.id,
        slot,
        options.feedback ?? feedback
    );

    return setCompletionDate(
        completed,
        dayIndex,
        slot,
        options.dateKey ?? day.date
    );
}

describe("getOutcomeMetrics", () => {
    it("returns a safe empty report without a plan", () => {
        const metrics = getOutcomeMetrics(null, null, {
            todayKey: "2026-01-10",
        });

        expect(metrics.persistence.completionRate).toBe(0);
        expect(metrics.persistence.completedMoments).toBe(0);
        expect(metrics.retention).toMatchObject({
            activeDays: 0,
            activeLast7: 0,
            activeLast28: 0,
            elapsedDays: 0,
            daysSinceLastComplete: 0,
            retained7: false,
            retained28: false,
            returnCount: 0,
        });
        expect(metrics.behaviour).toMatchObject({
            activityMinutes: 0,
            activityCount: 0,
            completedMoments: 0,
        });
        expect(metrics.equityLens).toMatchObject({
            locale: "en",
            accommodations: [],
            screeningFocus: "none",
            cohortComparisonAvailable: false,
        });
        expect(metrics.resilience).toMatchObject({
            bounceBacks: 0,
            doseShrinkSaves: 0,
            safetyPauses: 0,
            score: 0,
        });
        expect(metrics.trajectory).toMatchObject({
            hasContext: false,
            baselineHealthAgeDelta: null,
            projectedDeltaShift: 0,
            biomarkerNoteKey: null,
        });
        expect(metrics.inclusion.locale).toBe("en");
        expect(metrics.inclusion.privacyMode).toBe("local-first");
    });

    it("uses calendar-elapsed moments for persistence", () => {
        const plan = build(new Date(2026, 0, 5));
        const completed = completeDay(plan, 0);
        const metrics = getOutcomeMetrics(completed, null, {
            todayKey: "2026-01-10",
        });

        expect(metrics.persistence).toMatchObject({
            completedMoments: 1,
            pausedMoments: 0,
            missedMoments: 4,
            openMoments: 1,
            eligibleMoments: 6,
            completionRate: 17,
            activeRealms: ["movement"],
            sustainedWindowLabel: "starting",
        });
        expect(metrics.retention).toMatchObject({
            activeDays: 1,
            activeLast7: 1,
            activeLast28: 1,
            elapsedDays: 6,
            daysSinceLastComplete: 5,
            retained7: false,
            retained28: false,
        });
        expect(metrics.behaviour).toMatchObject({
            completedMoments: 1,
            activityMinutes: 0,
        });
        expect(metrics.behaviour.movementMinutes).toBe(
            plan.days[0].primary.dose
        );
        expect(metrics.behaviour.byRealm.movement).toMatchObject({
            total: 6,
            completed: 1,
            activeDays: 1,
        });
    });

    it("keeps safety pauses out of the completion denominator", () => {
        const plan = build(new Date(2026, 0, 5));
        const completed = completeDay(plan, 0);
        const paused = completeDay(completed, 1, {
            feedback: safetyFeedback,
        });
        const metrics = getOutcomeMetrics(paused, null, {
            todayKey: "2026-01-10",
        });

        expect(metrics.persistence.completedMoments).toBe(1);
        expect(metrics.persistence.pausedMoments).toBe(1);
        expect(metrics.persistence.eligibleMoments).toBe(5);
        expect(metrics.persistence.completionRate).toBe(20);
        expect(metrics.resilience.safetyPauses).toBe(1);
        expect(metrics.resilience.score).toBeGreaterThan(0);
    });

    it("requires elapsed time and completed moments for sustained status", () => {
        const start = new Date(2026, 0, 5);
        let plan = build(start);

        for (let index = 0; index < 10; index += 1) {
            plan = completeDay(plan, index);
        }

        const early = getOutcomeMetrics(plan, null, {
            todayKey: "2026-01-05",
        });

        expect(early.persistence.completedMoments).toBe(10);
        expect(early.retention.elapsedDays).toBe(1);
        expect(early.persistence.sustainedWindowLabel).toBe(
            "building"
        );

        const later = getOutcomeMetrics(plan, null, {
            todayKey: "2026-01-25",
        });

        expect(later.retention.elapsedDays).toBe(21);
        expect(later.retention.retained7).toBe(true);
        expect(later.retention.retained28).toBe(false);
        expect(later.persistence.sustainedWindowLabel).toBe(
            "sustained"
        );
    });

    it("counts returns and late completions without double counting", () => {
        const plan = build(new Date(2026, 0, 5));
        const returned = applyReturn(plan);
        const returnedAgain = applyReturn(returned);
        const completed = completeDay(returnedAgain, 0);
        const later = completeDay(completed, 1, {
            dateKey: "2026-01-10",
        });
        const metrics = getOutcomeMetrics(later, null, {
            todayKey: "2026-01-10",
        });

        expect(metrics.resilience.bounceBacks).toBe(2);
    });

    it("counts completed smaller steps as dose-shrink saves", () => {
        const plan = build(new Date(2026, 0, 5));
        const smaller = shrinkSlot(
            plan,
            plan.days[0].id,
            "primary"
        );
        const completed = completeDay(smaller, 0);
        const metrics = getOutcomeMetrics(completed, null, {
            todayKey: "2026-01-05",
        });

        expect(metrics.resilience.doseShrinkSaves).toBe(1);
    });

    it("counts adjusted next steps as dose-shrink saves", () => {
        const plan = build(new Date(2026, 0, 5));
        const gentler = completeDay(plan, 0, {
            feedback: {
                difficulty: "too_much",
                barrier: "Nothing in particular",
                safety: "none",
            },
        });
        const completed = completeDay(gentler, 1);
        const metrics = getOutcomeMetrics(completed, null, {
            todayKey: "2026-01-06",
        });

        expect(metrics.resilience.doseShrinkSaves).toBe(1);
    });

    it("uses a legacy fallback when adjusted targets lack metadata", () => {
        const plan = build(new Date(2026, 0, 5));
        const gentler = completeDay(plan, 0, {
            feedback: {
                difficulty: "too_much",
                barrier: "Nothing in particular",
                safety: "none",
            },
        });
        const legacy = {
            ...gentler,
            adaptations: gentler.adaptations.map((adaptation) => {
                const copy = { ...adaptation };
                delete copy.targetDayId;
                delete copy.targetSlot;
                return copy;
            }),
        };
        const completed = completeDay(legacy, 1);
        const metrics = getOutcomeMetrics(completed, null, {
            todayKey: "2026-01-06",
        });

        expect(metrics.resilience.doseShrinkSaves).toBe(1);
    });

    it("scores completion consistency, returns and saves", () => {
        const start = new Date(2026, 0, 5);
        let plan = build(start);

        for (let index = 0; index < 3; index += 1) {
            plan = completeDay(plan, index);
        }

        const perfect = getOutcomeMetrics(plan, null, {
            todayKey: "2026-01-05",
        });

        expect(perfect.persistence.completionRate).toBe(100);
        expect(perfect.resilience.score).toBe(70);

        const returned = applyReturn(plan);
        const recovered = completeDay(returned, 3);
        const withReturn = getOutcomeMetrics(recovered, null, {
            todayKey: "2026-01-05",
        });

        expect(withReturn.resilience.bounceBacks).toBe(1);
        expect(withReturn.resilience.score).toBeGreaterThan(
            perfect.resilience.score
        );
    });

    it("does not collapse the score after a safety pause", () => {
        const start = new Date(2026, 0, 5);
        let plan = build(start);

        for (let index = 0; index < 3; index += 1) {
            plan = completeDay(plan, index);
        }

        const before = getOutcomeMetrics(plan, null, {
            todayKey: "2026-01-05",
        });
        const paused = completeDay(plan, 3, {
            feedback: safetyFeedback,
        });
        const after = getOutcomeMetrics(paused, null, {
            todayKey: "2026-01-05",
        });

        expect(after.resilience.safetyPauses).toBe(1);
        expect(after.resilience.score).toBe(
            before.resilience.score
        );
    });

    it("calculates a capped, conservative trajectory from context", () => {
        const context = {
            updatedAt: "2026-01-05T08:00:00.000Z",
            healthAgeDelta: 3,
            screeningRisk: "prediabetes",
        };
        const start = new Date(2026, 0, 5);
        let plan = build(start);

        for (let index = 0; index < 3; index += 1) {
            plan = completeDay(plan, index);
        }

        const metrics = getOutcomeMetrics(plan, context, {
            todayKey: "2026-01-05",
        });

        expect(metrics.trajectory).toMatchObject({
            hasContext: true,
            baselineHealthAgeDelta: 3,
            projectedDeltaShift: -0.2,
            projectedHealthAgeDelta: 2.8,
            clinicalFocus: "prediabetes",
            biomarkerNoteKey: "outcomes.biomarker.prediabetes",
            completionsConsidered: 3,
        });
    });

    it("caps trajectory improvement and requires three completions", () => {
        const context = {
            updatedAt: "2026-01-05T08:00:00.000Z",
            healthAgeDelta: 4,
            screeningRisk: "hypertension",
        };
        let plan = build(new Date(2026, 0, 5));

        for (let index = 0; index < 2; index += 1) {
            plan = completeDay(plan, index);
        }

        const early = getOutcomeMetrics(plan, context, {
            todayKey: "2026-01-05",
        });

        expect(early.trajectory.projectedDeltaShift).toBe(0);

        for (let index = 2; index < 28; index += 1) {
            plan = completeDay(plan, index);
        }

        const capped = getOutcomeMetrics(plan, context, {
            todayKey: "2026-01-05",
        });

        expect(capped.trajectory.projectedDeltaShift).toBe(-1.5);
        expect(capped.trajectory.projectedHealthAgeDelta).toBe(2.5);
    });

    it("tracks day-28 continuity from an on-time completion", () => {
        const plan = build(new Date(2026, 0, 5));
        const completed = completeSlot(
            plan,
            plan.days[27].id,
            "primary",
            feedback
        );
        const late = setCompletionDate(
            completed,
            27,
            "primary",
            "2026-02-01"
        );
        const metrics = getOutcomeMetrics(late, null, {
            todayKey: "2026-02-02",
        });

        expect(metrics.retention).toMatchObject({
            activeDays: 1,
            elapsedDays: 29,
            retained7: true,
            retained28: true,
        });
    });

    it("adds synced activity minutes without changing plan movement", () => {
        const plan = build(new Date(2026, 0, 5));
        const completed = completeDay(plan, 0);
        const metrics = getOutcomeMetrics(completed, null, {
            todayKey: "2026-01-05",
            activities: [
                { duration_minutes: 12.5 },
                { duration_minutes: 7.5 },
            ],
        });

        expect(metrics.behaviour.activityCount).toBe(2);
        expect(metrics.behaviour.activityMinutes).toBe(20);
        expect(metrics.behaviour.movementMinutes).toBe(
            plan.days[0].primary.dose
        );
    });

    it("reports inclusion inputs and local-first sync status", () => {
        const context = {
            source: "sahatna_malaffi_demo",
            updatedAt: "2026-01-05T08:00:00.000Z",
            healthAgeDelta: 1,
            screeningRisk: "cardio_metabolic",
            contextFlags: {
                extremeHeatMode: true,
                shiftWorker: false,
                fasting: true,
                mobilitySupport: false,
            },
        };
        const metrics = getOutcomeMetrics(build(), context, {
            todayKey: "2026-01-05",
            locale: "ar",
            syncEnabled: true,
        });

        expect(metrics.inclusion).toMatchObject({
            locale: "ar",
            accommodations: ["heat", "fasting"],
            privacyMode: "local-first",
            syncEnabled: true,
            contextSource: "sahatna_malaffi_demo",
        });
        expect(metrics.equityLens).toMatchObject({
            locale: "ar",
            accommodations: ["heat", "fasting"],
            screeningFocus: "cardio_metabolic",
            contextSource: "sahatna_malaffi_demo",
            cohortComparisonAvailable: false,
            noteKey: "outcomes.equity.note",
        });
    });

    it("includes the learning ledger and insight", () => {
        let plan = build();
        plan = completeDay(plan, 0);
        plan = completeDay(plan, 1);
        const metrics = getOutcomeMetrics(plan, null, {
            todayKey: plan.days[2].date,
        });

        expect(metrics.learning.insight).toMatchObject({
            hasData: true,
            totalResolved: 2,
            effectiveCount: 2,
            comfortRate: 100,
        });
        expect(metrics.learning.actions.length).toBeGreaterThanOrEqual(1);
        expect(
            metrics.learning.actions.find(
                (item) => item.actionId === plan.days[0].primary.id
            )
        ).toMatchObject({
            actionId: plan.days[0].primary.id,
            resolved: 1,
            effective: 1,
        });
    });
});
