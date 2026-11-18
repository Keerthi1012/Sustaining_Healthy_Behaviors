import { request } from "./apiClient";
import { loadSession } from "./authStore";

export const DEMO_USER_ID = "user_001";

function resolveIdentity(userId, token) {
    const session = loadSession();

    return {
        userId: userId ?? session?.user?.user_id ?? DEMO_USER_ID,
        token: token ?? session?.token,
    };
}

export async function getUserActivities(userId, token) {
    const identity = resolveIdentity(userId, token);

    return request(
        `/api/users/${encodeURIComponent(identity.userId)}/activities`,
        { token: identity.token }
    );
}

export async function createWalkingActivity({
    durationMinutes,
    startedAt = new Date().toISOString(),
    userId,
    token,
}) {
    const identity = resolveIdentity(userId, token);

    return request("/api/activities", {
        method: "POST",
        token: identity.token,
        body: JSON.stringify({
            user_id: identity.userId,
            activity_type: "walking",
            source: "manual",
            started_at: startedAt,
            duration_minutes: durationMinutes,
            intensity: "unknown",
        }),
    });
}
