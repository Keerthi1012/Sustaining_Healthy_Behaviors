import {
    afterEach,
    describe,
    expect,
    it,
    vi,
    beforeEach,
} from "vitest";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import WorldPage from "./WorldPage";
import {
    addSecondaryGoal,
    buildPlan,
    completeSlot,
    restSlot,
} from "../../services/planEngine";
import { getLearningSummary } from "../../services/learning";
import { getSampleAbuDhabiProfile } from "../../services/ecosystemStore";
import { mapHabitToAction } from "../../services/habitApi";
import {
    getArrivalEntry,
    saveArrivalEntry,
} from "../../services/arrivalStore";
import { I18nProvider } from "../../i18n";
import { interpolate } from "../../i18n/context";
import en from "../../i18n/messages/en";
import ar from "../../i18n/messages/ar";
import {
    getDemoClock,
    setDemoClock,
} from "../../services/demoClock";
import { getMoodEntry, saveMoodEntry } from "../../services/moodStore";
import { addDays, toDateKey } from "../../utils/date";

vi.mock("../../services/activityApi", () => ({
    getUserActivities: vi.fn(async () => []),
    createWalkingActivity: vi.fn(async () => ({
        observation_id: "activity-1",
        duration_minutes: 5,
        started_at: new Date().toISOString(),
    })),
}));

vi.mock("../../services/journeyApi", () => ({
    getBackendDemoMode: vi.fn(async () => true),
}));

const { createWalkingActivity } = await import("../../services/activityApi");

const profile = {
    primaryGoalId: "movement",
    goalIds: ["movement"],
    answers: {
        activity: "A little active",
        time: "10 minutes",
        barrier: "Not enough time",
    },
};

const user = {
    user_id: "user-alice",
    username: "alice",
    display_name: "Alice",
};

const feedback = {
    difficulty: "comfortable",
    barrier: "Nothing in particular",
    safety: "none",
};

function makePlan(dayCount = 3, startedDaysAgo = 5) {
    const start = addDays(new Date(), -startedDaysAgo);
    const plan = buildPlan(profile, start);

    return { ...plan, days: plan.days.slice(0, dayCount) };
}

function seedDemoDayArrivals(plan, indices = null) {
    const days = indices
        ? indices.map((index) => plan.days[index])
        : plan.days.slice(0, 7);

    days.forEach((day) => {
        if (!day?.date) return;

        saveArrivalEntry(
            user.user_id,
            { skipped: true, date: day.date },
            new Date(`${day.date}T12:00:00`)
        );
    });
}

async function applyDemoDay(dayIndex, time = "19:30") {
    const tester = userEvent.setup();

    await tester.click(
        screen.getByRole("button", { name: /Demo Journey/i })
    );
    await tester.click(
        screen.getByRole("button", {
            name: new RegExp(`^Day ${dayIndex + 1}`),
        })
    );
    fireEvent.change(screen.getByLabelText("Demo time"), {
        target: { value: time },
    });
    await tester.click(
        screen.getByRole("button", {
            name: "Apply demo settings",
        })
    );
}

function renderWorld(plan, overrides = {}, journeyOverrides = {}, options = {}) {
    const onJourneyChange = vi.fn();

    if (options.seedArrival !== false) {
        saveArrivalEntry(user.user_id, { skipped: true });
    }

    const journey = {
        version: 2,
        profile,
        plan,
        preferences: { showReturnCard: false, quietWorld: true },
        updatedAt: new Date().toISOString(),
        ...journeyOverrides,
    };

    const page = (
        <WorldPage
            journey={journey}
            user={user}
            onJourneyChange={onJourneyChange}
            onReset={vi.fn()}
            onOpenAdventure={vi.fn()}
            onLogout={vi.fn()}
            {...overrides}
        />
    );

    render(
        options.locale ? (
            <I18nProvider initialLocale={options.locale}>{page}</I18nProvider>
        ) : (
            page
        )
    );

    return { onJourneyChange, journey };
}

function completeDay(plan, index) {
    return completeSlot(plan, plan.days[index].id, "primary", feedback);
}

const BARRIER_KEYS = {
    "Not enough time": "checkin.barrier.time",
    "Low energy": "checkin.barrier.energy",
    "Discomfort or pain": "checkin.barrier.pain",
};

function buildLearnedPlan() {
    let plan = makePlan(4);

    plan = completeSlot(plan, plan.days[0].id, "primary", {
        difficulty: "comfortable",
        barrier: "Not enough time",
        safety: "none",
    });
    plan = completeSlot(plan, plan.days[1].id, "primary", {
        difficulty: "easy",
        barrier: "Not enough time",
        safety: "none",
    });
    plan = completeSlot(plan, plan.days[2].id, "primary", {
        difficulty: "difficult",
        barrier: "Low energy",
        safety: "pain",
    });

    return plan;
}

describe("Phase C rest action visibility", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("shows one visible secondary Rest action and keeps the primary CTA dominant", () => {
        const plan = makePlan();

        renderWorld(plan);

        const rest = screen.getByRole("button", { name: "Rest" });

        expect(rest).toHaveClass("btn", "btn--secondary", "rest-action");
        expect(rest).not.toHaveClass("btn--ghost");
        expect(
            screen.queryByRole("button", { name: /undo/i })
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /I did it/i })
        ).toHaveClass("btn", "btn--primary");
    });

    it("rests the planned step through the secondary action", async () => {
        const plan = makePlan();
        const { onJourneyChange } = renderWorld(plan);
        const tester = userEvent.setup();

        await tester.click(screen.getByRole("button", { name: "Rest" }));

        await waitFor(() => expect(onJourneyChange).toHaveBeenCalled());

        const nextJourney = onJourneyChange.mock.calls.at(-1)[0];

        expect(nextJourney.plan.days[0].primary.status).toBe("rested");
        expect(nextJourney.plan.days[0].primary.restReason).toBe("tired");
    });

    it("shows only Undo Rest for a rested focused day and restores planning", async () => {
        const basePlan = makePlan();
        const plan = restSlot(basePlan, basePlan.days[0].id, "primary");
        seedDemoDayArrivals(plan, [0]);
        setDemoClock("12:00", plan.days[0].date);

        const { onJourneyChange } = renderWorld(plan);
        const undo = screen.getByRole("button", { name: "Undo Rest" });
        const tester = userEvent.setup();

        expect(undo).toHaveClass("btn", "btn--secondary", "rest-action");
        expect(undo).not.toHaveClass("btn--ghost");
        expect(
            screen.queryByRole("button", { name: "Rest" })
        ).not.toBeInTheDocument();

        await tester.click(undo);

        await waitFor(() => expect(onJourneyChange).toHaveBeenCalled());

        const nextJourney = onJourneyChange.mock.calls.at(-1)[0];

        expect(nextJourney.plan.days[0].primary.status).toBe("planned");
        expect(nextJourney.plan.days[0].primary.restedAt).toBeNull();
        expect(
            nextJourney.plan.days[0].adaptations?.some(
                (adaptation) => adaptation?.type === "rest"
            )
        ).not.toBe(true);
    });

    it("uses Arabic copy and RTL layout for the rest action", () => {
        const plan = makePlan();

        renderWorld(plan, {}, {}, { locale: "ar" });

        expect(document.documentElement).toHaveAttribute("dir", "rtl");
        expect(
            screen.getByRole("button", { name: "راحة" })
        ).toHaveClass("rest-action");
    });
});

