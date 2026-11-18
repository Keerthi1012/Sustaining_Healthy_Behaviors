import { describe, expect, it } from "vitest";
import { VILLAGE_VERSION } from "./data";
import { createInitialState } from "./engine";
import {
    getLegacyVillageStorageKey,
    getVillageStorageKey,
    loadVillage,
    saveVillage,
} from "./storage";

describe("village storage", () => {
    it("saves and loads a village by plan", () => {
        const state = {
            ...createInitialState("plan-1"),
            resources: { wood: 3, stone: 1, food: 2 },
            claimedRewards: {
                "plan-1:d1:primary": {
                    dayId: "d1",
                    slot: "primary",
                    domain: "movement",
                    reward: { wood: 2 },
                    claimedAt: new Date().toISOString(),
                },
            },
        };

        expect(saveVillage("plan-1", state)).toBe(true);

        const loaded = loadVillage("plan-1");
        expect(loaded).toMatchObject({
            version: VILLAGE_VERSION,
            planId: "plan-1",
            resources: { wood: 3, stone: 1, food: 2 },
        });
        expect(loaded.claimedRewards["plan-1:d1:primary"]).toMatchObject({
            reward: { wood: 2 },
        });
        expect(loaded.log).toHaveLength(state.log.length);
    });

    it("keeps separate villages for separate plans", () => {
        saveVillage("plan-1", createInitialState("plan-1"));
        saveVillage("plan-2", createInitialState("plan-2"));

        expect(loadVillage("plan-1").planId).toBe("plan-1");
        expect(loadVillage("plan-2").planId).toBe("plan-2");
    });

    it("rejects a village from an unknown save version", () => {
        const state = createInitialState("plan-1");
        window.localStorage.setItem(
            getVillageStorageKey("plan-1"),
            JSON.stringify({ ...state, version: 0 })
        );

        expect(loadVillage("plan-1")).toBeNull();
    });

    it("rejects a village with invalid supplies", () => {
        const state = createInitialState("plan-1");
        state.resources.wood = -2;
        window.localStorage.setItem(
            getVillageStorageKey("plan-1"),
            JSON.stringify(state)
        );

        expect(loadVillage("plan-1")).toBeNull();
    });

    it("drops an unreadable reward ledger entry", () => {
        const state = {
            ...createInitialState("plan-1"),
            resources: { wood: 4, stone: 0, food: 0 },
            claimedRewards: {
                good: {
                    dayId: "d1",
                    slot: "primary",
                    reward: { wood: 2 },
                    claimedAt: "2026-01-01T00:00:00.000Z",
                },
                bad: { reward: { mystery: 5 } },
            },
        };
        window.localStorage.setItem(
            getVillageStorageKey("plan-1"),
            JSON.stringify(state)
        );

        const loaded = loadVillage("plan-1");

        expect(loaded.claimedRewards.good).toBeTruthy();
        expect(loaded.claimedRewards.bad).toBeUndefined();
    });

    it("returns null for missing or unreadable saves", () => {
        expect(loadVillage("plan-1")).toBeNull();

        window.localStorage.setItem(
            getVillageStorageKey("plan-1"),
            "{not-json"
        );

        expect(loadVillage("plan-1")).toBeNull();
    });

    it("migrates a first-version village without losing supplies", () => {
        const legacy = {
            version: 1,
            planId: "plan-1",
            day: 2,
            energy: 3,
            maxEnergy: 6,
            resources: { wood: 4, stone: 2, food: 1 },
            log: [
                {
                    id: "day-1-gather-1",
                    kind: "gather",
                    text: "Whisperwood gave 2 wood.",
                },
            ],
        };
        window.localStorage.setItem(
            getLegacyVillageStorageKey("plan-1"),
            JSON.stringify(legacy)
        );

        const loaded = loadVillage("plan-1");

        expect(loaded.version).toBe(VILLAGE_VERSION);
        expect(loaded.resources).toEqual({ wood: 4, stone: 2, food: 1 });
        expect(loaded.claimedRewards).toEqual({});
        expect(loaded.log[0].id).toBe("village-migrated");
    });
});
