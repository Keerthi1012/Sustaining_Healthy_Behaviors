import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { I18nProvider } from "./I18nProvider";
import { useI18n } from "./context";
import { LOCALE_STORAGE_KEY } from "./locale";
import en from "./messages/en";
import ar from "./messages/ar";

function Probe() {
    const { t, locale, dir, setLocale } = useI18n();

    return (
        <div>
            <span data-testid="locale">{locale}</span>
            <span data-testid="dir">{dir}</span>
            <span data-testid="welcome">{t("welcome.begin")}</span>
            <button type="button" onClick={() => setLocale("ar")}>
                switch
            </button>
            <button type="button" onClick={() => setLocale("fr")}>
                unsupported
            </button>
        </div>
    );
}

describe("I18nProvider", () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.lang = "";
        document.documentElement.dir = "";
    });

    afterEach(() => {
        cleanup();
    });

    it("defaults to English with a left-to-right direction", () => {
        render(
            <I18nProvider>
                <Probe />
            </I18nProvider>
        );

        expect(screen.getByTestId("locale")).toHaveTextContent("en");
        expect(screen.getByTestId("dir")).toHaveTextContent("ltr");
        expect(document.documentElement.lang).toBe("en");
    });

    it("switches to Arabic, applies RTL, and persists the choice", async () => {
        const tester = userEvent.setup();

        render(
            <I18nProvider>
                <Probe />
            </I18nProvider>
        );

        await tester.click(screen.getByRole("button", { name: "switch" }));

        expect(screen.getByTestId("locale")).toHaveTextContent("ar");
        expect(screen.getByTestId("dir")).toHaveTextContent("rtl");
        expect(document.documentElement.dir).toBe("rtl");
        expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("ar");
    });

    it("ignores an unsupported locale", async () => {
        const tester = userEvent.setup();

        render(
            <I18nProvider>
                <Probe />
            </I18nProvider>
        );

        await tester.click(
            screen.getByRole("button", { name: "unsupported" })
        );

        expect(screen.getByTestId("locale")).toHaveTextContent("en");
        expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
    });
});

describe("dictionaries", () => {
    it("define the same keys in English and Arabic", () => {
        const enKeys = Object.keys(en).sort();
        const arKeys = Object.keys(ar).sort();

        expect(arKeys).toEqual(enKeys);
    });

    it("have no empty values", () => {
        for (const [key, value] of Object.entries(en)) {
            if (typeof value === "string") {
                expect(value.trim(), `en.${key}`).not.toBe("");
            }
        }

        for (const [key, value] of Object.entries(ar)) {
            if (typeof value === "string") {
                expect(value.trim(), `ar.${key}`).not.toBe("");
            }
        }
    });
});

describe("Phase D dictionary additions", () => {
    const keys = [
        "outcomes.learning.sample",
        "outcomes.learning.steps",
        "outcomes.learning.comfort",
        "outcomes.learning.limit",
        "world.undoRest",
        "readiness.noAdaptationReason",
    ];

    function placeholders(value) {
        return Array.from(String(value).matchAll(/\{(\w+)\}/g))
            .map((match) => match[1])
            .sort();
    }

    it("define symmetric values and interpolation placeholders", () => {
        for (const key of keys) {
            expect(en[key], `en.${key}`).toEqual(expect.any(String));
            expect(ar[key], `ar.${key}`).toEqual(expect.any(String));
            expect(placeholders(ar[key]), key).toEqual(placeholders(en[key]));
        }

        expect(placeholders(en["outcomes.learning.limit"])).toEqual(["count"]);
        expect(placeholders(ar["outcomes.learning.limit"])).toEqual(["count"]);
    });
});