describe("Phase D learning insights on the wellness home", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    function getMetric(card, label) {
        return within(card).getByText(label).nextElementSibling?.textContent;
    }

    function buildReadinessPlan() {
        const basePlan = makePlan();

        return {
            ...basePlan,
            days: basePlan.days.map((day, index) =>
                index === 0
                    ? {
                          ...day,
                          primary: {
                              ...day.primary,
                              adaptedByReadiness: true,
                              plannedDose: 10,
                              dose: 5,
                              readiness: {
                                  energy: "low",
                                  time: 5,
                                  weather: "hot",
                              },
                          },
                      }
                    : day
            ),
        };
    }

    it("renders recorded learning data instead of hardcoded values", () => {
        const plan = buildLearnedPlan();
        const { insight, actions } = getLearningSummary(plan);
        const barrierKey =
            BARRIER_KEYS[insight.topBarrier.barrier] ??
            insight.topBarrier.barrier;

        renderWorld(plan);

        const card = screen.getByRole("region", {
            name: en["outcomes.learning.title"],
        });

        expect(
            within(card).getByText(
                interpolate(en["outcomes.learning.lead"], {
                    count: insight.totalResolved,
                })
            )
        ).toBeInTheDocument();
        expect(getMetric(card, en["outcomes.learning.sample"])).toBe(
            String(insight.sampleSize)
        );
        expect(getMetric(card, en["outcomes.learning.steps"])).toBe(
            String(actions.length)
        );
        expect(getMetric(card, en["outcomes.learning.comfort"])).toBe(
            `${insight.comfortRate}%`
        );
        expect(
            within(card).getByText(
                interpolate(en["outcomes.learning.action"], {
                    action: insight.topAction.title,
                    count: insight.topAction.effective,
                })
            )
        ).toBeInTheDocument();
        expect(
            within(card).getByText(
                interpolate(en["outcomes.learning.barrier"], {
                    barrier:
                        en[barrierKey] ?? insight.topBarrier.barrier,
                    count: insight.topBarrier.count,
                })
            )
        ).toBeInTheDocument();
        expect(
            within(card).getByText(
                interpolate(en["outcomes.learning.safety"], {
                    count: insight.safetyPauses,
                })
            )
        ).toBeInTheDocument();
        expect(
            within(card).getByText(
                en[`outcomes.learning.guidance.${insight.guidance}`]
            )
        ).toBeInTheDocument();
        expect(
            within(card).getByText(
                interpolate(en["outcomes.learning.limit"], {
                    count: insight.totalResolved,
                })
            )
        ).toBeInTheDocument();
        expect(
            within(card).queryByText(/outcomes\.learning|learning\.insights/)
        ).not.toBeInTheDocument();
    });

    it("shows an honest empty state when no learning data is recorded", () => {
        renderWorld(makePlan());

        const card = screen.getByRole("region", {
            name: en["outcomes.learning.title"],
        });

        expect(
            within(card).getByText(en["outcomes.learning.empty"])
        ).toBeInTheDocument();
        expect(
            within(card).getByText(
                interpolate(en["outcomes.learning.limit"], { count: 0 })
            )
        ).toBeInTheDocument();
        expect(
            within(card).queryByText(en["outcomes.learning.sample"])
        ).not.toBeInTheDocument();
        expect(
            within(card).queryByText(/outcomes\.learning|learning\.insights/)
        ).not.toBeInTheDocument();
    });

    it("renders Arabic learning data with RTL-safe localized copy", () => {
        const plan = buildLearnedPlan();
        const { insight } = getLearningSummary(plan);

        renderWorld(plan, {}, {}, { locale: "ar" });

        expect(document.documentElement).toHaveAttribute("dir", "rtl");

        const card = screen.getByRole("region", {
            name: ar["outcomes.learning.title"],
        });

        expect(
            within(card).getByText(
                interpolate(ar["outcomes.learning.lead"], {
                    count: insight.totalResolved,
                })
            )
        ).toBeInTheDocument();
        expect(getMetric(card, ar["outcomes.learning.comfort"])).toBe(
            `${insight.comfortRate}%`
        );
        expect(
            within(card).getByText(
                interpolate(ar["outcomes.learning.limit"], {
                    count: insight.totalResolved,
                })
            )
        ).toBeInTheDocument();
        expect(
            within(card).queryByText(/outcomes\.learning|learning\.insights/)
        ).not.toBeInTheDocument();
    });

    it.each([
        ["en", en],
        ["ar", ar],
    ])(
        "renders the localized readiness weather and reason for %s",
        (locale, dictionary) => {
            const plan = buildReadinessPlan();

            renderWorld(plan, {}, {}, { locale });

            expect(
                screen.getByText(
                    interpolate(dictionary["readiness.adapted"], {
                        dose: plan.days[0].primary.dose,
                        energy: dictionary["readiness.energy.low.label"],
                        weather: dictionary["readiness.weather.hot"],
                    })
                )
            ).toBeInTheDocument();
            expect(
                screen.getByText(dictionary["readiness.noAdaptationReason"])
            ).toBeInTheDocument();
            expect(
                screen.queryByText(
                    /readiness\.weather|readiness\.noAdaptationReason/
                )
            ).not.toBeInTheDocument();
        }
    );

    it("uses the localized Undo Rest label in Arabic", () => {
        const basePlan = makePlan();
        const plan = restSlot(basePlan, basePlan.days[0].id, "primary");

        seedDemoDayArrivals(plan, [0]);
        setDemoClock("12:00", plan.days[0].date);
        renderWorld(plan, {}, {}, { locale: "ar" });

        expect(
            screen.getByRole("button", { name: ar["world.undoRest"] })
        ).toHaveClass("rest-action");
        expect(screen.queryByText("world.undoRest")).not.toBeInTheDocument();
    });
});

