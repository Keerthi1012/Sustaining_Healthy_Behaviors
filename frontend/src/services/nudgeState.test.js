import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
    clearNudgeState,
    getNudgeStorageKey,
    loadNudgeState,
    normalizeNudgeState,
    recordNudgeSent,
    saveNudgeState,
    snoozeNudges,
} from "./nudgeState";
import { toDateKey } from "../utils/date";

const NOW = new Date(2026, 0, 5, 19, 30);

describe("nudge state", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        window.localStorage.clear();
    });

    it("starts empty for a new user", () => {
        expect(loadNudgeState("user-1", NOW)).toEqual({
            date: toDateKey(NOW),
            count: 0,
            lastSentAtByDomain: {},
            snoozedUntil: null,
        });
    });

    it("resets the daily count on a new day", () => {
        const stored = {
            date: "2026-01-04",
            count: 2,
            lastSentAtByDomain: {
                movement: "2026-01-04T19:30:00.000Z",
            },
            snoozedUntil: "2026-01-04T21:00:00.000Z",
        };

        const state = normalizeNudgeState(stored, NOW);

        expect(state.date).toBe("2026-01-05");
        expect(state.count).toBe(0);
        expect(state.lastSentAtByDomain).toEqual(
            stored.lastSentAtByDomain
        );
        expect(state.snoozedUntil).toBe(stored.snoozedUntil);
    });

    it("keeps a same-day count and ignores junk values", () => {
        expect(
            normalizeNudgeState(
                { date: "2026-01-05", count: 3.6 },
                NOW
            ).count
        ).toBe(4);
        expect(
            normalizeNudgeState(
                { date: "2026-01-05", count: -2 },
                NOW
            ).count
        ).toBe(0);
        expect(
            normalizeNudgeState(
                { date: "2026-01-05", count: "lots" },
                NOW
            ).count
        ).toBe(0);
        expect(
            normalizeNudgeState(
                {
                    lastSentAtByDomain: {
                        movement: 42,
                        sleep: "2026-01-05T22:10:00.000Z",
                    },
                },
                NOW
            ).lastSentAtByDomain
        ).toEqual({ sleep: "2026-01-05T22:10:00.000Z" });
    });

    it("persists state per user", () => {
        saveNudgeState(
            "user-1",
            { date: toDateKey(NOW), count: 1 },
            NOW
        );
        saveNudgeState("user-2", { count: 0 }, NOW);

        expect(loadNudgeState("user-1", NOW).count).toBe(1);
        expect(loadNudgeState("user-2", NOW).count).toBe(0);
        expect(window.localStorage.getItem(getNudgeStorageKey("user-1")))
            .toBeTruthy();
    });

    it("tolerates corrupt storage", () => {
        window.localStorage.setItem(
            getNudgeStorageKey("user-1"),
            "{not json"
        );

        expect(loadNudgeState("user-1", NOW).count).toBe(0);
    });

    it("records a sent nudge against its realm", () => {
        recordNudgeSent("user-1", "movement", NOW);
        const state = recordNudgeSent("user-1", "sleep", NOW);

        expect(state.count).toBe(2);
        expect(state.lastSentAtByDomain).toEqual({
            movement: NOW.toISOString(),
            sleep: NOW.toISOString(),
        });
        expect(loadNudgeState("user-1", NOW)).toEqual(state);
    });

    it("snoozes for the given number of minutes", () => {
        const state = snoozeNudges("user-1", 90, NOW);

        expect(state.snoozedUntil).toBe(
            new Date(NOW.getTime() + 90 * 60 * 1000).toISOString()
        );
        expect(loadNudgeState("user-1", NOW).snoozedUntil).toBe(
            state.snoozedUntil
        );
    });

    it("clears stored state", () => {
        recordNudgeSent("user-1", "movement", NOW);
        clearNudgeState("user-1");

        expect(loadNudgeState("user-1", NOW).count).toBe(0);
    });
});
