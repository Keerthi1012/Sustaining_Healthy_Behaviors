import { beforeEach, describe, expect, it } from "vitest";

import {
    DEFAULT_ECOSYSTEM_CONTEXT,
    getSampleAbuDhabiProfile,
    loadEcosystemContext,
    normalizeEcosystemContext,
    resetEcosystemContext,
    saveEcosystemContext,
} from "./ecosystemStore";
import {
    applyEcosystemContext,
    buildPlan,
    completeSlot,
} from "./planEngine";
import { getExerciseContent } from "../content/exercises";

const movementProfile = {
    primaryGoalId: "movement",
    goalIds: ["movement"],
    answers: {
        activity: "A little active",
        time: "10 minutes",
        barrier: "Not enough time",
    },
};

const sleepProfile = {
    primaryGoalId: "sleep",
    goalIds: ["sleep"],
    answers: {
        sleepHours: "6-7 hours",
        sleepChallenge: "Irregular sleep schedule",
        barrier: "Racing thoughts",
    },
};

const nutritionProfile = {
    primaryGoalId: "nutrition",
    goalIds: ["nutrition"],
    answers: {},
};

const startDate = new Date(2026, 0, 5);
const feedback = {
    difficulty: "comfortable",
    barrier: "Nothing in particular",
    safety: "none",
};

function withFlags(flags = {}, overrides = {}) {
    return normalizeEcosystemContext({
        ...DEFAULT_ECOSYSTEM_CONTEXT,
        ...overrides,
        contextFlags: {
            ...DEFAULT_ECOSYSTEM_CONTEXT.contextFlags,
            ...flags,
        },
    });
}

describe("ecosystem context store", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("fills defaults and clamps out-of-range values", () => {
        const context = normalizeEcosystemContext({
            healthAgeDelta: 99,
            screeningRisk: "unknown",
            wearableBaseline: { dailySteps: -20 },
            contextFlags: { extremeHeatMode: "yes" },
            updatedAt: 42,
        });

        expect(context).toEqual({
            ...DEFAULT_ECOSYSTEM_CONTEXT,
            healthAgeDelta: 10,
            wearableBaseline: {
                dailySteps: 0,
                avgSleepMinutes: 420,
            },
            contextFlags: {
                extremeHeatMode: true,
                shiftWorker: false,
                fasting: false,
                mobilitySupport: false,
            },
            updatedAt: null,
        });
    });

    it("returns defaults when nothing is stored", () => {
        expect(loadEcosystemContext("user-a")).toEqual(
            DEFAULT_ECOSYSTEM_CONTEXT
        );
    });

    it("round-trips context per user and stamps the save time", () => {
        const saved = saveEcosystemContext("user-a", {
            contextFlags: { extremeHeatMode: true },
            healthAgeDelta: 2,
        });

        expect(saved.updatedAt).toEqual(expect.any(String));

        const loaded = loadEcosystemContext("user-a");
        expect(loaded.contextFlags.extremeHeatMode).toBe(true);
        expect(loaded.healthAgeDelta).toBe(2);
        expect(loaded.updatedAt).toBe(saved.updatedAt);

        expect(loadEcosystemContext("user-b")).toEqual(
            DEFAULT_ECOSYSTEM_CONTEXT
        );
    });

    it("resets a stored context back to defaults", () => {
        saveEcosystemContext("user-a", {
            contextFlags: { fasting: true },
        });

        const reset = resetEcosystemContext("user-a");

        expect(reset).toEqual(DEFAULT_ECOSYSTEM_CONTEXT);
        expect(loadEcosystemContext("user-a")).toEqual(
            DEFAULT_ECOSYSTEM_CONTEXT
        );
    });

    it("recovers from corrupted storage", () => {
        window.localStorage.setItem(
            "sproutly.ecosystem.v1.user-a",
            "{not json"
        );

        expect(loadEcosystemContext("user-a")).toEqual(
            DEFAULT_ECOSYSTEM_CONTEXT
        );
    });

    it("provides realistic Abu Dhabi demo presets", () => {
        const shift = getSampleAbuDhabiProfile("shift_nurse");
        const heat = getSampleAbuDhabiProfile("desk_heat");

        expect(shift.source).toBe("sahatna_malaffi_demo");
        expect(shift.contextFlags.shiftWorker).toBe(true);
        expect(shift.wearableBaseline.avgSleepMinutes).toBe(330);
        expect(shift.screeningRisk).toBe("hypertension");

        expect(heat.contextFlags.extremeHeatMode).toBe(true);
        expect(heat.wearableBaseline.dailySteps).toBe(4200);

        expect(getSampleAbuDhabiProfile("unknown")).toBeNull();
    });
});