describe("wellness home day selection", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("shows the next unfinished day, not the calendar day", () => {
        const plan = completeDay(makePlan(), 0);

        renderWorld(plan);

        expect(screen.getByText("DAY 2 OF 3")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: plan.days[1].primary.title })
        ).toBeInTheDocument();
    });

    it("shows the first day when nothing has been done yet", () => {
        const plan = makePlan();

        renderWorld(plan);

        expect(screen.getByText("DAY 1 OF 3")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: plan.days[0].primary.title })
        ).toBeInTheDocument();
    });

    it("keeps a missed day open instead of jumping to today's date", () => {
        const plan = completeDay(makePlan(), 0);

        renderWorld(plan);

        expect(screen.getByText(/Picked up where you left off/i)).toBeInTheDocument();
        expect(
            screen.queryByRole("heading", { name: plan.days[2].primary.title })
        ).not.toBeInTheDocument();
    });

    it("does not show a completed activity again", () => {
        const plan = completeDay(makePlan(), 0);

        renderWorld(plan);

        expect(
            screen.queryByRole("heading", { name: plan.days[0].primary.title })
        ).not.toBeInTheDocument();
    });

    it("logs the check-in against the selected day and saves it", async () => {
        const plan = completeDay(makePlan(), 0);
        const { onJourneyChange } = renderWorld(plan);

        const tester = userEvent.setup();
        await tester.click(screen.getByRole("button", { name: /I did it/i }));

        expect(
            screen.getByRole("heading", { name: /How did that feel/i })
        ).toBeInTheDocument();

        await tester.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await waitFor(() => expect(onJourneyChange).toHaveBeenCalled());

        const nextJourney = onJourneyChange.mock.calls.at(-1)[0];

        expect(nextJourney.plan.days[1].primary.status).toBe("completed");
        expect(nextJourney.plan.days[1].primary.completedAt).toBeTruthy();
        expect(
            nextJourney.plan.days[1].primary.feedback.enjoyment
        ).toBe("okay");
        expect(nextJourney.plan.days[0].primary.status).toBe("completed");
        expect(nextJourney.plan.days[2].primary.status).toBe("planned");
    });

    it("saves the enjoyment signal with the check-in", async () => {
        const plan = completeDay(makePlan(), 0);
        const { onJourneyChange } = renderWorld(plan);

        const tester = userEvent.setup();
        await tester.click(screen.getByRole("button", { name: /I did it/i }));
        await tester.click(
            screen.getByRole("radio", { name: /I enjoyed it/i })
        );
        await tester.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await waitFor(() => expect(onJourneyChange).toHaveBeenCalled());

        const nextJourney = onJourneyChange.mock.calls.at(-1)[0];

        expect(
            nextJourney.plan.days[1].primary.feedback.enjoyment
        ).toBe("loved");
    });

    it("opens the following day once the selected day is finished", async () => {
        const plan = completeDay(makePlan(), 0);
        const { onJourneyChange } = renderWorld(plan);

        const tester = userEvent.setup();
        await tester.click(screen.getByRole("button", { name: /I did it/i }));
        await tester.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await waitFor(() => expect(onJourneyChange).toHaveBeenCalled());

        const nextJourney = onJourneyChange.mock.calls.at(-1)[0];

        renderWorld(nextJourney.plan);

        expect(screen.getAllByText("DAY 3 OF 3").length).toBeGreaterThan(0);
        expect(
            screen.getByRole("heading", { name: nextJourney.plan.days[2].primary.title })
        ).toBeInTheDocument();
    });

    it("keeps the activity history integration working", async () => {
        const plan = completeDay(makePlan(), 0);
        renderWorld(plan);

        const tester = userEvent.setup();
        await tester.click(screen.getByRole("button", { name: /I did it/i }));
        await tester.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await waitFor(() =>
            expect(createWalkingActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    durationMinutes: plan.days[1].primary.dose,
                })
            )
        );
    });

    it("shows a clear completion state for the day that was just finished", async () => {
        const plan = completeDay(makePlan(), 0);
        const { onJourneyChange } = renderWorld(plan);

        const tester = userEvent.setup();
        await tester.click(screen.getByRole("button", { name: /I did it/i }));
        await tester.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await waitFor(() => expect(onJourneyChange).toHaveBeenCalled());

        const nextJourney = onJourneyChange.mock.calls.at(-1)[0];

        renderWorld(nextJourney.plan);

        expect(screen.getByText("Day 2 complete.")).toBeInTheDocument();
        expect(
            screen.getAllByText("Kept today. That is enough.").length
        ).toBeGreaterThan(0);
    });

    it("opens the next movement step while keeping sleep optional", () => {
        const plan = addSecondaryGoal(buildPlan(profile), profile, "sleep");
        const next = completeSlot(
            plan,
            plan.days[0].id,
            "primary",
            feedback
        );

        renderWorld(next);

        expect(screen.getByText("DAY 2 OF 28")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", {
                name: next.days[1].primary.title,
            })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", {
                name: next.days[0].secondary.title,
            })
        ).toBeInTheDocument();
        expect(screen.getByText("Optional · Day 1")).toBeInTheDocument();
    });

    it("keeps the optional step usable after movement advances", async () => {
        const plan = addSecondaryGoal(buildPlan(profile), profile, "sleep");
        const { onJourneyChange } = renderWorld(plan);

        const tester = userEvent.setup();
        await tester.click(
            screen.getAllByRole("button", { name: /I did it/i })[0]
        );
        await tester.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await waitFor(() => expect(onJourneyChange).toHaveBeenCalled());

        const nextJourney = onJourneyChange.mock.calls.at(-1)[0];

        expect(nextJourney.plan.days[0].primary.status).toBe("completed");
        expect(nextJourney.plan.days[0].secondary.status).toBe("planned");

        cleanup();
        renderWorld(nextJourney.plan);

        expect(screen.getByText("DAY 2 OF 28")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", {
                name: nextJourney.plan.days[0].secondary.title,
            })
        ).toBeInTheDocument();
    });

    it("shows remaining optional steps after the primary path finishes", () => {
        const plan = addSecondaryGoal(buildPlan(profile), profile, "sleep");
        const primaryComplete = {
            ...plan,
            days: plan.days.map((day) => ({
                ...day,
                primary: { ...day.primary, status: "completed" },
            })),
        };

        renderWorld(primaryComplete);

        expect(screen.getByText("One optional quest")).toBeInTheDocument();
        expect(
            screen.getByText("OPTIONAL · DAY 1 OF 28")
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", {
                name: primaryComplete.days[0].secondary.title,
            })
        ).toBeInTheDocument();
        expect(
            screen.queryByText("Your first plan is complete.")
        ).not.toBeInTheDocument();
    });

    it("celebrates a completed step with a gentle burst", async () => {
        const plan = makePlan();

        renderWorld(plan);

        const tester = userEvent.setup();

        expect(
            screen.queryByTestId("celebration-burst")
        ).not.toBeInTheDocument();

        await tester.click(screen.getByRole("button", { name: /I did it/i }));
        await tester.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await waitFor(() =>
            expect(screen.getByTestId("celebration-burst")).toBeInTheDocument()
        );
        expect(
            document.querySelector(".companion-pair--dancing")
        ).not.toBeNull();
        expect(
            document.querySelector(".companion-stage--celebrating")
        ).not.toBeNull();
        expect(
            document.querySelector('[class*="companion-pair--dance-"]')
        ).not.toBeNull();
    });

    it("does not celebrate a safety pause", async () => {
        const plan = makePlan();
        const { onJourneyChange } = renderWorld(plan);

        const tester = userEvent.setup();

        await tester.click(screen.getByRole("button", { name: /I did it/i }));
        await tester.click(
            document.querySelector('input[name="safety"][value="pain"]')
        );
        await tester.click(
            screen.getByRole("button", { name: /Pause and save/i })
        );

        await waitFor(() => expect(onJourneyChange).toHaveBeenCalled());

        expect(
            screen.queryByTestId("celebration-burst")
        ).not.toBeInTheDocument();
        expect(
            document.querySelector(".companion-pair--dancing")
        ).toBeNull();
        expect(
            document.querySelector(".companion-stage--celebrating")
        ).toBeNull();
    });

    it("lets the completion sound be turned off", async () => {
        const { onJourneyChange } = renderWorld(makePlan());

        const tester = userEvent.setup();

        await tester.click(
            screen.getByRole("button", { name: "Open settings" })
        );

        const toggle = screen.getByRole("checkbox", {
            name: /Completion sound/i,
        });

        expect(toggle).toBeChecked();

        await tester.click(toggle);

        const nextJourney = onJourneyChange.mock.calls.at(-1)[0];

        expect(nextJourney.preferences.soundEnabled).toBe(false);
    });
});

