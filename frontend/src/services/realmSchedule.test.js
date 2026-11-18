import { describe, expect, it } from "vitest";

import {
    DEFAULT_SCHEDULE,
    PREFERRED_TIME_WINDOWS,
    SHIFT_MODES,
    applyPreferredTime,
    applySleepWindDown,
    buildScheduleFromProfile,
    findActiveWindow,
    formatWindow,
    fromMinutes,
    getActiveSchedule,
    getActiveShift,
    getActiveWindow,
    getPreferredTimeWindow,
    getSchedulePreset,
    getWindowPosition,
    isWithinWindow,
    normalizeSchedule,
    normalizeWindowList,
    resolveJourneySchedule,
    toMinutes,
} from "./realmSchedule";

function at(hours, minutes = 0, date = new Date(2026, 0, 5)) {
    const value = new Date(date);
    value.setHours(hours, minutes, 0, 0);
    return value;
}

describe("schedule normalization", () => {
    it("falls back to the day preset", () => {
        expect(normalizeSchedule(undefined)).toEqual(DEFAULT_SCHEDULE);
        expect(
            normalizeSchedule({
                mode: "weekend",
                windows: "evening",
                maxPerDay: "lots",
                minGapMinutes: "never",
                quietHours: { start: "99:99", end: "later" },
            })
        ).toEqual(DEFAULT_SCHEDULE);
    });

    it("clamps intensity limits into a safe range", () => {
        const schedule = normalizeSchedule({
            maxPerDay: 99,
            minGapMinutes: 1,
        });

        expect(schedule.maxPerDay).toBe(6);
        expect(schedule.minGapMinutes).toBe(15);
    });

    it("keeps valid windows and drops broken ones", () => {
        const schedule = normalizeSchedule({
            mode: SHIFT_MODES.CUSTOM,
            windows: {
                movement: [
                    { start: "18:30", end: "20:00" },
                    { start: "20:00", end: "18:30" },
                    { start: "25:00", end: "26:00" },
                ],
            },
        });

        expect(schedule.windows.movement).toEqual([
            { start: "18:30", end: "20:00" },
        ]);
        expect(schedule.mode).toBe(SHIFT_MODES.CUSTOM);
    });

    it("drops implausibly long windows", () => {
        const windows = normalizeWindowList([
            { start: "20:00", end: "18:30" },
            { start: "22:00", end: "06:00" },
        ]);

        expect(windows).toEqual([{ start: "22:00", end: "06:00" }]);
    });

    it("treats an empty list as a disabled realm", () => {
        const windows = normalizeWindowList([], [
            { start: "07:00", end: "09:00" },
        ]);

        expect(windows).toEqual([]);
    });

    it("uses the fallback when every provided window is invalid", () => {
        const windows = normalizeWindowList(
            [{ start: "noon", end: "late" }],
            [{ start: "07:00", end: "09:00" }]
        );

        expect(windows).toEqual([{ start: "07:00", end: "09:00" }]);
    });

    it("maps clock strings to minutes", () => {
        expect(toMinutes("00:00")).toBe(0);
        expect(toMinutes("19:30")).toBe(1170);
        expect(toMinutes("24:00")).toBeNull();
        expect(toMinutes("7:30")).toBeNull();
    });

    it("formats minutes back into a clock string", () => {
        expect(fromMinutes(0)).toBe("00:00");
        expect(fromMinutes(1170)).toBe("19:30");
        expect(fromMinutes(-15)).toBe("23:45");
        expect(fromMinutes(1440)).toBe("00:00");
    });
});

describe("window matching", () => {
    it("matches a regular window", () => {
        expect(
            isWithinWindow(at(19, 30), {
                start: "19:00",
                end: "21:00",
            })
        ).toBe(true);
        expect(
            isWithinWindow(at(21, 0), {
                start: "19:00",
                end: "21:00",
            })
        ).toBe(false);
    });

    it("matches a window that wraps midnight", () => {
        const window = { start: "22:00", end: "02:00" };

        expect(isWithinWindow(at(23, 45), window)).toBe(true);
        expect(isWithinWindow(at(1, 30), window)).toBe(true);
        expect(isWithinWindow(at(3, 0), window)).toBe(false);
        expect(isWithinWindow(at(12, 0), window)).toBe(false);
    });

    it("reports progress through a wrapping window", () => {
        const window = { start: "22:00", end: "02:00" };

        expect(getWindowPosition(window, at(22, 0))).toBe(0);
        expect(getWindowPosition(window, at(0, 0))).toBe(0.5);
        expect(getWindowPosition(window, at(1, 0))).toBe(0.75);
    });

    it("finds the active window for a domain", () => {
        const schedule = normalizeSchedule(undefined);

        expect(
            findActiveWindow(
                schedule.windows,
                "movement",
                at(19, 30)
            )
        ).toEqual({ start: "19:00", end: "21:00" });
        expect(
            findActiveWindow(schedule.windows, "movement", at(12, 0))
        ).toBeNull();
    });

    it("returns the domain and shift with the active window", () => {
        expect(
            getActiveWindow(
                "sleep",
                normalizeSchedule(undefined),
                at(22, 15)
            )
        ).toEqual({
            start: "22:00",
            end: "22:30",
            domain: "sleep",
            shift: SHIFT_MODES.DAY,
        });
    });

    it("formats a window for previews", () => {
        expect(formatWindow({ start: "19:00", end: "21:00" })).toBe(
            "19:00–21:00"
        );
        expect(formatWindow(null)).toBe("");
    });
});

