import { describe, expect, it } from "vitest";
import {
    buildJourneyExportPayload,
    claimLegacyJourney,
    clearJourney,
    getJourneyStorageKey,
    JOURNEY_VERSION,
    loadJourney,
    loadOrMigrateJourney,
    saveJourney,
} from "./planStore";
import { buildPlan, completeSlot, getActionableDay } from "./planEngine";

const USER_ID = "user-alice";

function makeJourney(id = "plan-1") {
    return {
        profile: { primaryGoalId: "movement" },
        plan: { id, days: [] },
    };
}

describe("planStore", () => {
    it("saves and loads a journey for one account", () => {
        const journey = makeJourney();

        expect(saveJourney(USER_ID, journey)).toBe(true);
        expect(loadJourney(USER_ID)).toMatchObject(journey);
        expect(loadJourney(USER_ID).version).toBe(JOURNEY_VERSION);
        expect(
            window.localStorage.getItem(getJourneyStorageKey(USER_ID))
        ).toBeTruthy();
    });

    it("keeps separate journeys for separate accounts", () => {
        saveJourney(USER_ID, makeJourney("alice-plan"));
        saveJourney("user-bob", makeJourney("bob-plan"));

        expect(loadJourney(USER_ID).plan.id).toBe("alice-plan");
        expect(loadJourney("user-bob").plan.id).toBe("bob-plan");
    });

    it("resets a journey without the current schema version", () => {
        window.localStorage.setItem(
            getJourneyStorageKey(USER_ID),
            JSON.stringify(makeJourney("legacy-plan"))
        );

        expect(loadJourney(USER_ID)).toBeNull();
        expect(
            window.localStorage.getItem(getJourneyStorageKey(USER_ID))
        ).toBeNull();
    });

    it("claims an existing local journey for the first signed-in account", () => {
        const legacyJourney = {
            ...makeJourney("legacy-plan"),
            version: JOURNEY_VERSION,
        };
        window.localStorage.setItem(
            "sproutly.journey.v1",
            JSON.stringify(legacyJourney)
        );

        const migrated = claimLegacyJourney(USER_ID);

        expect(migrated).toMatchObject(legacyJourney);
        expect(window.localStorage.getItem("sproutly.journey.v1")).toBeNull();
        expect(loadJourney(USER_ID)).toMatchObject(legacyJourney);
    });

    it("loads an account journey before considering the legacy journey", () => {
        saveJourney(USER_ID, makeJourney("account-plan"));
        window.localStorage.setItem(
            "sproutly.journey.v1",
            JSON.stringify({
                ...makeJourney("legacy-plan"),
                version: JOURNEY_VERSION,
            })
        );

        expect(loadOrMigrateJourney(USER_ID).plan.id).toBe("account-plan");
        expect(window.localStorage.getItem("sproutly.journey.v1")).toBeTruthy();
    });

    it("returns null when no journey exists", () => {
        expect(loadJourney(USER_ID)).toBeNull();
        expect(claimLegacyJourney(USER_ID)).toBeNull();
        expect(loadOrMigrateJourney(USER_ID)).toBeNull();
    });

    it("clears only one account's stored journey", () => {
        saveJourney(USER_ID, makeJourney());
        saveJourney("user-bob", makeJourney("bob-plan"));

        expect(clearJourney(USER_ID)).toBe(true);
        expect(loadJourney(USER_ID)).toBeNull();
        expect(loadJourney("user-bob").plan.id).toBe("bob-plan");
    });

    it("builds an export payload with versioning and metrics", () => {
        const journey = makeJourney("export-plan");
        const outcomeMetrics = {
            persistence: { completionRate: 75 },
            resilience: { score: 80 },
        };
        const payload = buildJourneyExportPayload(
            journey,
            outcomeMetrics
        );

        expect(payload).toMatchObject({
            ...journey,
            version: JOURNEY_VERSION,
            outcomeMetrics,
        });
    });

    it("keeps outcome metrics out of the export when not selected", () => {
        const payload = buildJourneyExportPayload(makeJourney());

        expect(payload.version).toBe(JOURNEY_VERSION);
        expect(payload).not.toHaveProperty("outcomeMetrics");
    });

    it("keeps the same open day after a reload", () => {
        const plan = buildPlan({
            primaryGoalId: "movement",
            goalIds: ["movement"],
            answers: { time: "10 minutes", barrier: "Not enough time" },
        });
        const finished = completeSlot(
            plan,
            plan.days[0].id,
            "primary",
            {
                difficulty: "comfortable",
                barrier: "Nothing in particular",
                safety: "none",
            }
        );

        saveJourney(USER_ID, {
            profile: { primaryGoalId: "movement" },
            plan: finished,
        });

        const reloaded = loadJourney(USER_ID);

        expect(getActionableDay(reloaded.plan).id).toBe(finished.days[1].id);
        expect(reloaded.plan.days[0].primary.status).toBe("completed");
    });
});
