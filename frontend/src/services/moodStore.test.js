import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
    MOOD_IDS,
    clearMoodHistory,
    getMoodEntry,
    getMoodOption,
    getMoodStorageKey,
    getMoodStreak,
    loadMoodHistory,
    normalizeMoodEntry,
    saveMoodEntry,
} from "./moodStore";
import { addDays, toDateKey } from "../utils/date";

const TODAY = new Date(2026, 0, 5, 19, 30);

describe("mood store", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        window.localStorage.clear();
    });

    it("exposes the mood deck options", () => {
        expect(MOOD_IDS).toEqual([
            "calm",
            "hopeful",
            "tired",
            "heavy",
            "restless",
        ]);
        expect(getMoodOption("calm")).toMatchObject({
            id: "calm",
            emoji: "😌",
        });
        expect(getMoodOption("unknown")).toBeNull();
    });

    it("normalizes stored mood entries", () => {
        expect(normalizeMoodEntry(null)).toBeNull();
        expect(normalizeMoodEntry({ mood: "unknown" })).toBeNull();
        expect(
            normalizeMoodEntry(
                { mood: "calm", date: "2026-01-05" },
                TODAY
            )
        ).toEqual({
            date: "2026-01-05",
            mood: "calm",
            createdAt: TODAY.toISOString(),
        });
        expect(
            normalizeMoodEntry(
                { mood: "calm", date: "not-a-date" },
                TODAY
            ).date
        ).toBe("2026-01-05");
        expect(
            normalizeMoodEntry(
                { mood: "calm", createdAt: 42 },
                TODAY
            ).createdAt
        ).toBe(TODAY.toISOString());
    });

    it("saves one mood per day and replaces it on a change", () => {
        saveMoodEntry("user-1", "calm", TODAY);
        saveMoodEntry("user-1", "heavy", TODAY);

        const history = loadMoodHistory("user-1", TODAY);

        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({
            date: "2026-01-05",
            mood: "heavy",
        });
        expect(getMoodEntry("user-1", "2026-01-05")?.mood).toBe("heavy");
        expect(getMoodEntry("user-1", "2026-01-04")).toBeNull();
    });

    it("keeps mood history per user", () => {
        saveMoodEntry("user-1", "calm", TODAY);
        saveMoodEntry("user-2", "restless", TODAY);

        expect(getMoodEntry("user-1", "2026-01-05")?.mood).toBe("calm");
        expect(getMoodEntry("user-2", "2026-01-05")?.mood).toBe(
            "restless"
        );
        expect(
            window.localStorage.getItem(getMoodStorageKey("user-1"))
        ).toBeTruthy();
    });

    it("ignores unknown moods", () => {
        expect(saveMoodEntry("user-1", "sleepy", TODAY)).toBeNull();
        expect(loadMoodHistory("user-1", TODAY)).toEqual([]);
    });

    it("tolerates corrupt storage", () => {
        window.localStorage.setItem(
            getMoodStorageKey("user-1"),
            "{not json"
        );

        expect(loadMoodHistory("user-1", TODAY)).toEqual([]);
    });

    it("counts a consecutive check-in streak", () => {
        saveMoodEntry("user-1", "calm", TODAY);
        saveMoodEntry(
            "user-1",
            "hopeful",
            addDays(TODAY, -1)
        );
        saveMoodEntry("user-1", "tired", addDays(TODAY, -2));
        saveMoodEntry("user-1", "calm", addDays(TODAY, -4));

        expect(getMoodStreak("user-1", TODAY)).toBe(3);
    });

    it("clears the stored history", () => {
        saveMoodEntry("user-1", "calm", TODAY);
        clearMoodHistory("user-1");

        expect(getMoodEntry("user-1", toDateKey(TODAY))).toBeNull();
    });
});
