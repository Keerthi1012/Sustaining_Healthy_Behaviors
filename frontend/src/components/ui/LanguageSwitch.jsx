import { Languages } from "lucide-react";

import { LOCALE_OPTIONS, useI18n } from "../../i18n";
import "./LanguageSwitch.css";

function LanguageSwitch({ className = "" }) {
    const { locale, setLocale, t } = useI18n();

    return (
        <div
            className={`language-switch ${className}`.trim()}
            role="group"
            aria-label={t("language.label")}
        >
            <Languages size={15} aria-hidden="true" />
            {LOCALE_OPTIONS.map((option) => (
                <button
                    className={`language-switch__option ${
                        locale === option.id
                            ? "language-switch__option--active"
                            : ""
                    }`}
                    key={option.id}
                    type="button"
                    aria-pressed={locale === option.id}
                    lang={option.id}
                    onClick={() => setLocale(option.id)}
                >
                    {option.id === "ar" ? "العربية" : "English"}
                </button>
            ))}
        </div>
    );
}

export default LanguageSwitch;
