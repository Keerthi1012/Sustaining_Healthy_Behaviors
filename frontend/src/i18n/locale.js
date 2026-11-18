export const LOCALE_STORAGE_KEY = "sproutly.locale.v1";
export const SUPPORTED_LOCALES = ["en", "ar"];

export const LOCALE_OPTIONS = [
    { id: "en", labelKey: "language.english", dir: "ltr" },
    { id: "ar", labelKey: "language.arabic", dir: "rtl" },
];

export function getLocaleDirection(locale) {
    return locale === "ar" ? "rtl" : "ltr";
}

export function readStoredLocale() {
    try {
        const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
        return SUPPORTED_LOCALES.includes(stored) ? stored : "en";
    } catch {
        return "en";
    }
}
