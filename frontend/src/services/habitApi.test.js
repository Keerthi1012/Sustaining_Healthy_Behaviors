import { describe, expect, it, vi } from "vitest";
import {
    evaluateHabitProgression,
    fetchHabitsForGoal,
    fetchMovementActions,
    fetchMovementProgression,
    mapHabitToAction,
} from "./habitApi";

const habit = {
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
    limits: "General wellbeing support, not medical advice.",
    active: true,
};

function jsonResponse(data, ok = true) {
    return {
        ok,
        status: ok ? 200 : 500,
        headers: { get: () => "application/json" },
        json: async () => data,
    };
}

function catalogResponse() {
    return jsonResponse({
        schema_version: "1.0.0",
        catalog_version: "1.0.0",
        domain: "movement",
        reviewed_at: "2026-11-14",
        boundaries: {
            not_for: ["Medical treatment."],
            seek_help_if: ["Chest pain."],
            population_exclusions: [],
        },
        safety_rules: {
            screening: ["Ask about chest pain."],
            signals: [
                {
                    code: "pain",
                    label: "Pain",
                    guidance: "Pause the activity.",
                },
            ],
        },
        habits: [habit],
    });
}

describe("habitApi", () => {
    it("maps a backend habit into the client action shape", () => {
        const action = mapHabitToAction(habit);

        expect(action.id).toBe("movement-walk-5");
        expect(action.habitId).toBe("movement-walk-5");
        expect(action.domain).toBe("movement");
        expect(action.title).toBe("Short walk");
        expect(action.baseDose).toBe(5);
        expect(action.fallbackDose).toBe(3);
        expect(action.measure).toBe("duration_minutes");
        expect(action.why).toBe("Increase the walk when feedback supports it.");
        expect(action.bctIds).toEqual(["1.4", "8.7"]);
        expect(action.progressionLevels).toEqual([
            { level: 1, name: "Getting started", minutes: 5 },
            { level: 2, name: "Building consistency", minutes: 7 },
            { level: 3, name: "Growing stronger", minutes: 10 },
            { level: 4, name: "Making it a routine", minutes: 15 },
        ]);
        expect(action.progressionPolicy.min_successful_sessions).toBe(2);
        expect(action.clinicalBasis).toContain("WHO (2020)");
        expect(action.limits).toBe(
            "General wellbeing support, not medical advice."
        );
        expect(action.source).toBe("backend");
    });

    it("fetches movement actions with the auth token", async () => {
        const fetchMock = vi.fn(async () => catalogResponse());
        vi.stubGlobal("fetch", fetchMock);

        const actions = await fetchMovementActions({ token: "abc" });

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/habits/movement",
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer abc",
                }),
            })
        );
        expect(actions).toHaveLength(1);
        expect(actions[0].id).toBe("movement-walk-5");
        expect(actions[0].catalogVersion).toBe("1.0.0");
        expect(actions[0].catalogReviewedAt).toBe("2026-11-14");
        expect(actions[0].boundaries.seek_help_if).toEqual(["Chest pain."]);
        expect(actions[0].safetyRules.signals[0].code).toBe("pain");
    });

    it("fetches nutrition actions from the shared catalog endpoint", async () => {
        const fetchMock = vi.fn(async () =>
            jsonResponse({
                schema_version: "1.0.0",
                domain: "nutrition",
                habits: [
                    {
                        ...habit,
                        habit_id: "nutrition-veggie-first",
                        domain: "nutrition",
                        title: "Add a vegetable first",
                    },
                ],
            })
        );
        vi.stubGlobal("fetch", fetchMock);

        const actions = await fetchHabitsForGoal("nutrition", {
            token: "abc",
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/habits/nutrition",
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer abc",
                }),
            })
        );
        expect(actions[0].domain).toBe("nutrition");
    });

    it("posts progression previews to the selected domain", async () => {
        const fetchMock = vi.fn(async () =>
            jsonResponse({
                action: "increase",
                reason: "ok",
                current_level: 1,
                recommended_level: 2,
                current_target: 5,
                recommended_target: 7,
            })
        );
        vi.stubGlobal("fetch", fetchMock);

        await evaluateHabitProgression("smoking", {
            habitId: "smoking-delay-5",
            currentLevel: 1,
        });

        expect(fetchMock.mock.calls[0][0]).toBe(
            "/api/habits/smoking/progression"
        );
    });

    it("throws when the catalog request fails so callers can fall back", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => jsonResponse({ detail: "down" }, false))
        );

        await expect(fetchMovementActions()).rejects.toThrow("down");
    });

    it("posts normalized feedback to the progression preview", async () => {
        const fetchMock = vi.fn(async () =>
            jsonResponse({
                action: "increase",
                reason: "ok",
                current_level: 1,
                recommended_level: 2,
                current_target: 5,
                recommended_target: 7,
            })
        );
        vi.stubGlobal("fetch", fetchMock);

        const decision = await fetchMovementProgression({
            habitId: "movement-walk-5",
            currentLevel: 1,
            progressionPaused: false,
            feedbackHistory: [
                {
                    completed: true,
                    difficulty: "too_much",
                    safety: "pain",
                    recordedAt: "2026-01-01T10:00:00Z",
                },
            ],
            token: "abc",
        });

        expect(decision.action).toBe("increase");

        const [url, options] = fetchMock.mock.calls[0];

        expect(url).toBe("/api/habits/movement/progression");
        expect(options.method).toBe("POST");

        const body = JSON.parse(options.body);

        expect(body.habit_id).toBe("movement-walk-5");
        expect(body.current_level).toBe(1);
        expect(body.progression_paused).toBe(false);
        expect(body.feedback_history[0]).toEqual({
            completed: true,
            difficulty: "uncomfortable",
            safety_signal: "pain",
            recorded_at: "2026-01-01T10:00:00Z",
        });
    });
});