describe("plan calibration from ecosystem context", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("keeps existing plans unchanged without a context", () => {
        const plan = buildPlan(movementProfile, startDate);

        expect(plan.ecosystemContext).toEqual(DEFAULT_ECOSYSTEM_CONTEXT);
        expect(plan.days[0].primary.adaptationTag).toBeNull();
        expect(plan.days[0].primary.clinicalFocusTag).toBeNull();
    });

    it("keeps heat-sensitive movement indoors", () => {
        const context = withFlags({ extremeHeatMode: true });
        const plan = buildPlan(movementProfile, startDate, {
            ecosystemContext: context,
        });
        const entry = plan.days[0].primary;

        expect(entry.adaptationTag).toBe("indoor_heat_safe");
        expect(entry.anchor).toMatch(/^Indoors/);
        expect(entry.why).toContain("extreme heat");
        expect(plan.ecosystemContext.contextFlags.extremeHeatMode).toBe(
            true
        );
    });

    it("prioritises comfortable morning movement for mobility support", () => {
        const context = withFlags({
            extremeHeatMode: true,
            mobilitySupport: true,
        });
        const plan = buildPlan(movementProfile, startDate, {
            ecosystemContext: context,
        });

        expect(plan.days[0].primary.id).toBe("movement-mobility-3");
        expect(plan.days[0].primary.adaptationTag).toBe(
            "mobility_adapted"
        );
    });

    it("starts conservatively when steps are low or Health Age is higher", () => {
        const deskHeat = getSampleAbuDhabiProfile("desk_heat");
        const baseline = buildPlan(movementProfile, startDate);
        const calibrated = buildPlan(movementProfile, startDate, {
            ecosystemContext: deskHeat,
        });

        expect(baseline.days[0].primary.dose).toBe(3);
        expect(calibrated.days[0].primary.dose).toBe(2);
    });

    it("aligns sleep cues to a shift schedule", () => {
        const shift = getSampleAbuDhabiProfile("shift_nurse");
        const plan = buildPlan(sleepProfile, startDate, {
            ecosystemContext: shift,
        });
        const entry = plan.days[0].primary;

        expect(entry.id).toBe("sleep-wind-down");
        expect(entry.adaptationTag).toBe("shift_aligned");
        expect(entry.anchor).toContain("90 minutes");
        expect(entry.why).toContain("shift schedule");
    });

    it("places nutrition cues in non-fasting windows", () => {
        const fasting = withFlags({ fasting: true });
        const plan = buildPlan(nutritionProfile, startDate, {
            ecosystemContext: fasting,
        });
        const entry = plan.days[0].primary;

        expect(entry.adaptationTag).toBe("fasting_aligned");
        expect(entry.anchor).toContain("Iftar");
        expect(entry.why).toContain("non-fasting window");
    });

    it("attaches the screening focus to every step", () => {
        const context = withFlags(
            {},
            { screeningRisk: "hypertension" }
        );
        const plan = buildPlan(movementProfile, startDate, {
            ecosystemContext: context,
        });

        expect(plan.days[0].primary.clinicalFocusTag).toBe(
            "hypertension"
        );
        expect(plan.days[0].secondary).toBeNull();
    });

    it("re-adapts only upcoming steps and keeps completed history", () => {
        const plan = buildPlan(movementProfile, startDate);
        const completed = completeSlot(
            plan,
            plan.days[0].id,
            "primary",
            feedback
        );
        const completedEntry = completed.days[0].primary;
        const next = applyEcosystemContext(
            completed,
            withFlags({ extremeHeatMode: true })
        );

        expect(next.days[0].primary).toEqual(completedEntry);
        expect(next.days[1].primary.adaptationTag).toBe(
            "indoor_heat_safe"
        );
        expect(next.adaptations.at(-1).type).toBe("ecosystem");
        expect(
            next.ecosystemContext.contextFlags.extremeHeatMode
        ).toBe(true);
        expect(
            completed.days[1].primary.adaptationTag
        ).toBeNull();
    });

    it("restores the base guidance when a flag is turned off", () => {
        const heat = withFlags({ extremeHeatMode: true });
        const plan = buildPlan(movementProfile, startDate, {
            ecosystemContext: heat,
        });
        const baseWhy = plan.days[1].primary.baseWhy;
        const next = applyEcosystemContext(
            plan,
            DEFAULT_ECOSYSTEM_CONTEXT
        );
        const entry = next.days[1].primary;

        expect(entry.adaptationTag).toBeNull();
        expect(entry.anchor).toBe(
            plan.days[1].primary.baseAnchor
        );
        expect(entry.why).toBe(baseWhy);
    });

    it("does not shift doses while the plan is paused", () => {
        const plan = {
            ...buildPlan(movementProfile, startDate),
            paused: true,
        };
        const next = applyEcosystemContext(
            plan,
            withFlags({ extremeHeatMode: true })
        );

        expect(next.days[0].primary).toEqual(plan.days[0].primary);
        expect(next.paused).toBe(true);
        expect(next.adaptations.at(-1).type).toBe("ecosystem");
    });

    it("never clears an existing safety pause", () => {
        const plan = {
            ...buildPlan(movementProfile, startDate),
            safetyPause: true,
            safetyMessage: "Review before continuing.",
        };
        const next = applyEcosystemContext(
            plan,
            withFlags({}, { healthAgeDelta: 5 })
        );

        expect(next.safetyPause).toBe(true);
        expect(next.safetyMessage).toBe(
            "Review before continuing."
        );
    });

    it("localises adaptation guidance in Arabic without touching stored data", () => {
        const context = withFlags({ extremeHeatMode: true });
        const plan = buildPlan(movementProfile, startDate, {
            ecosystemContext: context,
        });
        const entry = plan.days[1].primary;
        const arabic = getExerciseContent(entry, "ar");

        expect(arabic.anchor).toContain("داخل المبنى");
        expect(arabic.why).toContain("الحرارة الشديدة");
        expect(entry.anchor).toMatch(/^Indoors/);
        expect(entry.why).toContain("extreme heat");
    });
});
