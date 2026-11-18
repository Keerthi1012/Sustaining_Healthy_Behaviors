import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdventurePage from "./AdventurePage";
import { getVillageStorageKey } from "./storage";

function entry(
    domain,
    status = "planned",
    title = "A step",
    durationLabel = "5 min"
) {
    return { domain, status, title, durationLabel };
}

function day(id, primary, secondary = null) {
    return { id, primary, secondary };
}

function makeJourney(days) {
    return { plan: { id: "plan-1", days } };
}

describe("AdventurePage", () => {
    it("opens the village with no supplies and nothing to gather", () => {
        render(
            <AdventurePage
                journey={makeJourney([day("d1", entry("movement"))])}
                onExit={vi.fn()}
            />
        );

        expect(screen.getByLabelText("Wood: 0")).toBeInTheDocument();
        expect(screen.getByLabelText("Stone: 0")).toBeInTheDocument();
        expect(screen.getByLabelText("Food: 0")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Nothing to gather yet/i })
        ).toBeDisabled();
    });

    it("gathers a reward only after a step is complete", async () => {
        const user = userEvent.setup();
        render(
            <AdventurePage
                journey={makeJourney([
                    day("d1", entry("movement", "completed", "A five-minute walk")),
                ])}
                onExit={vi.fn()}
            />
        );

        const gather = screen.getByRole("button", { name: /Gather 1 reward/i });
        expect(gather).toBeEnabled();

        await user.click(gather);

        expect(screen.getByLabelText("Wood: 2")).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent(/gathered 2 wood/i);

        await waitFor(() => {
            const saved = JSON.parse(
                window.localStorage.getItem(getVillageStorageKey("plan-1"))
            );
            expect(saved.resources.wood).toBe(2);
            expect(saved.claimedRewards["plan-1:d1:primary"]).toBeTruthy();
        });
    });

    it("does not duplicate a reward after reopening the village", async () => {
        const user = userEvent.setup();
        const journey = makeJourney([day("d1", entry("movement", "completed"))]);
        const first = render(
            <AdventurePage journey={journey} onExit={vi.fn()} />
        );

        await user.click(
            screen.getByRole("button", { name: /Gather 1 reward/i })
        );
        await waitFor(() =>
            expect(
                window.localStorage.getItem(getVillageStorageKey("plan-1"))
            ).toBeTruthy()
        );
        first.unmount();

        render(<AdventurePage journey={journey} onExit={vi.fn()} />);

        expect(screen.getByLabelText("Wood: 2")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Nothing to gather yet/i })
        ).toBeDisabled();
    });

    it("locks the next day until the first is complete", () => {
        render(
            <AdventurePage
                journey={makeJourney([
                    day("d1", entry("movement")),
                    day("d2", entry("sleep")),
                ])}
                onExit={vi.fn()}
            />
        );

        expect(screen.getByLabelText("Day 1: in progress")).toBeInTheDocument();
        expect(screen.getByLabelText("Day 2: locked")).toBeInTheDocument();
        expect(
            screen.getByText(/Day 2 opens after the main step for Day 1 is complete/i)
        ).toBeInTheDocument();
    });

    it("marks an earlier optional step without locking the next primary", () => {
        render(
            <AdventurePage
                journey={makeJourney([
                    day(
                        "d1",
                        entry("movement", "completed"),
                        entry("sleep")
                    ),
                    day("d2", entry("sleep")),
                ])}
                onExit={vi.fn()}
            />
        );

        expect(
            screen.getByLabelText("Day 1: optional step waiting")
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Day 2: in progress")).toBeInTheDocument();
    });

    it("shows optional steps after the main path is finished", () => {
        render(
            <AdventurePage
                journey={makeJourney([
                    day(
                        "d1",
                        entry("movement", "completed"),
                        entry("sleep")
                    ),
                ])}
                onExit={vi.fn()}
            />
        );

        expect(
            screen.getByRole("heading", { name: "Optional steps" })
        ).toBeInTheDocument();
        expect(
            screen.getAllByText(/main path is complete/i).length
        ).toBeGreaterThan(0);
        expect(screen.queryByText("Every day is done")).not.toBeInTheDocument();
    });

    it("opens the next day once the first is complete", () => {
        render(
            <AdventurePage
                journey={makeJourney([
                    day("d1", entry("movement", "completed")),
                    day("d2", entry("sleep")),
                ])}
                onExit={vi.fn()}
            />
        );

        expect(screen.getByLabelText("Day 1: complete")).toBeInTheDocument();
        expect(screen.getByLabelText("Day 2: in progress")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Village day 2" })
        ).toBeInTheDocument();
    });

    it("never gathers a reward from a locked day", () => {
        render(
            <AdventurePage
                journey={makeJourney([
                    day("d1", entry("movement")),
                    day("d2", entry("sleep", "completed")),
                ])}
                onExit={vi.fn()}
            />
        );

        expect(
            screen.getByRole("button", { name: /Nothing to gather yet/i })
        ).toBeDisabled();
    });
});
