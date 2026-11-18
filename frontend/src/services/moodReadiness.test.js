import { describe, expect, it } from "vitest";

import {
    ARRIVAL_TIME_VALUES,
    buildArrivalReadiness,
    getMoodReadiness,
} from "./moodReadiness";

describe("mood to readiness mapping", () => {
    it("maps every mood to an energy and headspace", () => {
        expect(getMoodReadiness("heavy")).toEqual({
            energy: "low",
            headspace: "heavy",
        });
        expect(getMoodReadiness("calm")).toEqual({
            energy: "good",
            headspace: "light",
        });
        expect(getMoodReadiness("restless")).toEqual({
            energy: "okay",
            headspace: "heavy",
        });
        expect(getMoodReadiness("unknown")).toBeNull();
    });

    it("derives a complete readiness profile from three answers", () => {
        expect(
            buildArrivalReadiness({
                mood: "heavy",
                time: 5,
                weather: "hot",
            })
        ).toEqual({
            energy: "low",
            headspace: "heavy",
            time: 5,
            weather: "hot",
        });
    });

    it("keeps the previous values when an answer is missing", () => {
        expect(
            buildArrivalReadiness(
                { mood: "tired" },
                { energy: "good", headspace: "light", time: 10, weather: "cold" }
            )
        ).toEqual({
            energy: "low",
            headspace: "neutral",
            time: 10,
            weather: "cold",
        });
    });

    it("ignores an unknown time or weather", () => {
        const readiness = buildArrivalReadiness({
            mood: "hopeful",
            time: 60,
            weather: "snowy",
        });

        expect(readiness.time).toBe(5);
        expect(readiness.weather).toBe("mild");
        expect(ARRIVAL_TIME_VALUES).toEqual([2, 5, 10]);
    });
});