describe("re-engagement states", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("offers a smaller step while slipping", () => {
        const plan = makePlan(3, 2);
        renderWorld(plan, {}, { preferences: { showReturnCard: true } });

        expect(
            screen.getByRole("heading", {
                name: "Start smaller today.",
            })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", {
                name: "Try a smaller step",
            })
        ).toBeInTheDocument();
    });

    it("commits a smaller step from the slipping card", async () => {
        const tester = userEvent.setup();
        const plan = makePlan(3, 2);
        const { onJourneyChange } = renderWorld(
            plan,
            {},
            { preferences: { showReturnCard: true } }
        );

        await tester.click(
            screen.getByRole("button", {
                name: "Try a smaller step",
            })
        );

        expect(onJourneyChange).toHaveBeenCalled();
    });

    it("shows the welcome-back card after the lapse threshold", () => {
        const plan = makePlan(3, 4);
        renderWorld(plan, {}, { preferences: { showReturnCard: true } });

        expect(
            screen.getByRole("heading", {
                name: "Your world kept a place for you.",
            })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("heading", {
                name: "Start smaller today.",
            })
        ).toBeNull();
    });

    it("shows an in-app reminder when reminders are enabled", () => {
        const plan = makePlan(3, 2);
        renderWorld(
            plan,
            {},
            {
                preferences: {
                    showReturnCard: true,
                    reminders: {
                        enabled: true,
                        cadence: "daily",
                        channel: "in_app",
                        quietHours: {
                            start: "00:00",
                            end: "00:00",
                        },
                    },
                },
            }
        );

        expect(
            screen.getByText("A gentle reminder")
        ).toBeInTheDocument();
    });

    it("stays quiet when the plan is on-track", () => {
        renderWorld(makePlan(3, 0), {}, {
            preferences: {
                showReturnCard: true,
                reminders: {
                    enabled: true,
                    cadence: "daily",
                    channel: "in_app",
                    quietHours: { start: "00:00", end: "00:00" },
                },
            },
        });

        expect(
            screen.queryByRole("heading", {
                name: "Start smaller today.",
            })
        ).toBeNull();
        expect(screen.queryByText("A gentle reminder")).toBeNull();
    });

    it("shows the paused card while the plan rests", () => {
        renderWorld({ ...makePlan(3, 0), paused: true });

        expect(
            screen.getByRole("heading", {
                name: "Your plan is resting.",
            })
        ).toBeInTheDocument();
    });
});

describe("Arabic localization on the wellness home", () => {
    it("renders realm and realm-panel copy in Arabic", () => {
        const plan = makePlan();

        render(
            <I18nProvider initialLocale="ar">
                <WorldPage
                    journey={{
                        version: 2,
                        profile,
                        plan,
                        preferences: {
                            showReturnCard: false,
                            quietWorld: true,
                        },
                        updatedAt: new Date().toISOString(),
                    }}
                    user={user}
                    onJourneyChange={vi.fn()}
                    onReset={vi.fn()}
                    onOpenAdventure={vi.fn()}
                    onLogout={vi.fn()}
                />
            </I18nProvider>
        );

        expect(
            screen.getByRole("heading", { level: 1, name: "وادي الحيوية" })
        ).toBeInTheDocument();
        expect(screen.getAllByText("مجالاتك").length).toBeGreaterThan(0);
        expect(screen.getByText("النوم")).toBeInTheDocument();
    });
});

describe("living world on the wellness home", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("offers a quiet link to the world before a step is completed", () => {
        renderWorld(makePlan());

        expect(
            screen.queryByText(/Your world grew a little/i)
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Open your world" })
        ).toBeInTheDocument();
    });

    it("shows world growth as soon as a step is completed", () => {
        const plan = completeDay(makePlan(), 0);

        renderWorld(plan);

        expect(
            screen.getByText(/Your world grew a little/i)
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Visit your world" })
        ).toBeInTheDocument();
    });

    it("opens the world from the growth panel", async () => {
        const plan = completeDay(makePlan(), 0);
        const onOpenAdventure = vi.fn();

        renderWorld(plan, { onOpenAdventure });

        const tester = userEvent.setup();
        await tester.click(
            screen.getByRole("button", { name: "Visit your world" })
        );

        expect(onOpenAdventure).toHaveBeenCalled();
    });

    it("keeps the world link after a step has been kept", () => {
        const plan = completeDay(makePlan(), 0);

        renderWorld(plan);

        expect(
            screen.getByRole("button", { name: "Visit your world" })
        ).toBeInTheDocument();
    });
});

