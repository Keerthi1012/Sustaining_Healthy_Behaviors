import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import ExerciseMedia from "./ExerciseMedia";
import { I18nProvider } from "../../i18n";

const mediaOverride = vi.hoisted(() => ({ current: null }));

vi.mock("../../content/exercises", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getExerciseMedia: (entry) =>
            mediaOverride.current ?? actual.getExerciseMedia(entry),
    };
});

const entry = { id: "movement-walk-5", domain: "movement" };

afterEach(() => {
    mediaOverride.current = null;
});

describe("ExerciseMedia", () => {
    it("renders an accessible illustration for the action", () => {
        render(<ExerciseMedia entry={entry} />);

        expect(
            screen.getByRole("img", { name: "A quiet walking path" })
        ).toBeInTheDocument();
    });

    it("uses the Arabic description when the locale is Arabic", () => {
        render(
            <I18nProvider initialLocale="ar">
                <ExerciseMedia entry={entry} />
            </I18nProvider>
        );

        expect(
            screen.getByRole("img", { name: "مسار مشي هادئ" })
        ).toBeInTheDocument();
    });

    it("applies the variant and domain accent classes", () => {
        const { container } = render(
            <ExerciseMedia entry={entry} variant="banner" />
        );
        const figure = container.querySelector(".exercise-media");

        expect(figure).toHaveClass("exercise-media--banner");
        expect(figure).toHaveClass("exercise-media--moss");
    });

    it("falls back to a domain illustration without an overlay", () => {
        render(<ExerciseMedia entry={{ id: "unknown", domain: "sleep" }} />);

        expect(
            screen.getByRole("img", { name: "A calm night scene" })
        ).toBeInTheDocument();
    });

    it("renders a real image when the exercise provides one", () => {
        mediaOverride.current = {
            icon: "Footprints",
            accent: "moss",
            alt: "A quiet walking path",
            altAr: "مسار مشي هادئ",
            src: "/media/exercises/walk.webp",
        };

        const { container } = render(
            <ExerciseMedia entry={entry} variant="banner" />
        );

        expect(
            container.querySelector("img.exercise-media__image")
        ).toHaveAttribute("src", "/media/exercises/walk.webp");
        expect(
            screen.getByRole("img", { name: "A quiet walking path" })
        ).toBeInTheDocument();
        expect(container.querySelector(".exercise-media__icon")).toBeNull();
    });
});
