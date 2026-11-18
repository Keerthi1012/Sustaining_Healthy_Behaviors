import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PersonalisationPage from "./PersonalisationPage";
import { I18nProvider } from "../i18n";

afterEach(() => {
    cleanup();
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
});

const goal = { id: "movement", name: "Movement" };

function renderPage(overrides = {}, locale = "en") {
    const onComplete = vi.fn();

    render(
        <I18nProvider initialLocale={locale}>
            <PersonalisationPage
                goal={goal}
                onBack={vi.fn()}
                onComplete={onComplete}
                {...overrides}
            />
        </I18nProvider>
    );

    return { onComplete };
}

async function answerRequiredQuestions(user) {
    await user.click(
        screen.getByRole("radio", { name: "Mostly sitting" })
    );
    await user.click(
        screen.getAllByRole("radio", { name: "5 minutes" })[0]
    );
    await user.click(
        screen.getByRole("radio", { name: "Not enough time" })
    );
}

async function submitPlan(user) {
    await user.click(
        screen.getByRole("button", {
            name: "Build my starting plan",
        })
    );
}

describe("ecosystem context on personalisation", () => {
    it("applies the desk-heat preset and submits its context", async () => {
        const user = userEvent.setup();
        const { onComplete } = renderPage();

        await answerRequiredQuestions(user);
        await user.click(
            screen.getByRole("button", {
                name: "Desk + summer heat",
            })
        );

        expect(
            screen.getByRole("checkbox", { name: /extreme heat mode/i })
        ).toBeChecked();
        expect(screen.getByLabelText("Usual daily steps")).toHaveValue(
            4200
        );

        await submitPlan(user);

        expect(onComplete).toHaveBeenCalledTimes(1);
        const [profile, context] = onComplete.mock.calls[0];
        expect(profile.primaryGoalId).toBe("movement");
        expect(context.source).toBe("sahatna_malaffi_demo");
        expect(context.contextFlags.extremeHeatMode).toBe(true);
        expect(context.wearableBaseline.dailySteps).toBe(4200);
    });

    it("submits the optional comfortable time", async () => {
        const user = userEvent.setup();
        const { onComplete } = renderPage();

        await answerRequiredQuestions(user);
        await user.click(
            screen.getAllByRole("radio", { name: "10 minutes" })[1]
        );
        await submitPlan(user);

        const [profile] = onComplete.mock.calls[0];
        expect(profile.answers.comfortableTime).toBe("10 minutes");
    });

    it("marks manual flag and field edits as manual context", async () => {
        const user = userEvent.setup();
        const { onComplete } = renderPage();

        await answerRequiredQuestions(user);
        await user.click(
            screen.getByRole("checkbox", { name: /^fasting/i })
        );
        await user.selectOptions(
            screen.getByLabelText("Screening focus"),
            "prediabetes"
        );

        const steps = screen.getByLabelText("Usual daily steps");
        await user.clear(steps);
        await user.type(steps, "3000");

        await submitPlan(user);

        const [, context] = onComplete.mock.calls[0];
        expect(context.source).toBe("manual");
        expect(context.contextFlags.fasting).toBe(true);
        expect(context.screeningRisk).toBe("prediabetes");
        expect(context.wearableBaseline.dailySteps).toBe(3000);
    });

    it("clears a preset back to the neutral context", async () => {
        const user = userEvent.setup();

        renderPage();

        await user.click(
            screen.getByRole("button", {
                name: "Desk + summer heat",
            })
        );
        await user.click(
            screen.getByRole("button", { name: "Clear" })
        );

        expect(
            screen.getByRole("checkbox", { name: /extreme heat mode/i })
        ).not.toBeChecked();
        expect(screen.getByLabelText("Usual daily steps")).toHaveValue(
            6000
        );
    });

    it("renders the context panel in Arabic and right-to-left", () => {
        renderPage({}, "ar");

        expect(
            screen.getByText("السياق الصحي واليومي (اختياري)")
        ).toBeInTheDocument();
        expect(screen.getByLabelText("محور الفحص الطبي")).toBeInTheDocument();
        expect(document.documentElement.dir).toBe("rtl");
        expect(document.documentElement.lang).toBe("ar");
    });
});

describe("realm timing questions", () => {
    it("seeds a movement nudge window of evening", async () => {
        const user = userEvent.setup();
        const { onComplete } = renderPage();

        expect(
            screen.getByRole("radio", { name: "Evening" })
        ).toBeChecked();
        expect(
            screen.getByText(
                "We only nudge inside this window, and never during your busy hours."
            )
        ).toBeInTheDocument();

        await answerRequiredQuestions(user);
        await submitPlan(user);

        const [profile] = onComplete.mock.calls[0];
        expect(profile.answers.preferredTime).toBe("evening");
    });

    it("captures the sleep wind-down time", async () => {
        const user = userEvent.setup();
        const { onComplete } = renderPage({
            goal: { id: "sleep", name: "Sleep" },
        });

        const windDown = screen.getByLabelText(
            "When do you start winding down?"
        );

        expect(windDown).toHaveValue("22:30");

        fireEvent.change(windDown, { target: { value: "21:45" } });

        await user.click(
            screen.getByRole("radio", { name: "7-9 hours" })
        );
        await user.click(
            screen.getByRole("radio", {
                name: "Difficulty falling asleep",
            })
        );
        await user.click(
            screen.getByRole("radio", { name: "Late screen time" })
        );
        await submitPlan(user);

        const [profile] = onComplete.mock.calls[0];
        expect(profile.answers.windDownTime).toBe("21:45");
    });

    it("renders the timing question in Arabic", () => {
        renderPage({}, "ar");

        expect(
            screen.getByText("متى يكون التنبيه اللطيف أنسب لك؟")
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "سننبهك داخل هذه الفترة فقط، وليس أبدًا خلال ساعات انشغالك."
            )
        ).toBeInTheDocument();
    });
});