describe("progress on the wellness home", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("shows the moments kept without opening anything", () => {
        const plan = makePlan();

        renderWorld(plan);

        expect(screen.getByText("0 of 3 moments")).toBeInTheDocument();
        expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("moves the moments kept after a step is completed", async () => {
        const plan = makePlan();
        const { onJourneyChange } = renderWorld(plan);

        const tester = userEvent.setup();
        await tester.click(screen.getByRole("button", { name: /I did it/i }));
        await tester.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await waitFor(() => expect(onJourneyChange).toHaveBeenCalled());

        const nextJourney = onJourneyChange.mock.calls.at(-1)[0];

        renderWorld(nextJourney.plan);

        expect(screen.getAllByText("1 of 3 moments").length).toBeGreaterThan(0);
        expect(screen.getAllByText("33%").length).toBeGreaterThan(0);
    });
});

describe("movement progression on the wellness home", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    const habit = {
        habit_id: "movement-walk-5",
        domain: "movement",
        title: "Short walk",
        description: "Take a comfortable walk at your own pace.",
        progression_profiles: [
            {
                metric: "duration_minutes",
                starting_level: 1,
                levels: [
                    { level: 1, name: "Getting started", target: { metric: "duration_minutes", value: 5 } },
                    { level: 2, name: "Building consistency", target: { metric: "duration_minutes", value: 7 } },
                    { level: 3, name: "Growing stronger", target: { metric: "duration_minutes", value: 10 } },
                    { level: 4, name: "Making it a routine", target: { metric: "duration_minutes", value: 15 } },
                ],
            },
        ],
        com_b_components: ["physical_opportunity"],
        bct_mappings: [
            { bct_id: "8.7", implementation: "Increase the walk when feedback supports it.", delivery_method: "progression_engine" },
        ],
        progression: {
            enabled: true,
            strategy: "feedback_gated",
            lookback_sessions: 5,
            min_successful_sessions: 2,
            required_feedback: ["easy", "comfortable"],
        },
        safety_considerations: ["Adapt the activity to the user's ability."],
        clinical_basis: "WHO (2020) removed the 10-minute minimum bout.",
        active: true,
    };

    const catalog = {
        schema_version: "1.0.0",
        catalog_version: "1.0.0",
        domain: "movement",
        reviewed_at: "2026-11-14",
        boundaries: {
            not_for: ["Diagnosis, treatment or rehabilitation of a medical condition."],
            seek_help_if: ["Chest pain, faintness, dizziness or unusual shortness of breath."],
            population_exclusions: [],
        },
        safety_rules: {
            screening: ["Ask whether a clinician has advised limiting activity."],
            signals: [
                {
                    code: "pain",
                    label: "Pain",
                    guidance: "Pause the activity and choose a gentler option.",
                },
            ],
        },
        habits: [habit],
    };

    function makeBackendPlan() {
        const start = addDays(new Date(), -1);

        return buildPlan(profile, start, {
            movementActions: [mapHabitToAction(habit, catalog)],
        });
    }

    it("shows the level next to the duration for backend-backed steps", () => {
        const plan = makeBackendPlan();

        renderWorld(plan);

        expect(screen.getByText(/Level 1/)).toBeInTheDocument();
        expect(screen.getByText("5 min")).toBeInTheDocument();
    });

    it("shows a level chip for local-catalog steps too", () => {
        renderWorld(makePlan());

        expect(screen.getByText(/Level 1/)).toBeInTheDocument();
    });

    it("renders a backend nutrition step with its realm and level", () => {
        const nutritionHabit = {
            ...habit,
            habit_id: "nutrition-veggie-first",
            domain: "nutrition",
            title: "Add a vegetable first",
        };
        const plan = buildPlan(
            {
                primaryGoalId: "nutrition",
                goalIds: ["nutrition"],
                answers: {},
            },
            addDays(new Date(), -1),
            {
                actionsByGoal: {
                    nutrition: [mapHabitToAction(nutritionHabit)],
                },
            }
        );

        renderWorld(plan);

        expect(
            document.querySelector(".realm-chip--nutrition")
        ).not.toBeNull();
        expect(screen.getByText(/Level 1/)).toBeInTheDocument();
        expect(screen.getByText("Add a vegetable first")).toBeInTheDocument();
    });

    it("explains growth and clinical basis for local fallback steps", async () => {
        renderWorld(makePlan());

        const tester = userEvent.setup();
        await tester.click(
            screen.getByRole("button", { name: /Why this\?/i })
        );

        expect(screen.getByText("Growing")).toBeInTheDocument();
        expect(screen.getByText("Clinical basis & limits")).toBeInTheDocument();
        expect(
            screen.getByText(/ADA and Sports Medicine/i)
        ).toBeInTheDocument();
    });

    it("explains the growth step and clinical basis in the why sheet", async () => {
        const plan = makeBackendPlan();

        renderWorld(plan);

        const tester = userEvent.setup();
        await tester.click(
            screen.getByRole("button", { name: /Why this\?/i })
        );

        expect(screen.getByText("Growing")).toBeInTheDocument();
        expect(screen.getByText("Clinical basis & limits")).toBeInTheDocument();
        expect(
            screen.getByText(/WHO \(2020\) removed the 10-minute minimum bout/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Diagnosis, treatment or rehabilitation/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Chest pain, faintness, dizziness/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Next gentle step: 7 min/i)
        ).toBeInTheDocument();
    });
});

describe("readiness on the wellness home", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("applies an optional readiness check-in to today's step", async () => {
        const plan = makePlan();
        const { onJourneyChange } = renderWorld(plan);
        const tester = userEvent.setup();

        await tester.click(
            screen.getByRole("button", { name: /Check in/i })
        );
        await tester.click(screen.getByLabelText(/Low/i));
        await tester.click(screen.getByLabelText("2 min"));
        await tester.click(
            screen.getByRole("button", { name: /Use this for today/i })
        );

        await waitFor(() => expect(onJourneyChange).toHaveBeenCalled());

        const nextPlan = onJourneyChange.mock.calls.at(-1)[0].plan;
        const entry = nextPlan.days[0].primary;

        expect(entry.readiness).toMatchObject({
            energy: "low",
            time: 2,
        });
        expect(entry.dose).toBeLessThanOrEqual(2);
        expect(entry.plannedDose).toBe(plan.days[0].primary.dose);
        expect(entry.readinessTag).toBe("low");
    });
});

describe("backend journey completion", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("sends a completion command and keeps adaptation to the server", async () => {
        vi.stubEnv("VITE_USE_BACKEND_JOURNEY", "true");
        const plan = makePlan();
        const onCompleteJourney = vi.fn(async () => null);
        const { onJourneyChange } = renderWorld(plan, {
            onCompleteJourney,
        });

        const tester = userEvent.setup();
        await tester.click(
            screen.getByRole("button", { name: /I did it/i })
        );
        await tester.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await waitFor(() =>
            expect(onCompleteJourney).toHaveBeenCalledTimes(1)
        );

        const command = onCompleteJourney.mock.calls[0][0];
        const nextJourney = onJourneyChange.mock.calls.at(-1)[0];
        const completedDay = nextJourney.plan.days.find(
            (day) => day.primary.status === "completed"
        );

        expect(command).toMatchObject({
            dayId: completedDay.id,
            slot: "primary",
        });
        expect(command.idempotencyKey).toBeTruthy();
        expect(onJourneyChange.mock.calls.at(-1)[1]).toMatchObject({
            skipSync: true,
        });
        expect(
            nextJourney.plan.days.find(
                (day) => day.id !== completedDay.id
            ).primary.progressionLevel
        ).not.toBe(2);
    });

    it("sends the selected demo date with backend completions", async () => {
        vi.stubEnv("VITE_USE_BACKEND_JOURNEY", "true");
        window.localStorage.clear();
        const demoDate = toDateKey(addDays(new Date(), -5));
        setDemoClock("12:00", demoDate);

        const onCompleteJourney = vi.fn(async () => null);
        renderWorld(makePlan(), { onCompleteJourney });

        const tester = userEvent.setup();
        await tester.click(
            screen.getByRole("button", { name: /I did it/i })
        );
        await tester.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await waitFor(() =>
            expect(onCompleteJourney).toHaveBeenCalledTimes(1)
        );

        const command = onCompleteJourney.mock.calls[0][0];
        expect(command.simulatedAt).toBeTruthy();
        expect(command.simulatedAt.slice(0, 10)).toBe(demoDate);
    });
});

