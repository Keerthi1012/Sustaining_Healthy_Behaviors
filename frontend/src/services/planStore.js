const STORAGE_KEY = "sproutly.journey.v1";
export const JOURNEY_VERSION = 2;

export function getJourneyStorageKey(userId) {
    return `${STORAGE_KEY}.${encodeURIComponent(userId)}`;
}

function parseStoredJourney(raw) {
    if (!raw) return null;

    const journey = JSON.parse(raw);
    if (journey?.version !== JOURNEY_VERSION) {
        return null;
    }
    return journey;
}

export function loadJourney(userId) {
    if (!userId) return null;

    try {
        const key = getJourneyStorageKey(userId);
        const journey = parseStoredJourney(
            window.localStorage.getItem(key)
        );

        if (!journey) {
            window.localStorage.removeItem(key);
            return null;
        }

        return journey;
    } catch {
        return null;
    }
}

export function claimLegacyJourney(userId) {
    if (!userId) return null;

    try {
        const userKey = getJourneyStorageKey(userId);
        if (window.localStorage.getItem(userKey)) {
            return null;
        }

        const legacyRaw = window.localStorage.getItem(STORAGE_KEY);
        if (!legacyRaw) return null;

        const journey = parseStoredJourney(legacyRaw);
        if (!journey) {
            window.localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        window.localStorage.setItem(userKey, legacyRaw);
        window.localStorage.removeItem(STORAGE_KEY);
        return journey;
    } catch {
        return null;
    }
}

export function loadOrMigrateJourney(userId) {
    return loadJourney(userId) ?? claimLegacyJourney(userId);
}

export function saveJourney(userId, journey) {
    if (!userId) return false;

    try {
        window.localStorage.setItem(
            getJourneyStorageKey(userId),
            JSON.stringify({ ...journey, version: JOURNEY_VERSION })
        );
    } catch {
        return false;
    }
    return true;
}

export function clearJourney(userId) {
    if (!userId) return false;

    try {
        window.localStorage.removeItem(getJourneyStorageKey(userId));
    } catch {
        return false;
    }
    return true;
}

export function buildJourneyExportPayload(journey, outcomeMetrics = null) {
    const payload = { ...journey, version: JOURNEY_VERSION };

    if (outcomeMetrics) {
        payload.outcomeMetrics = outcomeMetrics;
    }

    return payload;
}

export function exportJourney(journey, options = {}) {
    const blob = new Blob(
        [
            JSON.stringify(
                buildJourneyExportPayload(
                    journey,
                    options.outcomeMetrics
                ),
                null,
                2
            ),
        ],
        {
            type: "application/json",
        }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sproutly-journey-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}
