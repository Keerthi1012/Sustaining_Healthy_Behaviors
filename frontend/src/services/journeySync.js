import {
    deleteCurrentJourney,
    getCurrentJourney,
    putCurrentJourney,
} from "./journeyApi";
import { isBackendJourneyEnabled } from "./config";

const SYNC_STORAGE_KEY = "sproutly.journey-sync.v1";
const OUTBOX_STORAGE_KEY = "sproutly.journey-outbox.v1";

function userKey(base, userId) {
    return `${base}.${encodeURIComponent(userId)}`;
}

function readJson(key, fallback) {
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

export function getSyncStorageKey(userId) {
    return userKey(SYNC_STORAGE_KEY, userId);
}

export function loadSyncState(userId) {
    if (!userId) return { revision: 0, dirty: false };

    const state = readJson(getSyncStorageKey(userId), null);
    if (!state || typeof state.revision !== "number") {
        return { revision: 0, dirty: false };
    }

    return {
        revision: state.revision,
        dirty: Boolean(state.dirty),
    };
}

export function saveSyncState(userId, state) {
    if (!userId) return false;

    return writeJson(getSyncStorageKey(userId), {
        revision: Number(state?.revision) || 0,
        dirty: Boolean(state?.dirty),
    });
}

export function clearSyncState(userId) {
    if (!userId) return false;

    try {
        window.localStorage.removeItem(getSyncStorageKey(userId));
        return true;
    } catch {
        return false;
    }
}

export function loadOutbox(userId) {
    if (!userId) return [];

    const commands = readJson(
        userKey(OUTBOX_STORAGE_KEY, userId),
        []
    );

    return Array.isArray(commands) ? commands : [];
}

export function saveOutbox(userId, commands) {
    if (!userId) return false;

    return writeJson(
        userKey(OUTBOX_STORAGE_KEY, userId),
        Array.isArray(commands) ? commands : []
    );
}

export function queuePendingCommand(userId, command) {
    if (!userId || !command?.idempotencyKey) return false;

    const commands = loadOutbox(userId).filter(
        (item) => item.idempotencyKey !== command.idempotencyKey
    );

    if (command.type === "reset") {
        return saveOutbox(userId, [{ ...command }]);
    }

    const reset = commands.find((item) => item.type === "reset");
    if (reset) {
        return saveOutbox(userId, [reset, { ...command }]);
    }

    return saveOutbox(userId, [...commands, { ...command }]);
}

export function removePendingCommand(userId, idempotencyKey) {
    return saveOutbox(
        userId,
        loadOutbox(userId).filter(
            (item) => item.idempotencyKey !== idempotencyKey
        )
    );
}

export function clearOutbox(userId) {
    if (!userId) return false;

    try {
        window.localStorage.removeItem(
            userKey(OUTBOX_STORAGE_KEY, userId)
        );
        return true;
    } catch {
        return false;
    }
}

export function createIdempotencyKey() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `sync-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2)}`;
}

export async function syncJourneyOnLogin({
    token,
    userId,
    localJourney,
}) {
    if (!isBackendJourneyEnabled()) {
        return {
            journey: localJourney,
            revision: 0,
            status: "local",
            enabled: false,
        };
    }

    const sync = loadSyncState(userId);
    const outbox = loadOutbox(userId);
    const reset = outbox.find((item) => item.type === "reset");

    if (reset) {
        try {
            await deleteCurrentJourney(token);
            removePendingCommand(userId, reset.idempotencyKey);
        } catch (error) {
            if (error?.status !== 404) {
                saveSyncState(userId, {
                    revision: sync.revision,
                    dirty: true,
                });

                return {
                    journey: localJourney,
                    revision: sync.revision,
                    status: "offline",
                    enabled: true,
                };
            }
        }
    }

    let remote;
    try {
        remote = await getCurrentJourney(token);
    } catch {
        saveSyncState(userId, {
            revision: sync.revision,
            dirty: Boolean(localJourney),
        });

        return {
            journey: localJourney,
            revision: sync.revision,
            status: "offline",
            enabled: true,
        };
    }

    if (!remote) {
        if (localJourney) {
            try {
                const saved = await putCurrentJourney(
                    token,
                    localJourney,
                    0
                );
                saveSyncState(userId, {
                    revision: saved.revision,
                    dirty: false,
                });
                return {
                    ...saved,
                    status: "migrated",
                    enabled: true,
                };
            } catch {
                saveSyncState(userId, {
                    revision: 0,
                    dirty: true,
                });
                return {
                    journey: localJourney,
                    revision: 0,
                    status: "offline",
                    enabled: true,
                };
            }
        }

        saveSyncState(userId, { revision: 0, dirty: false });
        return {
            journey: null,
            revision: 0,
            status: "empty",
            enabled: true,
        };
    }

    if (sync.dirty && localJourney) {
        try {
            const saved = await putCurrentJourney(
                token,
                localJourney,
                remote.revision
            );
            saveSyncState(userId, {
                revision: saved.revision,
                dirty: false,
            });
            return {
                ...saved,
                status: "uploaded",
                enabled: true,
            };
        } catch (error) {
            if (error?.status !== 409) {
                saveSyncState(userId, {
                    revision: remote.revision,
                    dirty: true,
                });
                return {
                    journey: localJourney,
                    revision: remote.revision,
                    status: "offline",
                    enabled: true,
                };
            }

            try {
                const latest = await getCurrentJourney(token);
                saveSyncState(userId, {
                    revision: latest?.revision ?? 0,
                    dirty: false,
                });
                return {
                    journey: latest?.journey ?? null,
                    revision: latest?.revision ?? 0,
                    status: "conflict",
                    enabled: true,
                };
            } catch {
                return {
                    journey: localJourney,
                    revision: remote.revision,
                    status: "offline",
                    enabled: true,
                };
            }
        }
    }

    saveSyncState(userId, {
        revision: remote.revision,
        dirty: false,
    });
    return {
        ...remote,
        status: "remote",
        enabled: true,
    };
}
