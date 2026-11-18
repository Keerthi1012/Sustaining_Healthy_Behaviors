const PROGRESSION_FLAG = "VITE_USE_BACKEND_PROGRESSION";
const JOURNEY_FLAG = "VITE_USE_BACKEND_JOURNEY";

export function isBackendProgressionEnabled() {
    return import.meta.env?.[PROGRESSION_FLAG] === "true";
}

export function isBackendJourneyEnabled() {
    return import.meta.env?.[JOURNEY_FLAG] === "true";
}

export const USE_BACKEND_PROGRESSION = isBackendProgressionEnabled();
export const USE_BACKEND_JOURNEY = isBackendJourneyEnabled();