describe("ecosystem context on the wellness home", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("shows the adaptation tag on an adapted step", () => {
        const plan = buildPlan(profile, addDays(new Date(), -5), {
            ecosystemContext:
                getSampleAbuDhabiProfile("desk_heat"),
        });

        renderWorld({ ...plan, days: plan.days.slice(0, 3) });

        expect(
            screen.getByText("Indoor heat-safe")
        ).toBeInTheDocument();
    });

    it("renders the adaptation tag in Arabic", () => {
        const plan = buildPlan(profile, addDays(new Date(), -5), {
            ecosystemContext:
                getSampleAbuDhabiProfile("desk_heat"),
        });

        render(
            <I18nProvider initialLocale="ar">
                <WorldPage
                    journey={{
                        version: 2,
                        profile,
                        plan: { ...plan, days: plan.days.slice(0, 3) },
                        preferences: {
                            showReturnCard: false,
                            quietWorld: true,
                        },
                        updatedAt: new Date().toISOString(),
                    }}
                    user={user}
                    onJourneyChange={vi.fn()}
                    onReset={vi.fn()}
                    onOpenAdventure={vi.fn()}
                    onLogout={vi.fn()}
                />
            </I18nProvider>
        );

        expect(
            screen.getByText("مناسب للحرارة — داخلي")
        ).toBeInTheDocument();
    });

    it("adds context flags from the autonomy centre and re-adapts open steps", async () => {
        const tester = userEvent.setup();
        const { onJourneyChange } = renderWorld(makePlan());

        await tester.click(
            screen.getByRole("button", { name: "Open settings" })
        );
        await tester.click(
            screen.getByRole("checkbox", {
                name: /extreme heat mode/i,
            })
        );

        const nextJourney =
            onJourneyChange.mock.calls.at(-1)[0];

        expect(
            nextJourney.plan.ecosystemContext.contextFlags
                .extremeHeatMode
        ).toBe(true);
        expect(
            nextJourney.plan.days[0].primary.adaptationTag
        ).toBe("indoor_heat_safe");
        expect(
            screen.getByText(
                "Upcoming steps were adapted to your new context. Your earlier steps are unchanged."
            )
        ).toBeInTheDocument();
    });

    it("explains the screening focus in the why sheet", async () => {
        const tester = userEvent.setup();
        const plan = buildPlan(profile, addDays(new Date(), -5), {
            ecosystemContext:
                getSampleAbuDhabiProfile("desk_heat"),
        });

        renderWorld({ ...plan, days: plan.days.slice(0, 3) });

        await tester.click(
            screen.getByRole("button", { name: "Why this?" })
        );

        expect(
            screen.getByText(
                "Why this fits your screening focus"
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(/cardio-metabolic risk factors/)
        ).toBeInTheDocument();
    });
});

describe("time-based nudges on the wellness home", () => {
    const nudgePreferences = {
        showReturnCard: false,
        quietWorld: true,
        nudges: { enabled: true, channel: "in_app" },
    };

    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        cleanup();
        window.localStorage.clear();
    });

    it("shows the movement nudge inside its demo window", () => {
        setDemoClock("19:30");

        renderWorld(makePlan(), {}, { preferences: nudgePreferences });

        expect(screen.getByText("The valley is open")).toBeInTheDocument();
        expect(
            screen.getByText(
                "A short walk or a gentle stretch would fit right now."
            )
        ).toBeInTheDocument();
        expect(screen.getByTitle("Demo time 19:30")).toBeInTheDocument();
    });

    it("stays silent while nudges are disabled", () => {
        setDemoClock("19:30");

        renderWorld(
            makePlan(),
            {},
            {
                preferences: {
                    ...nudgePreferences,
                    nudges: { enabled: false },
                },
            }
        );

        expect(
            screen.queryByText("The valley is open")
        ).not.toBeInTheDocument();
    });

    it("stays silent during busy hours", () => {
        setDemoClock("19:30");

        renderWorld(
            makePlan(),
            {},
            {
                preferences: {
                    ...nudgePreferences,
                    schedule: {
                        mode: "custom",
                        windows: {
                            movement: [
                                { start: "19:00", end: "21:00" },
                            ],
                        },
                        quietHours: {
                            start: "19:00",
                            end: "20:00",
                        },
                    },
                },
            }
        );

        expect(
            screen.queryByText("The valley is open")
        ).not.toBeInTheDocument();
    });

    it("lets the judge pick a slot from the demo clock", async () => {
        const tester = userEvent.setup();

        renderWorld(makePlan(), {}, { preferences: nudgePreferences });

        expect(
            screen.queryByText("A movement moment is here")
        ).not.toBeInTheDocument();

        await tester.click(
            screen.getByRole("button", { name: "Open Demo Journey" })
        );

        fireEvent.change(screen.getByLabelText("Demo time"), {
            target: { value: "20:00" },
        });
        await tester.click(
            screen.getByRole("button", {
                name: "Apply demo settings",
            })
        );

        await waitFor(() =>
            expect(
                screen.getByText("A movement moment is here")
            ).toBeInTheDocument()
        );
        expect(screen.getByTitle("Demo time 20:00")).toBeInTheDocument();
    });

    it("snoozes the nudge from the banner", async () => {
        const tester = userEvent.setup();
        setDemoClock("20:30");

        renderWorld(makePlan(), {}, { preferences: nudgePreferences });

        expect(
            screen.getByText("The valley is closing")
        ).toBeInTheDocument();

        await tester.click(
            screen.getByRole("button", { name: "Snooze 90 min" })
        );

        await waitFor(() =>
            expect(
                screen.queryByText("The valley is closing")
            ).not.toBeInTheDocument()
        );
    });

    it("moves to the night schedule when the shift flag is set", async () => {
        const tester = userEvent.setup();

        const { onJourneyChange } = renderWorld(
            makePlan(),
            {},
            { preferences: nudgePreferences }
        );

        await tester.click(
            screen.getByRole("button", { name: "Open settings" })
        );
        await tester.click(
            screen.getByRole("checkbox", { name: /Shift worker/i })
        );

        const nextJourney = onJourneyChange.mock.calls.at(-1)[0];

        expect(nextJourney.preferences.schedule.mode).toBe("night");
        expect(nextJourney.preferences.schedule.windows.sleep).toEqual([
            { start: "09:00", end: "11:00" },
        ]);
    });
});

describe("demo journey entry point", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        cleanup();
        window.localStorage.clear();
    });

    it("is labelled and shows the actual system date when no demo date is set", () => {
        renderWorld(makePlan());

        const entry = screen.getByRole("button", {
            name: /Demo Journey/i,
        });

        expect(entry).toBeInTheDocument();
        expect(
            within(entry).getByText(`System date ${toDateKey()}`)
        ).toBeInTheDocument();
    });

    it("shows the selected demo day and date after applying it", async () => {
        const tester = userEvent.setup();
        const plan = makePlan(7);

        renderWorld(plan);

        await tester.click(
            screen.getByRole("button", { name: /Demo Journey/i })
        );
        await tester.click(
            screen.getByRole("button", { name: /Day 3/ })
        );
        await tester.click(
            screen.getByRole("button", {
                name: "Apply demo settings",
            })
        );

        const entry = screen.getByRole("button", {
            name: /Demo Journey/i,
        });

        expect(
            within(entry).getByText(`Day 3 · ${plan.days[2].date}`)
        ).toBeInTheDocument();
        expect(entry).toHaveAccessibleName(
            new RegExp(`Day 3.*${plan.days[2].date}.*19:30`)
        );
        expect(getDemoClock()?.date).toBe(plan.days[2].date);
    });
});

