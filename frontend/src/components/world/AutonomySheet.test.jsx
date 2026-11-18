import { afterEach, describe, expect, it, vi } from "vitest";
import {
    cleanup,
    fireEvent,
    render,
    screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AutonomySheet from "./AutonomySheet";
import { I18nProvider } from "../../i18n";
import { DEFAULT_ECOSYSTEM_CONTEXT } from "../../services/ecosystemStore";

const plan = {
    primaryGoalId: "movement",
    secondaryGoalId: null,
    paused: false,
};

const outcomeMetrics = {
    persistence: { completionRate: 75 },
    resilience: { score: 80 },
};

function renderSheet(onExport = vi.fn()) {
    render(
        <I18nProvider>
            <AutonomySheet
                plan={plan}
                preferences={{}}
                ecosystemContext={DEFAULT_ECOSYSTEM_CONTEXT}
                outcomeMetrics={outcomeMetrics}
                onTogglePreference={vi.fn()}
                onPauseToggle={vi.fn()}
                onAddSecondary={vi.fn()}
                onExport={onExport}
                onReset={vi.fn()}
                onClose={vi.fn()}
            />
        </I18nProvider>
    );

    return onExport;
}

describe("AutonomySheet outcome export", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the outcome summary and includes metrics by default", async () => {
        const tester = userEvent.setup();
        const onExport = renderSheet();

        expect(
            screen.getByText("75% kept · 80/100 resilience")
        ).toBeInTheDocument();

        const toggle = screen.getByRole("checkbox", {
            name: /Include outcome metrics/i,
        });

        expect(toggle).toBeChecked();

        await tester.click(
            screen.getByRole("button", { name: /Export my journey/i })
        );

        expect(onExport).toHaveBeenCalledWith(true);
    });

    it("lets the export omit outcome metrics", async () => {
        const tester = userEvent.setup();
        const onExport = renderSheet();

        await tester.click(
            screen.getByRole("checkbox", {
                name: /Include outcome metrics/i,
            })
        );
        await tester.click(
            screen.getByRole("button", { name: /Export my journey/i })
        );

        expect(onExport).toHaveBeenCalledWith(false);
    });
});

function renderReminderSheet(preferences) {
    const onTogglePreference = vi.fn();

    render(
        <I18nProvider>
            <AutonomySheet
                plan={plan}
                preferences={preferences}
                ecosystemContext={DEFAULT_ECOSYSTEM_CONTEXT}
                outcomeMetrics={outcomeMetrics}
                onTogglePreference={onTogglePreference}
                onPauseToggle={vi.fn()}
                onAddSecondary={vi.fn()}
                onExport={vi.fn()}
                onReset={vi.fn()}
                onClose={vi.fn()}
            />
        </I18nProvider>
    );

    return onTogglePreference;
}

describe("AutonomySheet reminders", () => {
    afterEach(() => {
        cleanup();
    });

    it("enables reminders through preferences", async () => {
        const tester = userEvent.setup();
        const onTogglePreference = renderReminderSheet({});

        await tester.click(
            screen.getByRole("checkbox", {
                name: /Enable reminders/i,
            })
        );

        expect(onTogglePreference).toHaveBeenCalledWith(
            "reminders",
            expect.objectContaining({ enabled: true })
        );
    });

    it("shows cadence, channel, and quiet hours when enabled", () => {
        renderReminderSheet({
            reminders: { enabled: true },
        });

        expect(screen.getByLabelText("Cadence")).toBeInTheDocument();
        expect(screen.getByLabelText("Channel")).toBeInTheDocument();
        expect(
            screen.getByLabelText("Quiet hours start")
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText("Quiet hours end")
        ).toBeInTheDocument();
    });

    it("persists cadence and channel changes", async () => {
        const tester = userEvent.setup();
        const onTogglePreference = renderReminderSheet({
            reminders: { enabled: true },
        });

        await tester.selectOptions(
            screen.getByLabelText("Cadence"),
            "twice_daily"
        );

        expect(onTogglePreference).toHaveBeenCalledWith(
            "reminders",
            expect.objectContaining({ cadence: "twice_daily" })
        );

        await tester.selectOptions(
            screen.getByLabelText("Channel"),
            "browser"
        );

        expect(onTogglePreference).toHaveBeenCalledWith(
            "reminders",
            expect.objectContaining({ channel: "browser" })
        );
    });

    it("shows browser permission guidance for the browser channel", () => {
        renderReminderSheet({
            reminders: { enabled: true, channel: "browser" },
        });

        expect(screen.getByText(/notifications/i)).toBeInTheDocument();
    });
});

