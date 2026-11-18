import { describe, expect, it, vi } from "vitest";
import { createWalkingActivity, getUserActivities } from "./activityApi";
import { saveSession } from "./authStore";

function jsonResponse(data, ok = true) {
    return {
        ok,
        headers: { get: () => "application/json" },
        json: async () => data,
    };
}

describe("activityApi", () => {
    it("loads activities for the demo user", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue(jsonResponse([{ id: "activity-1" }]));
        vi.stubGlobal("fetch", fetchMock);

        const result = await getUserActivities();

        expect(result).toEqual([{ id: "activity-1" }]);
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/users/user_001/activities",
            expect.objectContaining({
                headers: expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            })
        );
    });

    it("creates a walking activity with the expected payload", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            jsonResponse({ id: "activity-1", duration_minutes: 5 })
        );
        vi.stubGlobal("fetch", fetchMock);

        const startedAt = "2026-01-05T08:00:00.000Z";
        const result = await createWalkingActivity({
            durationMinutes: 5,
            startedAt,
        });

        expect(result.id).toBe("activity-1");

        const [, options] = fetchMock.mock.calls[0];
        expect(options.method).toBe("POST");
        expect(JSON.parse(options.body)).toEqual({
            user_id: "user_001",
            activity_type: "walking",
            source: "manual",
            started_at: startedAt,
            duration_minutes: 5,
            intensity: "unknown",
        });
    });

    it("uses the signed-in account and bearer token when available", async () => {
        saveSession({
            token: "alice-token",
            user: {
                user_id: "user-alice",
                username: "alice",
                display_name: "Alice",
            },
        });
        const fetchMock = vi
            .fn()
            .mockResolvedValue(jsonResponse([{ id: "activity-1" }]));
        vi.stubGlobal("fetch", fetchMock);

        await getUserActivities();

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/users/user-alice/activities",
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer alice-token",
                }),
            })
        );
    });

    it("surfaces backend error details", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                jsonResponse({ detail: "Activity could not be saved." }, false)
            )
        );

        await expect(getUserActivities()).rejects.toThrow(
            "Activity could not be saved."
        );
    });
});