describe("Phase B.1 demo journey corrections", () => {
    const nudgePreferences = {
        showReturnCard: false,
        quietWorld: true,
        nudges: { enabled: true, channel: "in_app" },
    };

    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        cleanup();
        window.localStorage.clear();
        vi.unstubAllEnvs();
    });

    it("makes the applied journey day the active day", async () => {
        const plan = makePlan(7);
        seedDemoDayArrivals(plan);

        renderWorld(plan);

        await applyDemoDay(3, "12:00");

        expect(screen.getByText("DAY 4 OF 7")).toBeInTheDocument();
        expect(
            screen.getAllByRole("heading", {
                name: plan.days[3].primary.title,
            }).length
        ).toBeGreaterThan(0);
        expect(screen.queryByText("DAY 1 OF 7")).not.toBeInTheDocument();
        expect(getDemoClock()?.date).toBe(plan.days[3].date);
    });

    it("completes the displayed day with a matching simulated timestamp", async () => {
        vi.stubEnv("VITE_USE_BACKEND_JOURNEY", "true");
        const plan = makePlan(7);
        seedDemoDayArrivals(plan);
        setDemoClock("12:00", plan.days[2].date);
        const onCompleteJourney = vi.fn(async () => null);

        const { onJourneyChange } = renderWorld(plan, {
            onCompleteJourney,
        });

        expect(screen.getByText("DAY 3 OF 7")).toBeInTheDocument();

        const tester = userEvent.setup();
        await tester.click(
            screen.getByRole("button", { name: /I did it/i })
        );
        await tester.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await waitFor(() =>
            expect(onCompleteJourney).toHaveBeenCalledTimes(1)
        );

        const command = onCompleteJourney.mock.calls[0][0];
        const nextJourney = onJourneyChange.mock.calls.at(-1)[0];

        expect(command.dayId).toBe(plan.days[2].id);
        expect(command.simulatedAt.slice(0, 10)).toBe(
            plan.days[2].date
        );
        expect(nextJourney.plan.days[2].primary.status).toBe("completed");
        expect(nextJourney.plan.days[0].primary.status).toBe("planned");
    });

    it("preserves completed and rested progress while switching days", async () => {
        const initial = makePlan(7);
        const completed = completeDay(initial, 0);
        const plan = restSlot(completed, completed.days[1].id, "primary");
        seedDemoDayArrivals(plan);

        const { onJourneyChange } = renderWorld(plan);

        await applyDemoDay(0, "12:00");
        expect(screen.getByText("DAY 1 OF 7")).toBeInTheDocument();
        expect(screen.getByText("This day is complete.")).toBeInTheDocument();

        await applyDemoDay(1, "12:00");
        expect(screen.getByText("DAY 2 OF 7")).toBeInTheDocument();
        expect(screen.getByText("This was a rest day.")).toBeInTheDocument();
        expect(screen.queryByText(/^missed$/i)).not.toBeInTheDocument();

        await applyDemoDay(4, "12:00");
        expect(screen.getByText("DAY 5 OF 7")).toBeInTheDocument();
        expect(
            screen.getAllByRole("heading", {
                name: plan.days[4].primary.title,
            }).length
        ).toBeGreaterThan(0);

        expect(onJourneyChange).not.toHaveBeenCalled();
        expect(plan.days[0].primary.status).toBe("completed");
        expect(plan.days[1].primary.status).toBe("rested");
    });

    it("opens the Mood Deck for a new simulated day and stores its mood there", async () => {
        const plan = makePlan(7);
        seedDemoDayArrivals(plan, [0]);

        renderWorld(plan);

        await applyDemoDay(1, "09:00");

        expect(
            screen.getByRole("heading", {
                name: "How are you arriving today?",
            })
        ).toBeInTheDocument();

        const tester = userEvent.setup();
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "Use this for today" })
        );

        expect(getArrivalEntry(user.user_id, plan.days[1].date)).toMatchObject({
            mood: "calm",
        });
        expect(getMoodEntry(user.user_id, plan.days[1].date)?.mood).toBe(
            "calm"
        );
        expect(getMoodEntry(user.user_id, plan.days[0].date)).toBeNull();
        expect(getMoodEntry(user.user_id, toDateKey())).toBeNull();
    });

    it("does not reopen the Mood Deck when returning to a completed simulated day", async () => {
        const plan = makePlan(7);
        seedDemoDayArrivals(plan, [0]);

        renderWorld(plan);

        await applyDemoDay(1, "09:00");

        const tester = userEvent.setup();
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "Use this for today" })
        );

        await applyDemoDay(0, "09:00");
        expect(
            screen.queryByRole("heading", {
                name: "How are you arriving today?",
            })
        ).not.toBeInTheDocument();
        expect(screen.getByText("Daily check-in")).toBeInTheDocument();

        await applyDemoDay(1, "09:00");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByText("Today feels Calm.")).toBeInTheDocument();
    });

    it("shows a relevant nudge after a simulated time and day jump", async () => {
        const plan = makePlan(7);
        seedDemoDayArrivals(plan);

        renderWorld(plan, {}, { preferences: nudgePreferences });

        await applyDemoDay(2, "20:00");

        await waitFor(() =>
            expect(
                screen.getByText("A movement moment is here")
            ).toBeInTheDocument()
        );

        const banner = screen
            .getByText("A movement moment is here")
            .closest("article");

        expect(banner).toHaveAttribute(
            "data-nudge-date",
            plan.days[2].date
        );
        expect(banner).toHaveAttribute(
            "data-nudge-day-id",
            plan.days[2].id
        );
    });

    it("keeps a nudge while its activity is planned and clears it after completion", async () => {
        const plan = makePlan(7);
        seedDemoDayArrivals(plan);
        setDemoClock("19:30", plan.days[0].date);

        const { onJourneyChange } = renderWorld(
            plan,
            {},
            { preferences: nudgePreferences }
        );

        expect(screen.getByText("The valley is open")).toBeInTheDocument();

        const tester = userEvent.setup();
        await tester.click(
            screen.getByRole("button", { name: /I did it/i })
        );

        expect(
            screen.queryByText("The valley is open")
        ).not.toBeInTheDocument();

        await tester.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onJourneyChange).not.toHaveBeenCalled();
        expect(plan.days[0].primary.status).toBe("planned");
        expect(screen.getByText("The valley is open")).toBeInTheDocument();

        await tester.click(
            screen.getByRole("button", { name: /I did it/i })
        );
        await tester.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await waitFor(() =>
            expect(onJourneyChange).toHaveBeenCalled()
        );
        await waitFor(() =>
            expect(
                screen.queryByText("The valley is open")
            ).not.toBeInTheDocument()
        );
    });

    it("does not carry mood or nudge state across simulated days", async () => {
        const plan = makePlan(7);
        const firstDate = plan.days[0].date;
        const secondDate = plan.days[2].date;

        saveMoodEntry(
            user.user_id,
            "hopeful",
            new Date(`${firstDate}T09:00:00`)
        );
        saveArrivalEntry(
            user.user_id,
            { mood: "hopeful", date: firstDate },
            new Date(`${firstDate}T09:00:00`)
        );
        setDemoClock("19:30", firstDate);

        renderWorld(plan, {}, { preferences: nudgePreferences });

        const firstBanner = screen
            .getByText("The valley is open")
            .closest("article");
        expect(firstBanner).toHaveAttribute("data-nudge-date", firstDate);

        await applyDemoDay(2, "19:30");

        expect(
            screen.getByRole("heading", {
                name: "How are you arriving today?",
            })
        ).toBeInTheDocument();
        expect(
            screen.queryByText("Today feels Hopeful.")
        ).not.toBeInTheDocument();

        const tester = userEvent.setup();
        await tester.click(
            screen.getByRole("button", {
                name: "Keep my usual step",
            })
        );

        await waitFor(() =>
            expect(
                screen.getByText("The valley is open")
            ).toBeInTheDocument()
        );

        const secondBanner = screen
            .getByText("The valley is open")
            .closest("article");
        expect(secondBanner).toHaveAttribute("data-nudge-date", secondDate);
        expect(secondBanner).toHaveAttribute(
            "data-nudge-day-id",
            plan.days[2].id
        );
        expect(getMoodEntry(user.user_id, firstDate)?.mood).toBe("hopeful");
        expect(getMoodEntry(user.user_id, secondDate)).toBeNull();
    });
});

