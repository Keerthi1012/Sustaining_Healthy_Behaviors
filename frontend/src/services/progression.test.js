import { describe, expect, it } from "vitest";
import {
    evaluateProgressionMirror,
    normalizeDifficulty,
    normalizeProgressionFeedback,
} from "./progression";

const levels = [
    { level: 1, minutes: 5 },
    { level: 2, minutes: 7 },
    { level: 3, minutes: 10 },
    { level: 4, minutes: 15 },
];

const policy = {
    enabled: true,
    lookback_sessions: 5,
    min_successful_sessions: 3,
    required_feedback: ["easy", "comfortable"],
};

function feedback(difficulty, at, safety = "none") {
    return {
        completed: true,
        difficulty,
        safety_signal: safety,
        recorded_at: at,
    };
}

describe("progression mirror", () => {
    it("increases after enough easy or comfortable sessions", () => {
        const decision = evaluateProgressionMirror({
            currentLevel: 1,
            levels,
            policy,
            feedbackHistory: [
                feedback("easy", "2026-01-01T10:00:00Z"),
                feedback("comfortable", "2026-01-02T10:00:00Z"),
                feedback("easy", "2026-01-03T10:00:00Z"),
            ],
        });

        expect(decision.action).toBe("increase");
        expect(decision.reason_code).toBe("criteria_met");
        expect(decision.recommended_level).toBe(2);
        expect(decision.recommended_target).toBe(7);
    });

    it("waits when there are not enough successful sessions", () => {
        const decision = evaluateProgressionMirror({
            currentLevel: 1,
            levels,
            policy,
            feedbackHistory: [
                feedback("comfortable", "2026-01-01T10:00:00Z"),
                feedback("easy", "2026-01-02T10:00:00Z"),
            ],
        });

        expect(decision.action).toBe("maintain");
        expect(decision.recommended_level).toBe(1);
    });

    it("prioritises a safety pause over progression", () => {
        const decision = evaluateProgressionMirror({
            currentLevel: 2,
            levels,
            policy,
            feedbackHistory: [
                feedback("easy", "2026-01-01T10:00:00Z"),
                feedback("easy", "2026-01-02T10:00:00Z"),
                feedback("easy", "2026-01-03T10:00:00Z"),
                feedback("easy", "2026-01-04T10:00:00Z", "pain"),
            ],
        });

        expect(decision.action).toBe("safety_pause");
        expect(decision.reason_code).toBe("safety_concern");
    });

    it("decreases one level after an uncomfortable session", () => {
        const decision = evaluateProgressionMirror({
            currentLevel: 3,
            levels,
            policy,
            feedbackHistory: [
                feedback("uncomfortable", "2026-01-04T10:00:00Z"),
            ],
        });

        expect(decision.action).toBe("decrease");
        expect(decision.recommended_level).toBe(2);
        expect(decision.recommended_target).toBe(7);
    });

    it("stays at the lowest level when already there", () => {
        const decision = evaluateProgressionMirror({
            currentLevel: 1,
            levels,
            policy,
            feedbackHistory: [
                feedback("uncomfortable", "2026-01-04T10:00:00Z"),
            ],
        });

        expect(decision.action).toBe("maintain");
        expect(decision.recommended_level).toBe(1);
    });

    it("stays at the highest level", () => {
        const decision = evaluateProgressionMirror({
            currentLevel: 4,
            levels,
            policy,
            feedbackHistory: [
                feedback("easy", "2026-01-01T10:00:00Z"),
                feedback("easy", "2026-01-02T10:00:00Z"),
                feedback("easy", "2026-01-03T10:00:00Z"),
            ],
        });

        expect(decision.action).toBe("maintain");
        expect(decision.recommended_level).toBe(4);
    });

    it("maintains when progression is disabled or paused", () => {
        const disabled = evaluateProgressionMirror({
            currentLevel: 1,
            levels,
            policy: { ...policy, enabled: false },
            feedbackHistory: [
                feedback("easy", "2026-01-01T10:00:00Z"),
                feedback("easy", "2026-01-02T10:00:00Z"),
                feedback("easy", "2026-01-03T10:00:00Z"),
            ],
        });

        expect(disabled.action).toBe("maintain");

        const paused = evaluateProgressionMirror({
            currentLevel: 1,
            levels,
            policy: { ...policy, paused: true },
            feedbackHistory: [
                feedback("easy", "2026-01-01T10:00:00Z"),
                feedback("easy", "2026-01-02T10:00:00Z"),
                feedback("easy", "2026-01-03T10:00:00Z"),
            ],
        });

        expect(paused.action).toBe("maintain");
    });

    it("maps the client's too_much difficulty to uncomfortable", () => {
        expect(normalizeDifficulty("too_much")).toBe("uncomfortable");
        expect(normalizeDifficulty("easy")).toBe("easy");

        const [normalized] = normalizeProgressionFeedback([
            { completed: true, difficulty: "too_much", safety: "pain" },
        ]);

        expect(normalized.difficulty).toBe("uncomfortable");
        expect(normalized.safety_signal).toBe("pain");
    });

    it("judges decrease by the most recent session", () => {
        const decision = evaluateProgressionMirror({
            currentLevel: 2,
            levels,
            policy,
            feedbackHistory: [
                feedback("uncomfortable", "2026-01-01T10:00:00Z"),
                feedback("easy", "2026-01-02T10:00:00Z"),
                feedback("easy", "2026-01-03T10:00:00Z"),
                feedback("easy", "2026-01-04T10:00:00Z"),
            ],
        });

        expect(decision.action).toBe("increase");
    });
});