describe("shift presets", () => {
    it("puts movement in the evening and sleep after ten", () => {
        const schedule = getSchedulePreset(SHIFT_MODES.DAY);

        expect(schedule.windows.movement).toEqual([
            { start: "19:00", end: "21:00" },
        ]);
        expect(schedule.windows.sleep).toEqual([
            { start: "22:00", end: "22:30" },
        ]);
    });

    it("moves the day for night-shift users", () => {
        const schedule = buildScheduleFromProfile({
            shiftWorker: true,
        });

        expect(schedule.mode).toBe(SHIFT_MODES.NIGHT);
        expect(schedule.windows.sleep).toEqual([
            { start: "09:00", end: "11:00" },
        ]);
        expect(schedule.quietHours).toEqual({
            start: "11:00",
            end: "16:30",
        });
    });

    it("reads the shift flag from the ecosystem context", () => {
        const schedule = buildScheduleFromProfile({
            ecosystemContext: {
                contextFlags: { shiftWorker: true },
            },
        });

        expect(schedule.mode).toBe(SHIFT_MODES.NIGHT);
    });

    it("uses preferred onboarding times per realm", () => {
        const schedule = buildScheduleFromProfile({
            primaryGoalId: "movement",
            preferredTimes: { movement: "morning" },
        });

        expect(schedule.windows.movement).toEqual(
            PREFERRED_TIME_WINDOWS.morning
        );
    });

    it("uses the primary goal preferred time from onboarding answers", () => {
        const schedule = buildScheduleFromProfile({
            primaryGoalId: "sleep",
            answers: { preferredTime: "night" },
        });

        expect(schedule.windows.sleep).toEqual(
            PREFERRED_TIME_WINDOWS.night
        );
    });

    it("leaves the schedule alone for an unknown preference", () => {
        const schedule = buildScheduleFromProfile({
            primaryGoalId: "movement",
            answers: { preferredTime: "whenever" },
        });

        expect(schedule.windows.movement).toEqual(
            DEFAULT_SCHEDULE.windows.movement
        );
    });

    it("merges a single realm without touching the rest", () => {
        const schedule = applyPreferredTime(
            DEFAULT_SCHEDULE,
            "movement",
            "midday"
        );

        expect(schedule.windows.movement).toEqual(
            PREFERRED_TIME_WINDOWS.midday
        );
        expect(schedule.windows.sleep).toEqual(
            DEFAULT_SCHEDULE.windows.sleep
        );
        expect(
            getPreferredTimeWindow("unknown")
        ).toBeNull();
    });

    it("opens the sleep window before the chosen wind-down", () => {
        const schedule = applySleepWindDown(
            DEFAULT_SCHEDULE,
            "22:30"
        );

        expect(schedule.windows.sleep).toEqual([
            { start: "22:00", end: "22:30" },
        ]);
    });

    it("handles a wind-down just after midnight", () => {
        const schedule = applySleepWindDown(
            DEFAULT_SCHEDULE,
            "00:15"
        );

        expect(schedule.windows.sleep).toEqual([
            { start: "23:45", end: "00:15" },
        ]);
    });

    it("stores the onboarding wind-down in the schedule", () => {
        const schedule = buildScheduleFromProfile({
            primaryGoalId: "sleep",
            answers: { windDownTime: "21:45" },
        });

        expect(schedule.windows.sleep).toEqual([
            { start: "21:15", end: "21:45" },
        ]);
    });

    it("keeps the default sleep window for an invalid wind-down", () => {
        const schedule = applySleepWindDown(
            DEFAULT_SCHEDULE,
            "late"
        );

        expect(schedule.windows.sleep).toEqual(
            DEFAULT_SCHEDULE.windows.sleep
        );
    });

    it("prefers a stored journey schedule", () => {
        const stored = normalizeSchedule({
            windows: {
                movement: [{ start: "06:00", end: "07:00" }],
            },
        });

        expect(
            resolveJourneySchedule({
                profile: { primaryGoalId: "movement" },
                preferences: { schedule: stored },
            })
        ).toEqual(stored);
    });

    it("builds a fallback schedule for older journeys", () => {
        const schedule = resolveJourneySchedule({
            profile: { primaryGoalId: "movement" },
            preferences: {},
        });

        expect(schedule.mode).toBe(SHIFT_MODES.DAY);
        expect(schedule.windows.movement).toEqual([
            { start: "19:00", end: "21:00" },
        ]);
    });
});

describe("rotating shifts", () => {
    const schedule = normalizeSchedule({
        mode: SHIFT_MODES.ROTATING,
        rotation: {
            anchorDate: "2026-01-05",
            cycleDays: 7,
            first: "day",
            second: "night",
        },
    });

    it("switches every cycle from the anchor date", () => {
        expect(getActiveShift(schedule, new Date(2026, 0, 5))).toBe(
            SHIFT_MODES.DAY
        );
        expect(getActiveShift(schedule, new Date(2026, 0, 11))).toBe(
            SHIFT_MODES.DAY
        );
        expect(getActiveShift(schedule, new Date(2026, 0, 12))).toBe(
            SHIFT_MODES.NIGHT
        );
        expect(getActiveShift(schedule, new Date(2026, 0, 19))).toBe(
            SHIFT_MODES.DAY
        );
    });

    it("resolves the matching preset for the active shift", () => {
        const day = getActiveSchedule(schedule, new Date(2026, 0, 5));
        const night = getActiveSchedule(
            schedule,
            new Date(2026, 0, 12)
        );

        expect(day.shift).toBe(SHIFT_MODES.DAY);
        expect(day.windows.movement).toEqual([
            { start: "19:00", end: "21:00" },
        ]);
        expect(night.shift).toBe(SHIFT_MODES.NIGHT);
        expect(night.windows.sleep).toEqual([
            { start: "09:00", end: "11:00" },
        ]);
    });
});
