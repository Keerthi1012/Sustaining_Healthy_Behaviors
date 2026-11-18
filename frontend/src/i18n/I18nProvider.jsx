import { useCallback, useEffect, useMemo, useState } from "react";

import en from "./messages/en";
import ar from "./messages/ar";
import { I18nContext, interpolate, resolvePlural } from "./context";
import {
    LOCALE_STORAGE_KEY,
    SUPPORTED_LOCALES,
    getLocaleDirection,
    readStoredLocale,
} from "./locale";

const DICTIONARIES = { en, ar };

export function I18nProvider({ children, initialLocale }) {
    const [locale, setLocaleState] = useState(
        () => initialLocale ?? readStoredLocale()
    );

    const dir = getLocaleDirection(locale);

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = dir;
    }, [locale, dir]);

    const setLocale = useCallback((nextLocale) => {
        if (!SUPPORTED_LOCALES.includes(nextLocale)) return;

        setLocaleState(nextLocale);

        try {
            window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
        } catch {
            // Locale still applies for this session.
        }
    }, []);

    const t = useCallback(
        (key, values = {}) => {
            const dictionary = DICTIONARIES[locale] ?? en;
            const fallback = en[key] ?? key;
            const template = resolvePlural(
                dictionary[key] ?? fallback,
                values.count,
                locale
            );

            return interpolate(template, values);
        },
        [locale]
    );

    const value = useMemo(
        () => ({ locale, dir, t, setLocale, isRtl: dir === "rtl" }),
        [locale, dir, t, setLocale]
    );

    return (
        <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    );
}