describe("AutonomySheet nudge schedule", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the onboarding windows and busy hours", () => {
        renderReminderSheet({ nudges: { enabled: true } });

        expect(
            screen.getByRole("checkbox", {
                name: /Enable time-based nudges/i,
            })
        ).toBeChecked();
        expect(screen.getByLabelText("Move More window 1 start")).toHaveValue(
            "19:00"
        );
        expect(screen.getByLabelText("Move More window 1 end")).toHaveValue(
            "21:00"
        );
        expect(
            screen.queryByText(/Sleep Better 22:00/)
        ).not.toBeInTheDocument();
        expect(
            screen.getByLabelText("Busy hours start")
        ).toHaveValue("23:30");
        expect(screen.getByLabelText("Busy hours end")).toHaveValue(
            "07:00"
        );
        expect(screen.getByLabelText("Your rhythm")).toHaveValue("day");
        expect(
            screen.getByText(/Nudges can appear: Move More 19:00–21:00/)
        ).toBeInTheDocument();
    });

    it("switches shift presets through preferences", async () => {
        const tester = userEvent.setup();
        const onTogglePreference = renderReminderSheet({
            nudges: { enabled: true },
        });

        await tester.selectOptions(
            screen.getByLabelText("Your rhythm"),
            "night"
        );

        expect(onTogglePreference).toHaveBeenCalledWith(
            "schedule",
            expect.objectContaining({
                mode: "night",
                windows: expect.objectContaining({
                    sleep: [{ start: "09:00", end: "11:00" }],
                }),
            })
        );
    });

    it("saves edited windows and busy hours", () => {
        const onTogglePreference = renderReminderSheet({
            nudges: { enabled: true },
        });

        fireEvent.change(
            screen.getByLabelText("Move More window 1 start"),
            { target: { value: "18:15" } }
        );

        expect(onTogglePreference).toHaveBeenCalledWith(
            "schedule",
            expect.objectContaining({
                windows: expect.objectContaining({
                    movement: [{ start: "18:15", end: "21:00" }],
                }),
            })
        );

        fireEvent.change(screen.getByLabelText("Busy hours start"), {
            target: { value: "22:30" },
        });

        expect(onTogglePreference).toHaveBeenCalledWith(
            "schedule",
            expect.objectContaining({
                quietHours: expect.objectContaining({ start: "22:30" }),
            })
        );
    });

    it("adds a second window", async () => {
        const tester = userEvent.setup();
        const onTogglePreference = renderReminderSheet({
            nudges: { enabled: true },
        });

        await tester.click(
            screen.getByRole("button", {
                name: "Add a window",
            })
        );

        expect(onTogglePreference).toHaveBeenCalledWith(
            "schedule",
            expect.objectContaining({
                windows: expect.objectContaining({
                    movement: expect.arrayContaining([
                        { start: "19:00", end: "21:00" },
                        { start: "12:00", end: "13:00" },
                    ]),
                }),
            })
        );
    });

    it("uses the stored schedule and lets nudges be turned off", async () => {
        const tester = userEvent.setup();
        const onTogglePreference = renderReminderSheet({
            nudges: { enabled: true },
            schedule: {
                mode: "custom",
                windows: {
                    movement: [{ start: "06:00", end: "07:00" }],
                },
                quietHours: { start: "21:00", end: "05:00" },
                maxPerDay: 3,
            },
        });

        expect(screen.getByLabelText("Move More window 1 start")).toHaveValue(
            "06:00"
        );
        expect(screen.getByLabelText("Your rhythm")).toHaveValue("custom");
        expect(screen.getByLabelText("Maximum per day")).toHaveValue("3");

        await tester.click(
            screen.getByRole("checkbox", {
                name: /Enable time-based nudges/i,
            })
        );

        expect(onTogglePreference).toHaveBeenCalledWith(
            "nudges",
            expect.objectContaining({ enabled: false })
        );
    });
});
