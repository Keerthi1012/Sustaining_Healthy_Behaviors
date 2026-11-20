import { describe, expect, it } from "vitest";

import {
    NUDGE_INTENSITIES,
    NUDGE_REASONS,
    getCompletedDomainsToday,
    getNudgeDecision,
    getNudgeIntensity,
    getOpenMoments,
    isCoolingDown,
} from "./nudgeEngine";
import { buildScheduleFromProfile, normalizeSchedule } from "./realmSchedule";

function at(hours, minutes = 0) {
    return new Date(2026, 0, 5, hours, minutes, 0, 0);
}

function entry(domain, status = "planned") {
    return {
        id: `${domain}-${status}`,
        domain,
        status,
        title: `${domain} step`,
    };
}

function makePlan({
    date = "2026-01-05",
    movement = "planned",
    sleep = "planned",
    paused = false,
    safetyPause = false,
} = {}) {
    return {
        id: "plan-1",
        paused,
        safetyPause,
        days: [
            {
                id: "day-1",
                date,
                week: 1,
                dayOfWeek: 1,
                primary: entry("movement", movement),
                secondary: entry("sleep", sleep),
            },
        ],
    };
}

function decide(overrides = {}) {
    return getNudgeDecision({
        now: at(19, 30),
        schedule: normalizeSchedule(undefined),
        plan: makePlan(),
        ...overrides,
    });
}

describe("open moment discovery", () => {
    it("collects planned slots dated today or earlier", () => {
        const plan = makePlan();
        plan.days.push({
            id: "day-2",
            date: "2026-01-06",
            primary: entry("nutrition"),
            secondary: null,
        });
        plan.days.push({
            id: "day-0",
            date: "2026-01-04",
            primary: entry("movement"),
            secondary: entry("nutrition"),
        });

        const moments = getOpenMoments(plan, at(12, 0));

        expect(moments).toEqual([
            {
                domain: "movement",
                dayId: "day-0",
                slot: "primary",
                slotIndex: 0,
                date: "2026-01-04",
            },
            {
                domain: "nutrition",
                dayId: "day-0",
                slot: "secondary",
                slotIndex: 1,
                date: "2026-01-04",
            },
            {
                domain: "movement",
                dayId: "day-1",
                slot: "primary",
                slotIndex: 0,
                date: "2026-01-05",
            },
            {
                domain: "sleep",
                dayId: "day-1",
                slot: "secondary",
                slotIndex: 1,
                date: "2026-01-05",
            },
        ]);
    });

    it("can scope open moments to a supplied date key", () => {
        const plan = makePlan();
        plan.days.push({
            id: "day-2",
            date: "2026-01-06",
            primary: entry("nutrition"),
            secondary: null,
        });

        expect(
            getOpenMoments(plan, at(12, 0), "2026-01-06")
        ).toEqual([
            {
                domain: "nutrition",
                dayId: "day-2",
                slot: "primary",
                slotIndex: 0,
                date: "2026-01-06",
            },
        ]);
    });

    it("ignores resolved slots", () => {
        const plan = makePlan({
            movement: "completed",
            sleep: "paused",
        });

        expect(getOpenMoments(plan, at(19, 30))).toEqual([]);
    });

    it("tracks domains completed today", () => {
        const plan = makePlan({ movement: "completed" });
        plan.days[0].secondary = entry("movement");

        expect(
            getCompletedDomainsToday(plan, at(19, 30))
        ).toEqual(new Set(["movement"]));
    });
});

describe("nudge intensity", () => {
    it("gets louder as the window closes", () => {
        expect(getNudgeIntensity(0.1)).toBe(
            NUDGE_INTENSITIES.GENTLE
        );
        expect(getNudgeIntensity(0.5)).toBe(
            NUDGE_INTENSITIES.TIMELY
        );
        expect(getNudgeIntensity(0.9)).toBe(
            NUDGE_INTENSITIES.CLOSING
        );
        expect(getNudgeIntensity(Number.NaN)).toBe(
            NUDGE_INTENSITIES.GENTLE
        );
    });

    it("only treats recent sends as a cooldown", () => {
        const now = at(19, 30);

        expect(
            isCoolingDown(
                new Date(now.getTime() - 30 * 60000).toISOString(),
                90,
                now
            )
        ).toBe(true);
        expect(
            isCoolingDown(
                new Date(now.getTime() - 120 * 60000).toISOString(),
                90,
                now
            )
        ).toBe(false);
        expect(isCoolingDown("not-a-date", 90, now)).toBe(false);
        expect(isCoolingDown(null, 90, now)).toBe(false);
    });
});

