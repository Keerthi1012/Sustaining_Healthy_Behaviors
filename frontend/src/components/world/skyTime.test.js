import { describe, expect, it } from "vitest";
import { getSkyState } from "./skyTime";

function at(hours, minutes = 0) {
    return new Date(2026, 0, 5, hours, minutes, 0);
}

function brightness(color) {
    const match = color.match(/\d+/g);

    if (!match) return 0;

    return Number(match[0]) + Number(match[1]) + Number(match[2]);
}

describe("skyTime", () => {
    it("reads the local time of the place", () => {
        const state = getSkyState(at(12, 0));

        expect(state.minutes).toBe(720);
    });

    it("is darkest in the middle of the night", () => {
        const midnight = getSkyState(at(0, 30));
        const midday = getSkyState(at(12, 0));

        expect(brightness(midnight.skyTop)).toBeLessThan(
            brightness(midday.skyTop)
        );
    });

    it("brightens towards dawn and dims again towards dusk", () => {
        const deepNight = getSkyState(at(3, 0));
        const dawn = getSkyState(at(6, 0));
        const evening = getSkyState(at(19, 0));
        const night = getSkyState(at(22, 0));

        expect(brightness(dawn.skyTop)).toBeGreaterThan(
            brightness(deepNight.skyTop)
        );
        expect(brightness(night.skyTop)).toBeLessThan(
            brightness(evening.skyTop)
        );
    });

    it("moves the sun across the sky during the day", () => {
        const morning = getSkyState(at(7, 0));
        const midday = getSkyState(at(12, 0));
        const evening = getSkyState(at(18, 0));

        expect(morning.sun.opacity).toBeGreaterThan(0);
        expect(midday.sun.opacity).toBeGreaterThan(0);
        expect(morning.sun.x).toBeLessThan(midday.sun.x);
        expect(evening.sun.x).toBeGreaterThan(midday.sun.x);
        expect(midday.sun.y).toBeLessThan(morning.sun.y);
    });

    it("hides the sun at night and shows the moon instead", () => {
        const midnight = getSkyState(at(0, 0));
        const noon = getSkyState(at(12, 0));

        expect(midnight.sun.opacity).toBe(0);
        expect(midnight.moon.opacity).toBeGreaterThan(0);
        expect(noon.moon.opacity).toBe(0);
    });

    it("keeps a low sun glowing through the golden hour", () => {
        expect(getSkyState(at(18, 30)).sun.opacity).toBeGreaterThan(0.8);
        expect(getSkyState(at(19, 15)).sun.opacity).toBe(0);
    });

    it("keeps the moon in the sky for the whole night", () => {
        expect(getSkyState(at(22, 0)).moon.opacity).toBeGreaterThan(0.8);
        expect(getSkyState(at(23, 30)).moon.opacity).toBeGreaterThan(0.8);
        expect(getSkyState(at(2, 0)).moon.opacity).toBeGreaterThan(0.8);
        expect(getSkyState(at(5, 15)).moon.opacity).toBeGreaterThan(0);
    });

    it("shows stars only when the sky is dark", () => {
        expect(getSkyState(at(12, 0)).stars).toBe(0);
        expect(getSkyState(at(23, 0)).stars).toBeGreaterThan(0.5);
    });

    it("changes smoothly between neighbouring moments", () => {
        const before = getSkyState(at(11, 55));
        const after = getSkyState(at(12, 5));

        expect(
            Math.abs(brightness(before.skyTop) - brightness(after.skyTop))
        ).toBeLessThan(20);
    });

    it("never produces an invalid colour", () => {
        for (const hours of [0, 3, 5, 6, 9, 13, 17, 19, 21, 23]) {
            const state = getSkyState(at(hours, 30));

            expect(state.skyTop).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
            expect(state.ground).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
            expect(Number.isNaN(state.stars)).toBe(false);
            expect(state.stars).toBeGreaterThanOrEqual(0);
            expect(state.stars).toBeLessThanOrEqual(1);
        }
    });
});