describe("daily arrival deck on the wellness home", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        cleanup();
        window.localStorage.clear();
    });

    it("auto-opens once a day when the arrival check-in is not done", () => {
        renderWorld(makePlan(), {}, {}, { seedArrival: false });

        expect(
            screen.getByRole("heading", {
                name: "How are you arriving today?",
            })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("group", { name: "Today's mood cards" })
        ).toBeInTheDocument();
    });

    it("does not auto-open when today's arrival is already recorded", () => {
        renderWorld(makePlan());

        expect(
            screen.queryByRole("dialog")
        ).not.toBeInTheDocument();
        expect(screen.getByText("Daily check-in")).toBeInTheDocument();
    });

    it("walks mood, time and weather, then applies the readiness", async () => {
        const tester = userEvent.setup();
        const plan = makePlan();
        const { onJourneyChange } = renderWorld(
            plan,
            {},
            {},
            { seedArrival: false }
        );

        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );

        expect(
            screen.getByText("Today's step will use this.")
        ).toBeInTheDocument();
        expect(screen.getByText("Calm")).toBeInTheDocument();
        expect(screen.getByText("2 min")).toBeInTheDocument();
        expect(screen.getByText("Mild")).toBeInTheDocument();

        await tester.click(
            screen.getByRole("button", { name: "Use this for today" })
        );

        expect(
            screen.queryByRole("dialog")
        ).not.toBeInTheDocument();
        expect(
            screen.getByText("Today feels Calm.")
        ).toBeInTheDocument();

        const entry = getArrivalEntry(user.user_id);

        expect(entry).toMatchObject({
            mood: "calm",
            time: 2,
            weather: "mild",
            skipped: false,
        });
        expect(entry.applied.dayId).toBe(plan.days[0].id);
        expect(entry.applied.slot).toBe("primary");
        expect(entry.applied.afterDose).toBeLessThanOrEqual(
            entry.applied.beforeDose
        );

        expect(onJourneyChange).toHaveBeenCalled();
        const [nextJourney] = onJourneyChange.mock.calls[0];

        expect(nextJourney.plan.days[0].primary.dose).toBe(
            entry.applied.afterDose
        );
        expect(nextJourney.plan.days[0].primary.readiness).toMatchObject(
            {
                energy: "good",
                headspace: "light",
                time: 2,
                weather: "mild",
            }
        );
    });

    it("lets an answer be changed before applying", async () => {
        const tester = userEvent.setup();

        renderWorld(makePlan(), {}, {}, { seedArrival: false });

        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );

        await tester.click(
            screen.getAllByRole("button", { name: "Change" })[1]
        );

        expect(
            screen.getByRole("group", {
                name: "How much time do you have?",
            })
        ).toBeInTheDocument();

        await tester.click(
            screen.getByRole("button", { name: "Not today" })
        );
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );

        expect(screen.getByText("5 min")).toBeInTheDocument();

        await tester.click(
            screen.getByRole("button", { name: "Use this for today" })
        );

        expect(getArrivalEntry(user.user_id)).toMatchObject({
            mood: "calm",
            time: 5,
            weather: "mild",
        });
    });

    it("keeps the usual step when the deck is skipped", async () => {
        const tester = userEvent.setup();
        const { onJourneyChange } = renderWorld(
            makePlan(),
            {},
            {},
            { seedArrival: false }
        );

        await tester.click(
            screen.getByRole("button", { name: "Keep my usual step" })
        );

        expect(
            screen.queryByRole("dialog")
        ).not.toBeInTheDocument();
        expect(getArrivalEntry(user.user_id)).toMatchObject({
            skipped: true,
            mood: null,
        });
        expect(onJourneyChange).not.toHaveBeenCalled();
        expect(screen.getByText("Daily check-in")).toBeInTheDocument();
    });

    it("does not reopen after skipping, and can be reopened from the card", async () => {
        const tester = userEvent.setup();

        renderWorld(makePlan(), {}, {}, { seedArrival: false });
        await tester.click(
            screen.getByRole("button", { name: "Keep my usual step" })
        );

        cleanup();
        renderWorld(makePlan(), {}, {}, { seedArrival: false });

        expect(
            screen.queryByRole("dialog")
        ).not.toBeInTheDocument();

        await tester.click(
            screen.getByRole("button", { name: "Open mood deck" })
        );

        expect(
            screen.getByRole("heading", {
                name: "How are you arriving today?",
            })
        ).toBeInTheDocument();
    });

    it("shows the saved mood immediately on the next visit", async () => {
        const tester = userEvent.setup();

        renderWorld(makePlan(), {}, {}, { seedArrival: false });

        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "This is me" })
        );
        await tester.click(
            screen.getByRole("button", { name: "Use this for today" })
        );

        cleanup();
        renderWorld(makePlan());

        expect(
            screen.getByText("Today feels Calm.")
        ).toBeInTheDocument();
        expect(
            screen.queryByText("Daily check-in")
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Change" })
        ).toBeInTheDocument();
    });
});
