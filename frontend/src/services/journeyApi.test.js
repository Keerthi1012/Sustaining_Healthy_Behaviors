import { afterEach, describe, expect, it, vi } from "vitest";

import {
    completeCurrentJourney,
    getBackendDemoMode,
} from "./journeyApi";

function jsonResponse(data) {
    return {
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => data,
    };
}

const completionArgs = {
    token: "test-token",
    dayId: "day-1",
    slot: "primary",
    feedback: {
        difficulty: "easy",
        barrier: null,
        safety: "none",
    },
    expectedRevision: 1,
    idempotencyKey: "demo-completion-key",
};

describe("journeyApi", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends simulated_at when a demo date is selected", async () => {
        const fetchMock = vi.fn(async () =>
            jsonResponse({ journey: {}, revision: 2 })
        );
        vi.stubGlobal("fetch", fetchMock);

        await completeCurrentJourney({
            ...completionArgs,
            simulatedAt: "2026-11-20T12:00:00.000Z",
        });

        const [, options] = fetchMock.mock.calls[0];
        const body = JSON.parse(options.body);

        expect(body.simulated_at).toBe(
            "2026-11-20T12:00:00.000Z"
        );
        expect(options.headers["Idempotency-Key"]).toBe(
            "demo-completion-key"
        );
    });

    it("omits simulated_at for normal completions", async () => {
        const fetchMock = vi.fn(async () =>
            jsonResponse({ journey: {}, revision: 2 })
        );
        vi.stubGlobal("fetch", fetchMock);

        await completeCurrentJourney(completionArgs);

        const [, options] = fetchMock.mock.calls[0];
        const body = JSON.parse(options.body);

        expect(body).not.toHaveProperty("simulated_at");
    });

    it("reads the backend demo mode flag from health", async () => {
        const fetchMock = vi.fn(async () =>
            jsonResponse({
                status: "healthy",
                demo_mode: true,
            })
        );
        vi.stubGlobal("fetch", fetchMock);

        expect(await getBackendDemoMode()).toBe(true);
        expect(fetchMock.mock.calls[0][0]).toContain("/api/health");
    });
});
