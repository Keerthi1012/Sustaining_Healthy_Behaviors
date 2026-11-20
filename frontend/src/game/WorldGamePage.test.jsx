import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import WorldGamePage from "./WorldGamePage";
import { I18nProvider } from "../i18n";
import { buildPlan, completeSlot } from "../services/planEngine";
import {
    getLegacyVillageStorageKey,
    getVillageStorageKey,
} from "./storage";
import { addDays } from "../utils/date";

const profile = {
    primaryGoalId: "movement",
    goalIds: ["movement"],
    answers: {
        activity: "A little active",
        time: "10 minutes",
        barrier: "Not enough time",
    },
};

const feedback = {
    difficulty: "comfortable",
    barrier: "Nothing in particular",
    safety: "none",
};

const user = {
    user_id: "user-alice",
    username: "alice",
    display_name: "Alice",
};

function makePlan(context) {
    const start = addDays(new Date(), -5);
    const plan = buildPlan(
        profile,
        start,
        context ? { ecosystemContext: context } : undefined
    );

    return { ...plan, days: plan.days.slice(0, 3) };
}

function renderWorld(plan, { locale, pageUser = user } = {}) {
    const onExit = vi.fn();
    const onLogout = vi.fn();
    const page = (
        <WorldGamePage
            journey={{ plan, profile, preferences: {} }}
            user={pageUser}
            onExit={onExit}
            onLogout={onLogout}
        />
    );

    const view = render(
        locale ? (
            <I18nProvider initialLocale={locale}>{page}</I18nProvider>
        ) : (
            page
        )
    );

    return { ...view, onExit, onLogout };
}

function completeFirstThree(base) {
    let plan = base;

    for (let index = 0; index < 3; index += 1) {
        plan = completeSlot(
            plan,
            plan.days[index].id,
            "primary",
            feedback
        );
    }

    return plan;
}

