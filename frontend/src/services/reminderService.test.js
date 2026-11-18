import { afterEach, describe, expect, it, vi } from "vitest";

import {
    DEFAULT_REMINDER_PREFERENCES,
    REMINDER_CADENCES,
    REMINDER_CHANNELS,
    clearReminderState,
    getCadenceMinutes,
    getNotificationSupport,
    getReminderDecision,
    getReminderStorageKey,
    isWithinQuietHours,
    loadReminderState,
    normalizeReminderPreferences,
    requestNotificationPermission,
    saveReminderState,
    sendBrowserNotification,
} from "./reminderService";

function makeNotificationGlobal(permission = "granted") {
    const calls = [];

    function FakeNotification(title, options) {
        calls.push({ title, options });
    }

    FakeNotification.permission = permission;
    FakeNotification.requestPermission = vi.fn(
        async () => permission
    );

    return { globalObject: { Notification: FakeNotification }, calls };
}

describe("reminder preferences", () => {
    it("falls back to safe defaults", () => {
        expect(normalizeReminderPreferences(undefined)).toEqual(
            DEFAULT_REMINDER_PREFERENCES
        );
        expect(
            normalizeReminderPreferences({
                enabled: "yes",
                cadence: "hourly",
                channel: "sms",
                quietHours: { start: "99:99", end: "later" },
            })
        ).toEqual({
            enabled: false,
            cadence: REMINDER_CADENCES.DAILY,
            channel: REMINDER_CHANNELS.IN_APP,
            quietHours: DEFAULT_REMINDER_PREFERENCES.quietHours,
        });
    });

    it("keeps valid values", () => {
        expect(
            normalizeReminderPreferences({
                enabled: true,
                cadence: REMINDER_CADENCES.TWICE_DAILY,
                channel: REMINDER_CHANNELS.BROWSER,
                quietHours: { start: "22:30", end: "06:15" },
            })
        ).toEqual({
            enabled: true,
            cadence: REMINDER_CADENCES.TWICE_DAILY,
            channel: REMINDER_CHANNELS.BROWSER,
            quietHours: { start: "22:30", end: "06:15" },
        });
    });

    it("maps cadence to minutes", () => {
        expect(getCadenceMinutes(REMINDER_CADENCES.DAILY)).toBe(1440);
        expect(getCadenceMinutes(REMINDER_CADENCES.TWICE_DAILY)).toBe(
            720
        );
    });
});

describe("quiet hours", () => {
    it("handles a window that wraps midnight", () => {
        const quiet = { start: "21:00", end: "08:00" };

        expect(
            isWithinQuietHours(new Date(2026, 0, 10, 23, 0), quiet)
        ).toBe(true);
        expect(
            isWithinQuietHours(new Date(2026, 0, 10, 7, 30), quiet)
        ).toBe(true);
        expect(
            isWithinQuietHours(new Date(2026, 0, 10, 12, 0), quiet)
        ).toBe(false);
    });

    it("handles a daytime window", () => {
        const quiet = { start: "12:00", end: "14:00" };

        expect(
            isWithinQuietHours(new Date(2026, 0, 10, 13, 0), quiet)
        ).toBe(true);
        expect(
            isWithinQuietHours(new Date(2026, 0, 10, 15, 0), quiet)
        ).toBe(false);
    });

    it("treats equal start and end as no quiet window", () => {
        expect(
            isWithinQuietHours(new Date(2026, 0, 10, 9, 0), {
                start: "09:00",
                end: "09:00",
            })
        ).toBe(false);
    });
});

