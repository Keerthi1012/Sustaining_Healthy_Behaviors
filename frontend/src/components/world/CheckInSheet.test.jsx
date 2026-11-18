import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CheckInSheet from "./CheckInSheet";
import { I18nProvider } from "../../i18n";

const entry = {
    id: "movement-walk-5",
    title: "Walk five minutes",
    domain: "movement",
    dose: 5,
    durationLabel: "5 min",
};

function renderSheet(onSave = vi.fn()) {
    render(
        <I18nProvider>
            <CheckInSheet
                entry={entry}
                onClose={vi.fn()}
                onSave={onSave}
            />
        </I18nProvider>
    );

    return onSave;
}

describe("CheckInSheet emoji feedback", () => {
    it("shows decorative emoji without changing the option labels", () => {
        renderSheet();

        expect(screen.getByText("😌")).toHaveAttribute(
            "aria-hidden",
            "true"
        );
        expect(screen.getByText("😊")).toHaveAttribute(
            "aria-hidden",
            "true"
        );
        expect(
            screen.getByRole("radio", { name: /^Easy/ })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("radio", { name: /^Too much/ })
        ).toBeInTheDocument();
    });

    it("still saves the existing backend values", async () => {
        const tester = userEvent.setup();
        const onSave = renderSheet();

        await tester.click(
            screen.getByRole("radio", { name: /^Difficult/ })
        );
        await tester.click(
            screen.getByRole("radio", { name: "I enjoyed it" })
        );
        await tester.click(
            screen.getByRole("button", { name: "Save this step" })
        );

        expect(onSave).toHaveBeenCalledWith({
            difficulty: "difficult",
            barrier: "Nothing in particular",
            enjoyment: "loved",
            safety: "none",
        });
    });
});