describe("nudge decisions", () => {
    it("shows a movement nudge in the evening window", () => {
        const result = decide({ now: at(19, 30) });

        expect(result).toMatchObject({
            show: true,
            domain: "movement",
            intensity: NUDGE_INTENSITIES.GENTLE,
            copyBase: "nudges.movement.gentle",
            channel: "in_app",
            moment: {
                dayId: "day-1",
                slot: "primary",
                date: "2026-01-05",
            },
        });
        expect(result.window).toEqual({
            start: "19:00",
            end: "21:00",
        });
    });

    it("scopes a decision to the supplied date key", () => {
        const plan = makePlan({
            movement: "completed",
            sleep: "completed",
        });
        plan.days.push({
            id: "day-2",
            date: "2026-01-06",
            primary: entry("movement"),
            secondary: null,
        });

        const result = decide({
            plan,
            dateKey: "2026-01-06",
        });

        expect(result).toMatchObject({
            show: true,
            domain: "movement",
            moment: {
                dayId: "day-2",
                date: "2026-01-06",
            },
        });
    });

    it("uses the sleep wind-down window before bed", () => {
        const result = decide({
            now: at(22, 15),
            plan: makePlan({ movement: "completed" }),
        });

        expect(result.show).toBe(true);
        expect(result.domain).toBe("sleep");
        expect(result.copyBase).toBe("nudges.sleep.timely");
        expect(result.window).toEqual({ start: "22:00", end: "22:30" });
    });

    it("opens the sleep nudge gently at the start of wind-down", () => {
        const result = decide({
            now: at(22, 4),
            plan: makePlan({ movement: "completed" }),
        });

        expect(result.show).toBe(true);
        expect(result.domain).toBe("sleep");
        expect(result.copyBase).toBe("nudges.sleep.gentle");
    });

    it("stays silent outside every window", () => {
        const result = decide({ now: at(12, 0) });

        expect(result).toEqual({
            show: false,
            reason: NUDGE_REASONS.OUTSIDE_WINDOW,
        });
    });

    it("respects quiet hours", () => {
        const result = decide({ now: at(23, 45) });

        expect(result).toEqual({
            show: false,
            reason: NUDGE_REASONS.QUIET_HOURS,
        });
    });

    it("respects the daily cap", () => {
        const result = decide({ sentCountToday: 2 });

        expect(result).toEqual({
            show: false,
            reason: NUDGE_REASONS.DAILY_CAP,
        });
    });

    it("cools down a realm after a recent send", () => {
        const result = decide({
            lastSentAtByDomain: {
                movement: new Date(
                    at(19, 20).getTime()
                ).toISOString(),
            },
        });

        expect(result).toEqual({
            show: false,
            reason: NUDGE_REASONS.COOLDOWN,
        });
    });

    it("does not nudge a realm already completed today", () => {
        const result = decide({
            plan: makePlan({ movement: "completed" }),
        });

        expect(result).toEqual({
            show: false,
            reason: NUDGE_REASONS.OUTSIDE_WINDOW,
        });
    });

    it("stays silent while the journey is paused", () => {
        expect(decide({ plan: makePlan({ paused: true }) })).toEqual({
            show: false,
            reason: NUDGE_REASONS.PAUSED,
        });
    });

    it("stays silent after a safety pause", () => {
        expect(
            decide({ plan: makePlan({ safetyPause: true }) })
        ).toEqual({
            show: false,
            reason: NUDGE_REASONS.SAFETY_PAUSE,
        });
    });

    it("stays silent when disabled or snoozed", () => {
        expect(decide({ enabled: false })).toEqual({
            show: false,
            reason: NUDGE_REASONS.DISABLED,
        });
        expect(
            decide({
                snoozedUntil: new Date(
                    at(20, 0).getTime()
                ).toISOString(),
            })
        ).toEqual({
            show: false,
            reason: NUDGE_REASONS.SNOOZED,
        });
    });

    it("handles a missing plan", () => {
        expect(decide({ plan: null })).toEqual({
            show: false,
            reason: NUDGE_REASONS.NO_PLAN,
        });
    });

    it("falls back to an in-app nudge without permission", () => {
        expect(
            decide({ preferredChannel: "browser" })
        ).toMatchObject({ show: true, channel: "in_app" });
        expect(
            decide({
                preferredChannel: "browser",
                permission: "denied",
            })
        ).toMatchObject({ show: true, channel: "in_app" });
        expect(
            decide({
                preferredChannel: "browser",
                permission: "granted",
            })
        ).toMatchObject({ show: true, channel: "browser" });
    });

    it("adapts to a night shift", () => {
        const result = decide({
            now: at(9, 30),
            schedule: buildScheduleFromProfile({ shiftWorker: true }),
            plan: makePlan(),
        });

        expect(result.show).toBe(true);
        expect(result.domain).toBe("sleep");
        expect(result.shift).toBe("night");
    });

    it("matches the intensity to the position in the window", () => {
        expect(decide({ now: at(19, 5) }).intensity).toBe(
            NUDGE_INTENSITIES.GENTLE
        );
        expect(decide({ now: at(19, 50) }).intensity).toBe(
            NUDGE_INTENSITIES.TIMELY
        );
        expect(decide({ now: at(20, 50) }).intensity).toBe(
            NUDGE_INTENSITIES.CLOSING
        );
    });
});