describe("WorldGamePage", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("shows the world title and the realms", () => {
        renderWorld(makePlan());

        expect(
            screen.getByRole("heading", { level: 1, name: "Your world" })
        ).toBeInTheDocument();
        expect(screen.getByText("Valley of Vitality")).toBeInTheDocument();
        expect(screen.getByText("Oasis of Serenity")).toBeInTheDocument();
    });

    it("starts quiet before any step is completed", () => {
        renderWorld(makePlan());

        expect(screen.getAllByText("Not started").length).toBeGreaterThan(0);
    });

    it("grows after a step is completed", () => {
        const base = makePlan();
        const plan = completeSlot(base, base.days[0].id, "primary", feedback);

        renderWorld(plan);

        expect(
            screen.getByRole("progressbar", { name: "World growth" })
        ).toHaveAttribute("aria-valuenow", "1");
        expect(
            screen.getByText("Wildflowers opened along the valley path.")
        ).toBeInTheDocument();
    });

    it("grows from out-of-order demo completions and keeps progress in range", () => {
        const base = makePlan();
        const plan = completeSlot(
            base,
            base.days[2].id,
            "primary",
            feedback
        );

        expect(base.days[0].primary.status).toBe("planned");

        const { container } = renderWorld(plan);
        const progress = screen.getByRole("progressbar", {
            name: "World growth",
        });
        const now = Number(progress.getAttribute("aria-valuenow"));
        const max = Number(progress.getAttribute("aria-valuemax"));
        const width = Number.parseFloat(
            progress.querySelector("span").style.width
        );

        expect(now).toBe(1);
        expect(max).toBe(3);
        expect(now).toBeLessThanOrEqual(max);
        expect(width).toBeGreaterThanOrEqual(0);
        expect(width).toBeLessThanOrEqual(100);
        expect(
            within(container).getByText(
                "Wildflowers opened along the valley path."
            )
        ).toBeInTheDocument();
    });

    it("keeps the same village state after navigating away and returning", async () => {
        const base = makePlan();
        const plan = completeSlot(
            base,
            base.days[2].id,
            "primary",
            feedback
        );
        const first = renderWorld(plan);
        const tester = userEvent.setup();

        await tester.click(
            within(first.container).getByRole("button", {
                name: "Back to today",
            })
        );
        expect(first.onExit).toHaveBeenCalledTimes(1);

        cleanup();
        renderWorld(plan);

        expect(
            screen.getByRole("progressbar", { name: "World growth" })
        ).toHaveAttribute("aria-valuenow", "1");
        expect(
            screen.getByText("Wildflowers opened along the valley path.")
        ).toBeInTheDocument();
    });

    it("keeps the same village state after a remount-style reload", () => {
        const base = makePlan();
        const plan = completeSlot(
            base,
            base.days[2].id,
            "primary",
            feedback
        );

        renderWorld(plan);
        cleanup();
        renderWorld(plan);

        expect(
            screen.getByRole("progressbar", { name: "World growth" })
        ).toHaveAttribute("aria-valuenow", "1");
        expect(
            screen.getByText("Wildflowers opened along the valley path.")
        ).toBeInTheDocument();
    });

    it("does not share village growth between two users", () => {
        const firstBase = makePlan();
        const firstPlan = completeSlot(
            firstBase,
            firstBase.days[2].id,
            "primary",
            feedback
        );
        const secondPlan = makePlan();
        const first = renderWorld(firstPlan, {
            pageUser: { ...user, user_id: "user-alice" },
        });
        const second = renderWorld(secondPlan, {
            pageUser: { ...user, user_id: "user-bob" },
        });

        expect(
            within(first.container).getByRole("progressbar", {
                name: "World growth",
            })
        ).toHaveAttribute("aria-valuenow", "1");
        expect(
            within(second.container).getByRole("progressbar", {
                name: "World growth",
            })
        ).toHaveAttribute("aria-valuenow", "0");
    });

    it("resets the legacy village storage on mount", () => {
        const plan = makePlan();
        const currentKey = getVillageStorageKey(plan.id);
        const legacyKey = getLegacyVillageStorageKey(plan.id);

        window.localStorage.setItem(currentKey, "{}");
        window.localStorage.setItem(legacyKey, "{}");

        renderWorld(plan);

        expect(window.localStorage.getItem(currentKey)).toBeNull();
        expect(window.localStorage.getItem(legacyKey)).toBeNull();
    });

    it("returns home through the back control", async () => {
        const { onExit } = renderWorld(makePlan());
        const tester = userEvent.setup();

        await tester.click(
            screen.getByRole("button", { name: "Back to today" })
        );

        expect(onExit).toHaveBeenCalled();
    });

    it("shows persistence and resilience outcomes", () => {
        const base = makePlan();
        const plan = completeFirstThree(base);

        renderWorld(plan);

        expect(
            screen.getByRole("heading", {
                level: 2,
                name: "Resilience & health impact",
            })
        ).toBeInTheDocument();
        expect(screen.getByText("100%")).toBeInTheDocument();
        expect(screen.getByText("Persistence")).toBeInTheDocument();
        expect(screen.getByText("Continuity")).toBeInTheDocument();
        expect(screen.getByText("Behaviour")).toBeInTheDocument();
        expect(screen.getByText("Inclusion lens")).toBeInTheDocument();
        expect(screen.getByText("Resilience")).toBeInTheDocument();
        expect(screen.getByText("What we learned")).toBeInTheDocument();
        expect(
            screen.getByText(/Your steadiest step is/)
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "This is an educational illustration, not a medical prediction, diagnosis, or treatment plan."
            )
        ).toBeInTheDocument();
    });

    it("shows a neutral trajectory without health context", () => {
        renderWorld(makePlan());

        expect(screen.getByText("No baseline yet")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Add health context in personalisation to see a modelled trajectory."
            )
        ).toBeInTheDocument();
    });

    it("shows a modelled trajectory from health context", () => {
        const context = {
            updatedAt: "2026-01-05T08:00:00.000Z",
            healthAgeDelta: 3,
            screeningRisk: "prediabetes",
        };
        const plan = completeFirstThree(makePlan(context));

        renderWorld(plan);

        expect(
            screen.getByText("Baseline +3.0 → +2.8 yrs")
        ).toBeInTheDocument();
        expect(
            screen.getByText("Screening focus: Prediabetes")
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "After-meal movement can support insulin sensitivity and blood-sugar regulation."
            )
        ).toBeInTheDocument();
    });

    it("opens the outcome methodology disclosure", async () => {
        const tester = userEvent.setup();
        const plan = completeFirstThree(makePlan());

        renderWorld(plan);
        await tester.click(screen.getByText("How this is measured"));

        expect(
            screen.getByText(/Persistence compares kept moments/)
        ).toBeVisible();
        expect(
            screen.getByText(/Continuity counts active days/)
        ).toBeVisible();
        expect(
            screen.getByText(/Behaviour counts completed realm steps/)
        ).toBeVisible();
        expect(
            screen.getByText(/Resilience is 70% completion consistency/)
        ).toBeVisible();
    });

    it("renders the outcomes panel in Arabic", () => {
        const plan = completeFirstThree(makePlan());

        renderWorld(plan, { locale: "ar" });

        expect(
            screen.getByRole("heading", {
                level: 2,
                name: "المرونة والأثر الصحي",
            })
        ).toBeInTheDocument();
        expect(screen.getByText("الاستمرارية")).toBeInTheDocument();
        expect(screen.getByText("المواصلة")).toBeInTheDocument();
        expect(screen.getByText("السلوك")).toBeInTheDocument();
        expect(screen.getByText("عدسة الشمول")).toBeInTheDocument();
        expect(screen.getByText("المرونة")).toBeInTheDocument();
        expect(screen.getByText("ما تعلمناه")).toBeInTheDocument();
    });
});
