import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DemoClockSheet from "./DemoClockSheet";
import { I18nProvider } from "../../i18n";
import { buildPlan } from "../../services/planEngine";
import {
    getDemoClock,
    setDemoClock,
} from "../../services/demoClock";
import { getBackendDemoMode } from "../../services/journeyApi";
import { toDateKey } from "../../utils/date";

vi.mock("../../services/journeyApi", () => ({
    getBackendDemoMode: vi.fn(async () => true),
}));

const profile = {
    primaryGoalId: "movement",
    goalIds: ["movement"],
    answers: {
        activity: "A little active",
        time: "10 minutes",
        barrier: "Not enough time",
    },
};

const planDays = buildPlan(profile, new Date(2026, 0, 5)).days.slice(
    0,
    7
);

function renderSheet({ locale = "en", onClose = vi.fn() } = {}) {
    render(
        <I18nProvider initialLocale={locale}>
            <DemoClockSheet days={planDays} onClose={onClose} />
        </I18nProvider>
    );

    return { onClose };
}

describe("Demo Journey sheet", () => {
    beforeEach(() => {
        window.localStorage.clear();
        getBackendDemoMode.mockReset();
        getBackendDemoMode.mockResolvedValue(true);
    });

    it("shows seven journey days and separates system from simulated dates", async () => {
        setDemoClock("09:00", planDays[2].date);

        renderSheet();

        expect(
            screen.getByRole("heading", { name: "Demo Journey" })
        ).toBeInTheDocument();

        const systemGroup = screen.getByRole("group", {
            name: "Actual system date",
        });
        const simulatedGroup = screen.getByRole("group", {
            name: "Simulated demo date",
        });

        expect(systemGroup.querySelector("time")).toHaveTextContent(
            toDateKey()
        );
        expect(simulatedGroup.querySelector("time")).toHaveTextContent(
            planDays[2].date
        );

        for (let index = 0; index < 7; index += 1) {
            expect(
                screen.getByRole("button", {
                    name: new RegExp(`Day ${index + 1}`),
                })
            ).toBeInTheDocument();
        }

        await waitFor(() =>
            expect(getBackendDemoMode).toHaveBeenCalledTimes(1)
        );
    });

    it("does not change the saved date when the sheet is closed after choosing a day", async () => {
        const tester = userEvent.setup();
        setDemoClock("09:00", planDays[1].date);
        const { onClose } = renderSheet();

        await tester.click(
            screen.getByRole("button", { name: /Day 5/ })
        );
        fireEvent.keyDown(document, { key: "Escape" });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(getDemoClock()?.date).toBe(planDays[1].date);
    });

    it("commits a chosen day only when the demo settings are applied", async () => {
        const tester = userEvent.setup();
        const { onClose } = renderSheet();

        await tester.click(
            screen.getByRole("button", { name: /Day 4/ })
        );
        expect(getDemoClock()).toBeNull();

        await tester.click(
            screen.getByRole("button", {
                name: "Apply demo settings",
            })
        );

        expect(getDemoClock()?.date).toBe(planDays[3].date);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("keeps the selector available and warns when backend demo mode is disabled", async () => {
        getBackendDemoMode.mockResolvedValueOnce(false);

        renderSheet();

        expect(
            await screen.findByRole("alert")
        ).toHaveTextContent(/Demo mode is disabled on the server/i);
        expect(
            screen.getByRole("button", { name: /Day 2/ })
        ).toBeInTheDocument();
    });

    it("renders Arabic labels in a right-to-left document", async () => {
        renderSheet({ locale: "ar" });

        await waitFor(() =>
            expect(document.documentElement.dir).toBe("rtl")
        );
        expect(
            screen.getByRole("heading", { name: "رحلة العرض" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /اليوم 1/ })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("group", {
                name: "تاريخ النظام الفعلي",
            })
        ).toBeInTheDocument();
    });
});
