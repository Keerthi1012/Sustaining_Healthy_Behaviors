import { describe, expect, it } from "vitest";
import { clearSession, loadSession, saveSession } from "./authStore";

const session = {
    token: "demo-token",
    user: {
        user_id: "user-1",
        username: "alice",
        display_name: "Alice",
    },
};

describe("authStore", () => {
    it("saves and restores a session", () => {
        expect(saveSession(session)).toBe(true);
        expect(loadSession()).toEqual(session);
    });

    it("rejects a session without a token or user", () => {
        expect(saveSession({ token: "demo-token" })).toBe(false);
        expect(saveSession({ user: session.user })).toBe(false);
    });

    it("clears a stored session", () => {
        saveSession(session);

        expect(clearSession()).toBe(true);
        expect(loadSession()).toBeNull();
    });

    it("removes malformed stored data", () => {
        window.localStorage.setItem("sproutly.auth.v1", "not-json");

        expect(loadSession()).toBeNull();
    });
});
