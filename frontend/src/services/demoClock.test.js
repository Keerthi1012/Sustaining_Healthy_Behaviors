import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    DEMO_CLOCK_EVENT,
    clearDemoClock,
    getDemoClock,
    getDemoDateKey,
    getNow,
    isDemoClockEnabled,
    setDemoClock,
    subscribeDemoClock,
} from "./demoClock";

describe("demo clock", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("passes the real time through by default", () => {
        const reference = new Date(2026, 0, 5, 10, 15);

        expect(getDemoClock()).toBeNull();
        expect(isDemoClockEnabled()).toBe(false);
        expect(getNow(reference)).toEqual(reference);
    });

    it("moves the clock to a chosen time today", () => {
        expect(setDemoClock("19:30")).toBe(true);

        const now = getNow(new Date(2026, 0, 5, 10, 0));

        expect(isDemoClockEnabled()).toBe(true);
        expect(getDemoClock()?.time).toBe("19:30");
        expect(now.getFullYear()).toBe(2026);
        expect(now.getMonth()).toBe(0);
        expect(now.getDate()).toBe(5);
        expect(now.getHours()).toBe(19);
        expect(now.getMinutes()).toBe(30);
        expect(now.getSeconds()).toBe(0);
    });

    it("accepts a date as the demo time", () => {
        expect(setDemoClock(new Date(2026, 0, 5, 22, 5))).toBe(true);
        expect(getDemoClock()?.time).toBe("22:05");
    });

    it("rejects an invalid clock value", () => {
        expect(setDemoClock("25:00")).toBe(false);
        expect(setDemoClock("seven")).toBe(false);
        expect(getDemoClock()).toBeNull();
    });

    it("returns to real time when cleared", () => {
        setDemoClock("19:30");
        expect(clearDemoClock()).toBe(true);

        const now = getNow(new Date(2026, 0, 5, 10, 0));

        expect(getDemoClock()).toBeNull();
        expect(now.getHours()).toBe(10);
    });

    it("notifies subscribers when the demo time changes", () => {
        const listener = vi.fn();
        const unsubscribe = subscribeDemoClock(listener);

        setDemoClock("19:30");
        clearDemoClock();
        unsubscribe();
        setDemoClock("20:00");

        expect(listener).toHaveBeenCalledTimes(2);
        expect(DEMO_CLOCK_EVENT).toBe("sproutly:demo-clock");
    });

    it("stores and exposes a simulated date separately from the system date", () => {
        expect(getDemoDateKey()).toBeNull();

        expect(
            setDemoClock("19:30", "2026-11-04")
        ).toBe(true);
        expect(getDemoDateKey()).toBe("2026-11-04");

        const now = getNow(new Date(2026, 10, 20, 10, 0));

        expect(now.getDate()).toBe(4);
        expect(now.getMonth()).toBe(10);
    });

    it("can clear a simulated date while keeping the demo time", () => {
        setDemoClock("19:30", "2026-11-04");

        expect(setDemoClock("20:15", null)).toBe(true);
        expect(getDemoClock()?.time).toBe("20:15");
        expect(getDemoDateKey()).toBeNull();

        const now = getNow(new Date(2026, 10, 20, 10, 0));

        expect(now.getDate()).toBe(20);
        expect(now.getHours()).toBe(20);
    });
});
