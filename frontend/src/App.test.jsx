import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { buildPlan } from "./services/planEngine";
import {
    getJourneyStorageKey,
    saveJourney,
} from "./services/planStore";
import { saveSession } from "./services/authStore";

const session = {
    token: "test-token",
    user: {
        user_id: "user-alice",
        username: "alice",
        display_name: "Alice",
    },
};

function jsonResponse(data, ok = true) {
    return {
        ok,
        status: ok ? 200 : 400,
        headers: { get: () => "application/json" },
        json: async () => data,
    };
}

function makeFetchMock({ activities = [] } = {}) {
    return vi.fn(async (url, options = {}) => {
        if (url === "/api/auth/me") {
            return jsonResponse(session.user);
        }

        if (url === "/api/auth/logout") {
            return jsonResponse(null);
        }

        if (
            options.method === "POST" &&
            url === "/api/activities"
        ) {
            return jsonResponse({
                observation_id: "activity-1",
                duration_minutes: 5,
                started_at: new Date().toISOString(),
            });
        }

        if (url === `/api/users/${session.user.user_id}/activities`) {
            return jsonResponse(activities);
        }

        return jsonResponse([]);
    });
}

function signInForTest() {
    saveSession(session);
}

describe("App journey", () => {
    it("logs in, completes onboarding, and keeps a per-user movement plan", async () => {
        const fetchMock = vi.fn(async (url, options = {}) => {
            if (url === "/api/auth/login") {
                return jsonResponse(session);
            }

            if (
                options.method === "POST" &&
                url === "/api/activities"
            ) {
                return jsonResponse({
                    observation_id: "activity-1",
                    duration_minutes: 5,
                    started_at: new Date().toISOString(),
                });
            }

            return jsonResponse([]);
        });
        vi.stubGlobal("fetch", fetchMock);

        const user = userEvent.setup();
        render(<App />);

        expect(
            screen.getByRole("heading", { name: /Return to your gentle world/i })
        ).toBeInTheDocument();

        await user.type(screen.getByLabelText("Username"), "alice");
        await user.type(screen.getByLabelText("Password"), "gentle-steps");
        await user.click(
            screen.getByRole("button", { name: /Sign in to Sproutly/i })
        );

        expect(
            await screen.findByRole("heading", {
                name: /Grow a little every day/i,
            })
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: /Begin gently/i })
        );
        await user.click(screen.getByRole("button", { name: /Move More/i }));

        expect(
            screen.getByRole("heading", { name: /starting pace/i })
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("radio", { name: /A little active/i })
        );
        await user.click(
            screen.getAllByRole("radio", { name: /10 minutes/i })[0]
        );
        await user.click(screen.getByRole("radio", { name: /Low energy/i }));

        const submit = screen.getByRole("button", {
            name: /Build my starting plan/i,
        });
        expect(submit).toBeEnabled();
        await user.click(submit);

        await screen.findAllByText("Valley of Vitality");
        expect(screen.getByText("Daily quest")).toBeInTheDocument();
        expect(screen.getByText("In progress")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /I did it/i })
        ).toBeInTheDocument();

        const stored = JSON.parse(
            window.localStorage.getItem(
                getJourneyStorageKey(session.user.user_id)
            )
        );
        expect(stored.plan.days).toHaveLength(28);
        expect(stored.profile.primaryGoalId).toBe("movement");
        expect(stored.version).toBe(2);

        await user.click(screen.getByRole("button", { name: /I did it/i }));

        expect(
            screen.getByRole("heading", { name: /How did that feel/i })
        ).toBeInTheDocument();

        await user.click(screen.getByRole("radio", { name: /Too much/i }));
        await user.click(
            screen.getByRole("button", { name: /Save this step/i })
        );

        await screen.findByText(/Kept today. That is enough./i);
        expect(screen.getByText(/Day 1 complete\./i)).toBeInTheDocument();
        expect(screen.getByText("DAY 2 OF 28")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: /One gentle quest/i })
        ).toBeInTheDocument();
        expect(screen.getByText("In progress")).toBeInTheDocument();
        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                "/api/activities",
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        Authorization: "Bearer test-token",
                    }),
                })
            );
        });
    });

    it("discards an incompatible legacy journey after sign-in", async () => {
        signInForTest();
        vi.stubGlobal("fetch", makeFetchMock());
        window.localStorage.setItem(
            "sproutly.journey.v1",
            JSON.stringify({
                profile: { primaryGoalId: "movement" },
                plan: { id: "legacy-plan", days: [] },
            })
        );

        render(<App />);

        expect(
            await screen.findByRole("heading", {
                name: /Grow a little every day/i,
            })
        ).toBeInTheDocument();
        expect(window.localStorage.getItem("sproutly.journey.v1")).toBeNull();
    });

    it("opens the village from home and returns without losing the journey", async () => {
        signInForTest();
        vi.stubGlobal("fetch", makeFetchMock());

        const plan = buildPlan({
            primaryGoalId: "movement",
            answers: {
                time: "10 minutes",
                barrier: "Not enough time",
            },
        });
        saveJourney(session.user.user_id, {
            profile: {
                primaryGoalId: "movement",
                answers: {
                    time: "10 minutes",
                    barrier: "Not enough time",
                },
            },
            plan,
            preferences: {
                showReturnCard: false,
                quietWorld: true,
            },
        });

        const user = userEvent.setup();
        render(<App />);

        await screen.findAllByText("Valley of Vitality");

        await user.click(
            screen.getByRole("button", { name: /Open your world/i })
        );

        expect(
            screen.getByRole("heading", {
                level: 1,
                name: /Your world/i,
            })
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: /Back to today/i })
        );

        await screen.findAllByText("Valley of Vitality");
        expect(
            JSON.parse(
                window.localStorage.getItem(
                    getJourneyStorageKey(session.user.user_id)
                )
            ).plan.id
        ).toBe(plan.id);
    });

    it("keeps back controls available through onboarding", async () => {
        signInForTest();
        vi.stubGlobal("fetch", makeFetchMock());

        const user = userEvent.setup();
        render(<App />);

        await screen.findByRole("heading", {
            name: /Grow a little every day/i,
        });

        await user.click(
            screen.getByRole("button", { name: /Begin gently/i })
        );
        expect(
            screen.getByRole("heading", { name: /Where would you like to begin/i })
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Back/i }));
        expect(
            screen.getByRole("heading", { name: /Grow a little every day/i })
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: /Begin gently/i })
        );
        await user.click(screen.getByRole("button", { name: /Move More/i }));
        expect(
            screen.getByRole("button", { name: /Back to focus/i })
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: /Back to focus/i })
        );
        expect(
            screen.getByRole("heading", { name: /Where would you like to begin/i })
        ).toBeInTheDocument();
    });

    it("logs out from the account menu", async () => {
        signInForTest();
        const fetchMock = makeFetchMock();
        vi.stubGlobal("fetch", fetchMock);

        const plan = buildPlan({
            primaryGoalId: "movement",
            answers: {
                time: "10 minutes",
                barrier: "Not enough time",
            },
        });
        saveJourney(session.user.user_id, {
            profile: {
                primaryGoalId: "movement",
                answers: {
                    time: "10 minutes",
                    barrier: "Not enough time",
                },
            },
            plan,
            preferences: {
                showReturnCard: false,
                quietWorld: true,
            },
        });

        const user = userEvent.setup();
        render(<App />);

        await screen.findAllByText("Valley of Vitality");

        await user.click(
            screen.getByRole("button", {
                name: /Account menu for Alice/i,
            })
        );
        await user.click(screen.getByRole("menuitem", { name: /Log out/i }));

        expect(
            await screen.findByRole("heading", {
                name: /Return to your gentle world/i,
            })
        ).toBeInTheDocument();
        expect(window.localStorage.getItem("sproutly.auth.v1")).toBeNull();
        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                "/api/auth/logout",
                expect.objectContaining({ method: "POST" })
            );
        });
    });
});

