import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
    clearArrivalHistory,
    getArrivalEntry,
    getArrivalStorageKey,
    isArrivalDone,
    loadArrivalHistory,
    normalizeArrivalEntry,
    saveArrivalEntry,
} from "./arrivalStore";

const NOW = new Date(2026, 0, 5, 19, 30);

describe("arrival store", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        window.localStorage.clear();
    });

    it("normalizes a completed arrival entry", () => {
        expect(
            normalizeArrivalEntry(
                {
                    mood: "heavy",
                    time: 5,
                    weather: "hot",
                    applied: {
                        dayId: "day-1",
                        slot: "primary",
                        beforeDose: 10,
                        afterDose: 5,
                        beforeLabel: "10 min",
                        afterLabel: "5 min",
                    },
                },
                NOW
            )
        ).toEqual({
            date: "2026-01-05",
            skipped: false,
            mood: "heavy",
            time: 5,
            weather: "hot",
            applied: {
                dayId: "day-1",
                slot: "primary",
                beforeDose: 10,
                afterDose: 5,
                beforeLabel: "10 min",
                afterLabel: "5 min",
            },
            updatedAt: NOW.toISOString(),
        });
    });

    it("accepts a skipped check-in without a mood", () => {
        const entry = normalizeArrivalEntry({ skipped: true }, NOW);

        expect(entry).toMatchObject({
            date: "2026-01-05",
            skipped: true,
            mood: null,
        });
    });

    it("rejects an empty entry", () => {
        expect(normalizeArrivalEntry(null, NOW)).toBeNull();
        expect(normalizeArrivalEntry({}, NOW)).toBeNull();
    });

    it("stores one entry per day and replaces it on a change", () => {
        saveArrivalEntry("user-1", { mood: "calm", time: 5 }, NOW);
        saveArrivalEntry(
            "user-1",
            { mood: "heavy", time: 2, weather: "rainy" },
            NOW
        );

        const history = loadArrivalHistory("user-1", NOW);

        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({
            mood: "heavy",
            time: 2,
            weather: "rainy",
        });
        expect(isArrivalDone("user-1", "2026-01-05")).toBe(true);
        expect(getArrivalEntry("user-1", "2026-01-04")).toBeNull();
    });

    it("keeps arrival history per user", () => {
        saveArrivalEntry("user-1", { mood: "calm" }, NOW);
        saveArrivalEntry("user-2", { skipped: true }, NOW);

        expect(getArrivalEntry("user-1", "2026-01-05")?.mood).toBe(
            "calm"
        );
        expect(
            window.localStorage.getItem(getArrivalStorageKey("user-1"))
        ).toBeTruthy();
    });

    it("tolerates corrupt storage and clears history", () => {
        window.localStorage.setItem(
            getArrivalStorageKey("user-1"),
            "{not json"
        );

        expect(loadArrivalHistory("user-1", NOW)).toEqual([]);
        expect(clearArrivalHistory("user-1")).toBe(true);
    });
});
