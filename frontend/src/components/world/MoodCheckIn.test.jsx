import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    cleanup,
    fireEvent,
    render,
    screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MoodCheckIn from "./MoodCheckIn";
import { I18nProvider } from "../../i18n";
import { getMoodEntry } from "../../services/moodStore";

function renderSheet(props = {}) {
    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(
        <I18nProvider>
            <MoodCheckIn
                userId="user-1"
                onClose={onClose}
                onSaved={onSaved}
                {...props}
            />
        </I18nProvider>
    );

    return { onClose, onSaved };
}

describe("MoodCheckIn deck", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        cleanup();
        window.localStorage.clear();
    });

    it("shows one card at a time and passes with the button", async () => {
        const tester = userEvent.setup();
        renderSheet();

        expect(screen.getByText("Calm")).toBeInTheDocument();
        expect(screen.getByText("Card 1 of 5")).toBeInTheDocument();

        await tester.click(
            screen.getByRole("button", { name: "Not this" })
        );

        expect(screen.getByText("Hopeful")).toBeInTheDocument();
        expect(screen.getByText("Card 2 of 5")).toBeInTheDocument();
    });

    it("passes and chooses with the arrow keys", () => {
        renderSheet();

        const deck = screen.getByRole("group", {
            name: "Today's mood cards",
        });

        fireEvent.keyDown(deck, { key: "ArrowLeft" });
        expect(screen.getByText("Hopeful")).toBeInTheDocument();

        fireEvent.keyDown(deck, { key: "ArrowRight" });

        expect(
            screen.getByText("Today feels Hopeful.")
        ).toBeInTheDocument();
        expect(getMoodEntry("user-1")?.mood).toBe("hopeful");
    });

    it("saves the chosen mood and shows a gentle suggestion", async () => {
        const tester = userEvent.setup();
        const { onSaved } = renderSheet();

        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );

        expect(
            screen.getByText("Today feels Calm.")
        ).toBeInTheDocument();
        expect(
            screen.getByText(/A calm evening wind-down/)
        ).toBeInTheDocument();
        expect(getMoodEntry("user-1")?.mood).toBe("calm");
        expect(onSaved).toHaveBeenCalledWith(
            expect.objectContaining({ mood: "calm" })
        );

        await tester.click(
            screen.getByRole("button", { name: "Check in again" })
        );

        expect(screen.getByText("Card 1 of 5")).toBeInTheDocument();
    });

    it("starts on the saved mood for today", () => {
        renderSheet({ initialMood: "tired" });

        expect(
            screen.getByText("Today feels Tired.")
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", {
                name: "Back to my world",
            })
        ).toBeInTheDocument();
    });

    it("closes without saving when skipped", async () => {
        const tester = userEvent.setup();
        const { onClose, onSaved } = renderSheet();

        await tester.click(
            screen.getByRole("button", { name: "Not today" })
        );

        expect(onClose).toHaveBeenCalled();
        expect(onSaved).not.toHaveBeenCalled();
        expect(getMoodEntry("user-1")).toBeNull();
    });
});
