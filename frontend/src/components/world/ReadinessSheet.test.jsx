import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ReadinessSheet from "./ReadinessSheet";

const entry = {
    id: "movement-walk-5",
    title: "Walk five minutes",
    domain: "movement",
    dose: 5,
    durationLabel: "5 min",
};

describe("ReadinessSheet", () => {
    it("saves the selected readiness without changing the step directly", async () => {
        const onSave = vi.fn();
        const tester = userEvent.setup();

        render(
            <ReadinessSheet
                entry={entry}
                onClose={vi.fn()}
                onSave={onSave}
            />
        );

        await tester.click(
            screen.getByRole("radio", { name: /^Low/i })
        );
        await tester.click(screen.getByRole("radio", { name: "2 min" }));
        await tester.click(
            screen.getByRole("radio", { name: "Rainy" })
        );
        await tester.click(
            screen.getByRole("radio", { name: /^Heavy/i })
        );
        await tester.click(
            screen.getByRole("button", {
                name: /Use this for today/i,
            })
        );

        expect(onSave).toHaveBeenCalledWith({
            energy: "low",
            time: 2,
            weather: "rainy",
            headspace: "heavy",
        });
    });

    it("closes without saving when the optional check-in is skipped", async () => {
        const onClose = vi.fn();
        const onSave = vi.fn();
        const tester = userEvent.setup();

        render(
            <ReadinessSheet
                entry={entry}
                onClose={onClose}
                onSave={onSave}
            />
        );

        await tester.click(
            screen.getByRole("button", {
                name: /Keep my usual step/i,
            })
        );

        expect(onClose).toHaveBeenCalled();
        expect(onSave).not.toHaveBeenCalled();
    });

    it("shows decorative emoji for the readiness choices", () => {
        render(
            <ReadinessSheet
                entry={entry}
                onClose={vi.fn()}
                onSave={vi.fn()}
            />
        );

        expect(screen.getByText("😴")).toHaveAttribute(
            "aria-hidden",
            "true"
        );
        expect(screen.getByText("🌧️")).toHaveAttribute(
            "aria-hidden",
            "true"
        );
        expect(screen.getByText("🌫️")).toHaveAttribute(
            "aria-hidden",
            "true"
        );
        expect(
            screen.getByRole("radio", { name: /^Low/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("radio", { name: "Rainy" })
        ).toBeInTheDocument();
    });
});
