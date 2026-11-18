import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    clearOutbox,
    createIdempotencyKey,
    loadOutbox,
    loadSyncState,
    queuePendingCommand,
    saveSyncState,
    syncJourneyOnLogin,
} from "./journeySync";

const USER_ID = "user-alice";
const TOKEN = "test-token";

function makeJourney(id = "plan-1") {
    return {
        version: 2,
        profile: { primaryGoalId: "movement" },
        plan: { id, days: [] },
        preferences: {},
    };
}

function jsonResponse(data, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: () => "application/json",
        },
        json: async () => data,
    };
}

function emptyResponse(status = 204) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: () => "",
        },
        json: async () => null,
    };
}

describe("journeySync", () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.stubEnv("VITE_USE_BACKEND_JOURNEY", "true");
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        clearOutbox(USER_ID);
    });

    it("uploads a local journey when the server has none", async () => {
        const journey = makeJourney("local-plan");
        const fetchMock = vi.fn(async (url, options = {}) => {
            if (options.method === "PUT") {
                return jsonResponse({
                    journey,
                    revision: 1,
                });
            }

            return jsonResponse(
                { detail: "No journey has been saved yet." },
                404
            );
        });
        vi.stubGlobal("fetch", fetchMock);

        const result = await syncJourneyOnLogin({
            token: TOKEN,
            userId: USER_ID,
            localJourney: journey,
        });

        expect(result.status).toBe("migrated");
        expect(result.revision).toBe(1);
        expect(loadSyncState(USER_ID)).toEqual({
            revision: 1,
            dirty: false,
        });
    });

    it("keeps the server journey when the local cache is clean", async () => {
        const remote = makeJourney("remote-plan");
        vi.stubGlobal(
            "fetch",
            vi.fn(async () =>
                jsonResponse({ journey: remote, revision: 5 })
            )
        );

        const result = await syncJourneyOnLogin({
            token: TOKEN,
            userId: USER_ID,
            localJourney: makeJourney("local-plan"),
        });

        expect(result.status).toBe("remote");
        expect(result.journey.plan.id).toBe("remote-plan");
        expect(result.revision).toBe(5);
    });

    it("uploads a dirty local journey over the server copy", async () => {
        const local = makeJourney("local-plan");
        saveSyncState(USER_ID, { revision: 3, dirty: true });
        const fetchMock = vi.fn(async (url, options = {}) => {
            if (options.method === "PUT") {
                return jsonResponse({
                    journey: local,
                    revision: 4,
                });
            }

            return jsonResponse({
                journey: makeJourney("remote-plan"),
                revision: 3,
            });
        });
        vi.stubGlobal("fetch", fetchMock);

        const result = await syncJourneyOnLogin({
            token: TOKEN,
            userId: USER_ID,
            localJourney: local,
        });

        expect(result.status).toBe("uploaded");
        expect(result.revision).toBe(4);
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/journeys/current",
            expect.objectContaining({ method: "PUT" })
        );
    });

    it("reloads the server journey after a revision conflict", async () => {
        saveSyncState(USER_ID, { revision: 3, dirty: true });
        const latest = makeJourney("latest-plan");
        let getCount = 0;
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url, options = {}) => {
                if (options.method === "PUT") {
                    return jsonResponse(
                        { detail: "The journey was changed elsewhere." },
                        409
                    );
                }

                getCount += 1;
                return jsonResponse({
                    journey:
                        getCount === 1
                            ? makeJourney("remote-plan")
                            : latest,
                    revision: getCount === 1 ? 3 : 4,
                });
            })
        );

        const result = await syncJourneyOnLogin({
            token: TOKEN,
            userId: USER_ID,
            localJourney: makeJourney("local-plan"),
        });

        expect(result.status).toBe("conflict");
        expect(result.revision).toBe(4);
        expect(result.journey.plan.id).toBe("latest-plan");
        expect(loadSyncState(USER_ID)).toEqual({
            revision: 4,
            dirty: false,
        });
    });

    it("keeps the local journey when the server is unreachable", async () => {
        const local = makeJourney("local-plan");
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new TypeError("Failed to fetch");
            })
        );

        const result = await syncJourneyOnLogin({
            token: TOKEN,
            userId: USER_ID,
            localJourney: local,
        });

        expect(result.status).toBe("offline");
        expect(result.journey.plan.id).toBe("local-plan");
        expect(loadSyncState(USER_ID).dirty).toBe(true);
    });

    it("applies a queued reset before fetching the journey", async () => {
        queuePendingCommand(USER_ID, {
            type: "reset",
            idempotencyKey: "reset-123456",
        });
        const fetchMock = vi.fn(async (url, options = {}) => {
            if (options.method === "DELETE") {
                return emptyResponse();
            }

            return jsonResponse(
                { detail: "No journey has been saved yet." },
                404
            );
        });
        vi.stubGlobal("fetch", fetchMock);

        const result = await syncJourneyOnLogin({
            token: TOKEN,
            userId: USER_ID,
            localJourney: null,
        });

        expect(result.status).toBe("empty");
        expect(loadOutbox(USER_ID)).toEqual([]);
        expect(fetchMock.mock.calls[0][1]).toMatchObject({
            method: "DELETE",
        });
    });

    it("queues reset commands ahead of completion commands", () => {
        queuePendingCommand(USER_ID, {
            type: "complete",
            idempotencyKey: "complete-123",
            payload: {},
        });
        queuePendingCommand(USER_ID, {
            type: "reset",
            idempotencyKey: "reset-123456",
        });
        queuePendingCommand(USER_ID, {
            type: "complete",
            idempotencyKey: "complete-456",
            payload: {},
        });

        expect(loadOutbox(USER_ID).map((item) => item.type)).toEqual([
            "reset",
            "complete",
        ]);
    });

    it("creates a usable idempotency key", () => {
        expect(createIdempotencyKey()).toMatch(/.+/);
    });
});
