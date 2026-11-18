import { describe, expect, it } from "vitest";

import {
    DOMAIN_MEDIA,
    EXERCISE_CONTENT,
    getExerciseContent,
    getExerciseMedia,
} from "./exercises";

describe("getExerciseContent", () => {
    it("returns the English entry unchanged for the default locale", () => {
        const entry = { id: "movement-walk-5", title: "Walk five minutes" };

        expect(getExerciseContent(entry, "en")).toBe(entry);
    });

    it("overlays Arabic copy by action id", () => {
        const entry = { id: "movement-walk-5", title: "Walk five minutes" };
        const localized = getExerciseContent(entry, "ar");

        expect(localized.title).toBe("مشي خمس دقائق");
        expect(localized.text).toBe(EXERCISE_CONTENT["movement-walk-5"].ar.text);
    });

    it("keeps the English entry when no overlay exists", () => {
        const entry = { id: "unknown-action", title: "Something new" };

        expect(getExerciseContent(entry, "ar")).toBe(entry);
    });

    it("handles a missing entry", () => {
        expect(getExerciseContent(null, "ar")).toBeNull();
    });
});

describe("getExerciseMedia", () => {
    it("uses the action overlay when present", () => {
        const media = getExerciseMedia({
            id: "movement-walk-5",
            domain: "movement",
        });

        expect(media.icon).toBe("Footprints");
        expect(media.alt).toBe("A quiet walking path");
        expect(media.altAr).toBe("مسار مشي هادئ");
    });

    it("falls back to the domain illustration", () => {
        const media = getExerciseMedia({
            id: "unknown-action",
            domain: "sleep",
        });

        expect(media).toEqual(DOMAIN_MEDIA.sleep);
    });

    it("falls back to movement when the domain is unknown", () => {
        expect(getExerciseMedia({ id: "unknown", domain: "unknown" })).toEqual(
            DOMAIN_MEDIA.movement
        );
    });

    it("handles a missing entry", () => {
        expect(getExerciseMedia(null)).toEqual(DOMAIN_MEDIA.movement);
    });
});
