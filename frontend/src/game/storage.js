import {
    LEGACY_VILLAGE_STORAGE_PREFIX,
    RESOURCE_KEYS,
    VILLAGE_STORAGE_PREFIX,
    VILLAGE_VERSION,
} from "./data";

export function getVillageStorageKey(planId = "journey") {
    return `${VILLAGE_STORAGE_PREFIX}.${encodeURIComponent(planId)}`;
}

export function getLegacyVillageStorageKey(planId = "journey") {
    return `${LEGACY_VILLAGE_STORAGE_PREFIX}.${encodeURIComponent(planId)}`;
}

function sanitizeLog(value) {
    if (!Array.isArray(value)) return [];

    return value
        .filter(
            (entry) =>
                entry &&
                typeof entry.id === "string" &&
                typeof entry.text === "string"
        )
        .slice(0, 8)
        .map((entry) => ({
            id: entry.id,
            kind: typeof entry.kind === "string" ? entry.kind : "gather",
            text: entry.text,
            at: typeof entry.at === "string" ? entry.at : null,
        }));
}

function sanitizeResources(value) {
    if (!value || typeof value !== "object") return null;

    const resources = {};

    for (const key of RESOURCE_KEYS) {
        const amount = value[key];

        if (!Number.isFinite(amount) || amount < 0) {
            return null;
        }

        resources[key] = Math.floor(amount);
    }

    return resources;
}

function sanitizeReward(reward) {
    if (!reward || typeof reward !== "object") return null;

    const clean = {};

    for (const [resource, amount] of Object.entries(reward)) {
        if (!RESOURCE_KEYS.includes(resource)) continue;
        if (!Number.isFinite(amount) || amount < 0) continue;
        clean[resource] = Math.floor(amount);
    }

    return Object.keys(clean).length ? clean : null;
}

function sanitizeClaimedRewards(value) {
    if (!value || typeof value !== "object") return {};

    const claimed = {};

    for (const [key, record] of Object.entries(value)) {
        if (!record || typeof record !== "object") continue;

        const reward = sanitizeReward(record.reward);

        if (!reward) continue;

        claimed[key] = {
            dayId: typeof record.dayId === "string" ? record.dayId : null,
            slot: typeof record.slot === "string" ? record.slot : null,
            domain: typeof record.domain === "string" ? record.domain : null,
            reward,
            claimedAt:
                typeof record.claimedAt === "string"
                    ? record.claimedAt
                    : new Date().toISOString(),
        };
    }

    return claimed;
}

function migrateFromV1(value, planId) {
    const resources = sanitizeResources(value.resources);

    if (!resources) return null;

    const at = new Date().toISOString();

    return {
        version: VILLAGE_VERSION,
        planId,
        resources,
        claimedRewards: {},
        log: [
            {
                id: "village-migrated",
                kind: "day",
                text: "Your village grew into a new chapter. Everything gathered is still here.",
                at,
            },
            ...sanitizeLog(value.log),
        ].slice(0, 8),
        createdAt: typeof value.createdAt === "string" ? value.createdAt : at,
        updatedAt: at,
    };
}

export function sanitizeVillage(value, planId = "journey") {
    if (!value || value.planId !== planId) {
        return null;
    }

    if (value.version === 1) {
        return migrateFromV1(value, planId);
    }

    if (value.version !== VILLAGE_VERSION) {
        return null;
    }

    const resources = sanitizeResources(value.resources);

    if (!resources) return null;

    return {
        version: VILLAGE_VERSION,
        planId,
        resources,
        claimedRewards: sanitizeClaimedRewards(value.claimedRewards),
        log: sanitizeLog(value.log),
        createdAt:
            typeof value.createdAt === "string"
                ? value.createdAt
                : new Date().toISOString(),
        updatedAt:
            typeof value.updatedAt === "string"
                ? value.updatedAt
                : new Date().toISOString(),
    };
}

function readVillage(key, planId) {
    const raw = window.localStorage.getItem(key);

    if (!raw) return null;

    return sanitizeVillage(JSON.parse(raw), planId);
}

export function loadVillage(planId = "journey") {
    try {
        const current = readVillage(getVillageStorageKey(planId), planId);

        if (current) return current;

        const migrated = readVillage(
            getLegacyVillageStorageKey(planId),
            planId
        );

        if (migrated) {
            saveVillage(planId, migrated);
            return migrated;
        }

        return null;
    } catch {
        return null;
    }
}

export function saveVillage(planId, state) {
    try {
        window.localStorage.setItem(
            getVillageStorageKey(planId),
            JSON.stringify({
                ...state,
                version: VILLAGE_VERSION,
                planId,
            })
        );
    } catch {
        return false;
    }

    return true;
}
