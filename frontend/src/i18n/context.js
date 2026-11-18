import { createContext, useContext } from "react";

import en from "./messages/en";

export const I18nContext = createContext(null);

export function interpolate(template, values = {}) {
    return String(template).replace(/\{(\w+)\}/g, (match, key) =>
        values[key] === undefined ? match : String(values[key])
    );
}

export function resolvePlural(template, count, locale) {
    if (typeof template !== "object" || template === null) {
        return template;
    }

    if (count === undefined) {
        return template.other ?? template.one ?? Object.values(template)[0];
    }

    const rule = new Intl.PluralRules(locale).select(count);

    return (
        template[rule] ??
        template.other ??
        template.one ??
        Object.values(template)[0]
    );
}

const DEFAULT_CONTEXT = {
    locale: "en",
    dir: "ltr",
    isRtl: false,
    setLocale: () => {},
    t: (key, values = {}) =>
        interpolate(
            resolvePlural(en[key] ?? key, values?.count, "en"),
            values ?? {}
        ),
};

export function useI18n() {
    return useContext(I18nContext) ?? DEFAULT_CONTEXT;
}