describe("backend journey bootstrap", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("uploads a local journey and opens it from the server", async () => {
        vi.stubEnv("VITE_USE_BACKEND_JOURNEY", "true");
        signInForTest();

        const plan = buildPlan({
            primaryGoalId: "movement",
            answers: {
                time: "10 minutes",
                barrier: "Not enough time",
            },
        });
        const journey = {
            version: 2,
            profile: {
                primaryGoalId: "movement",
                goalIds: ["movement"],
                answers: {
                    time: "10 minutes",
                    barrier: "Not enough time",
                },
            },
            plan,
            preferences: {
                showReturnCard: false,
                quietWorld: true,
            },
        };
        saveJourney(session.user.user_id, journey);

        const fetchMock = vi.fn(async (url, options = {}) => {
            if (url === "/api/auth/me") {
                return jsonResponse(session.user);
            }

            if (url === "/api/journeys/current") {
                if (options.method === "PUT") {
                    return jsonResponse({
                        journey: JSON.parse(options.body).journey,
                        revision: 1,
                    });
                }

                return {
                    ok: false,
                    status: 404,
                    headers: { get: () => "application/json" },
                    json: async () => ({
                        detail: "No journey has been saved yet.",
                    }),
                };
            }

            if (url === `/api/users/${session.user.user_id}/activities`) {
                return jsonResponse([]);
            }

            return jsonResponse([]);
        });
        vi.stubGlobal("fetch", fetchMock);

        render(<App />);

        await screen.findAllByText("Valley of Vitality");

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/journeys/current",
            expect.objectContaining({ method: "PUT" })
        );
        expect(
            window.localStorage.getItem(
                `sproutly.journey-sync.v1.${session.user.user_id}`
            )
        ).toContain('"revision":1');
    });
});