describe("reminder decision", () => {
    const enabledDaily = {
        enabled: true,
        cadence: REMINDER_CADENCES.DAILY,
        channel: REMINDER_CHANNELS.IN_APP,
        quietHours: { start: "21:00", end: "08:00" },
    };
    const noon = new Date(2026, 0, 10, 12, 0);

    it("does nothing when reminders are off", () => {
        expect(
            getReminderDecision({
                preferences: { ...enabledDaily, enabled: false },
                state: "slipping",
                now: noon,
            })
        ).toEqual({ shouldShow: false, channel: "none" });
    });

    it("does nothing when the user is on-track or paused", () => {
        for (const state of ["on-track", "paused"]) {
            expect(
                getReminderDecision({
                    preferences: enabledDaily,
                    state,
                    now: noon,
                })
            ).toEqual({ shouldShow: false, channel: "none" });
        }
    });

    it("uses in-app delivery by default", () => {
        expect(
            getReminderDecision({
                preferences: enabledDaily,
                state: "slipping",
                now: noon,
            })
        ).toEqual({
            shouldShow: true,
            channel: REMINDER_CHANNELS.IN_APP,
        });
    });

    it("uses browser delivery when granted", () => {
        expect(
            getReminderDecision({
                preferences: {
                    ...enabledDaily,
                    channel: REMINDER_CHANNELS.BROWSER,
                },
                state: "lapsed",
                now: noon,
                permission: "granted",
                supported: true,
            })
        ).toEqual({
            shouldShow: true,
            channel: REMINDER_CHANNELS.BROWSER,
        });
    });

    it("falls back in-app when browser permission is missing", () => {
        expect(
            getReminderDecision({
                preferences: {
                    ...enabledDaily,
                    channel: REMINDER_CHANNELS.BROWSER,
                },
                state: "lapsed",
                now: noon,
                permission: "default",
                supported: true,
            })
        ).toEqual({
            shouldShow: true,
            channel: REMINDER_CHANNELS.IN_APP,
        });
    });

    it("respects quiet hours", () => {
        expect(
            getReminderDecision({
                preferences: enabledDaily,
                state: "slipping",
                now: new Date(2026, 0, 10, 22, 0),
            })
        ).toEqual({ shouldShow: false, channel: "none" });
    });

    it("respects cadence", () => {
        expect(
            getReminderDecision({
                preferences: enabledDaily,
                state: "slipping",
                now: noon,
                lastSentAt: new Date(
                    noon.getTime() - 60 * 60 * 1000
                ).toISOString(),
            })
        ).toEqual({ shouldShow: false, channel: "none" });

        expect(
            getReminderDecision({
                preferences: enabledDaily,
                state: "slipping",
                now: noon,
                lastSentAt: new Date(
                    noon.getTime() - 25 * 60 * 60 * 1000
                ).toISOString(),
            })
        ).toEqual({
            shouldShow: true,
            channel: REMINDER_CHANNELS.IN_APP,
        });
    });
});

describe("local reminder timestamps", () => {
    afterEach(() => {
        window.localStorage.clear();
    });

    it("stores timestamps outside the journey", () => {
        expect(getReminderStorageKey("user-a")).toBe(
            "sproutly.reminders.v1.user-a"
        );
        expect(loadReminderState("user-a")).toEqual({
            lastSentAt: null,
        });

        const lastSentAt = "2026-01-10T12:00:00.000Z";
        expect(saveReminderState("user-a", { lastSentAt })).toBe(true);
        expect(loadReminderState("user-a")).toEqual({ lastSentAt });

        expect(clearReminderState("user-a")).toBe(true);
        expect(loadReminderState("user-a")).toEqual({
            lastSentAt: null,
        });
    });
});

describe("browser notifications", () => {
    it("detects unsupported environments", () => {
        expect(getNotificationSupport({})).toEqual({
            supported: false,
            permission: "unsupported",
        });
    });

    it("requests permission when supported", async () => {
        const { globalObject } = makeNotificationGlobal("granted");

        await expect(
            requestNotificationPermission(globalObject)
        ).resolves.toBe("granted");
    });

    it("sends a notification only when granted", () => {
        const granted = makeNotificationGlobal("granted");
        const denied = makeNotificationGlobal("denied");

        expect(
            sendBrowserNotification({
                title: "Gentle reminder",
                body: "One small step is waiting.",
                globalObject: granted.globalObject,
            })
        ).toBe(true);
        expect(granted.calls).toHaveLength(1);
        expect(granted.calls[0].title).toBe("Gentle reminder");

        expect(
            sendBrowserNotification({
                title: "Gentle reminder",
                body: "One small step is waiting.",
                globalObject: denied.globalObject,
            })
        ).toBe(false);
        expect(denied.calls).toHaveLength(0);
    });
});
