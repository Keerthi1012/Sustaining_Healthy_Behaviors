import { request } from "./apiClient";
import { normalizeDifficulty } from "./progression";

export async function getCurrentJourney(token) {
    try {
        return await request("/api/journeys/current", { token });
    } catch (error) {
        if (error?.status === 404) {
            return null;
        }

        throw error;
    }
}

export async function putCurrentJourney(
    token,
    journey,
    expectedRevision
) {
    return request("/api/journeys/current", {
        method: "PUT",
        token,
        body: JSON.stringify({
            journey,
            expected_revision: expectedRevision,
        }),
    });
}

export async function deleteCurrentJourney(token) {
    return request("/api/journeys/current", {
        method: "DELETE",
        token,
    });
}

export async function completeCurrentJourney({
    token,
    dayId,
    slot,
    feedback,
    expectedRevision,
    idempotencyKey,
    simulatedAt,
}) {
    return request("/api/journeys/current/completions", {
        method: "POST",
        token,
        headers: {
            "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
            day_id: dayId,
            slot,
            expected_revision: expectedRevision,
            feedback: {
                difficulty: normalizeDifficulty(
                    feedback?.difficulty
                ),
                barrier: feedback?.barrier ?? null,
                safety: feedback?.safety ?? "none",
            },
            ...(simulatedAt
                ? { simulated_at: simulatedAt }
                : {}),
        }),
    });
}

export async function getBackendDemoMode() {
    const health = await request("/api/health");
    return health?.demo_mode === true;
}
