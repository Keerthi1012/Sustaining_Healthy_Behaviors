import { useState } from "react";
import Sheet from "../ui/Sheet";
import { getExerciseContent } from "../../content/exercises";
import { useI18n } from "../../i18n";
import { normalizeReadiness } from "../../services/readiness";
import SwipeChoice from "./SwipeChoice";

const energyOptions = [
    {
        value: "low",
        emoji: "😴",
        labelKey: "readiness.energy.low.label",
        descriptionKey: "readiness.energy.low.description",
    },
    {
        value: "okay",
        emoji: "🙂",
        labelKey: "readiness.energy.okay.label",
        descriptionKey: "readiness.energy.okay.description",
    },
    {
        value: "good",
        emoji: "⚡",
        labelKey: "readiness.energy.good.label",
        descriptionKey: "readiness.energy.good.description",
    },
];

const timeOptions = [
    { value: 2, labelKey: "readiness.time.two" },
    { value: 5, labelKey: "readiness.time.five" },
    { value: 10, labelKey: "readiness.time.ten" },
];

const weatherOptions = [
    { value: "mild", emoji: "🌤️", labelKey: "readiness.weather.mild" },
    { value: "hot", emoji: "☀️", labelKey: "readiness.weather.hot" },
    { value: "rainy", emoji: "🌧️", labelKey: "readiness.weather.rainy" },
    { value: "cold", emoji: "❄️", labelKey: "readiness.weather.cold" },
];

const headspaceOptions = [
    {
        value: "heavy",
        emoji: "🌫️",
        labelKey: "readiness.headspace.heavy.label",
        descriptionKey: "readiness.headspace.heavy.description",
    },
    {
        value: "neutral",
        emoji: "😐",
        labelKey: "readiness.headspace.neutral.label",
        descriptionKey: "readiness.headspace.neutral.description",
    },
    {
        value: "light",
        emoji: "😌",
        labelKey: "readiness.headspace.light.label",
        descriptionKey: "readiness.headspace.light.description",
    },
];

function ReadinessSheet({ entry, initialReadiness, onClose, onSave }) {
    const { t, locale } = useI18n();
    const [readiness, setReadiness] = useState(() =>
        normalizeReadiness(initialReadiness)
    );
    const content = getExerciseContent(entry, locale);

    const update = (key, value) => {
        setReadiness((current) => ({ ...current, [key]: value }));
    };

    return (
        <Sheet
            title={t("readiness.title")}
            eyebrow={content?.title}
            onClose={onClose}
            footer={
                <>
                    <button
                        className="btn btn--secondary"
                        type="button"
                        onClick={onClose}
                    >
                        {t("readiness.skip")}
                    </button>
                    <button
                        className="btn btn--primary"
                        type="button"
                        onClick={() => onSave(readiness)}
                    >
                        {t("readiness.save")}
                    </button>
                </>
            }
        >
            <p className="sheet-lead">{t("readiness.lead")}</p>

            <SwipeChoice
                legend={t("readiness.energyLegend")}
                name="readiness-energy"
                options={energyOptions.map((option) => ({
                    value: option.value,
                    emoji: option.emoji,
                    label: t(option.labelKey),
                    description: t(option.descriptionKey),
                }))}
                value={readiness.energy}
                onChange={(value) => update("energy", value)}
            />

            <fieldset className="check-fieldset">
                <legend>{t("readiness.timeLegend")}</legend>
                <div className="check-pills">
                    {timeOptions.map((option) => (
                        <label
                            className={`check-pill ${readiness.time === option.value ? "check-pill--selected" : ""}`}
                            key={option.value}
                        >
                            <input
                                type="radio"
                                name="readiness-time"
                                value={option.value}
                                checked={readiness.time === option.value}
                                onChange={() => update("time", option.value)}
                            />
                            <span>{t(option.labelKey)}</span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <fieldset className="check-fieldset">
                <legend>{t("readiness.weatherLegend")}</legend>
                <div className="check-pills">
                    {weatherOptions.map((option) => (
                        <label
                            className={`check-pill ${readiness.weather === option.value ? "check-pill--selected" : ""}`}
                            key={option.value}
                        >
                            <input
                                type="radio"
                                name="readiness-weather"
                                value={option.value}
                                checked={readiness.weather === option.value}
                                onChange={() => update("weather", option.value)}
                            />
                            <span
                                className="check-pill__emoji"
                                aria-hidden="true"
                            >
                                {option.emoji}
                            </span>
                            <span>{t(option.labelKey)}</span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <SwipeChoice
                legend={t("readiness.headspaceLegend")}
                name="readiness-headspace"
                options={headspaceOptions.map((option) => ({
                    value: option.value,
                    emoji: option.emoji,
                    label: t(option.labelKey),
                    description: t(option.descriptionKey),
                }))}
                value={readiness.headspace}
                onChange={(value) => update("headspace", value)}
            />

            <p className="readiness-note">{t("readiness.note")}</p>
        </Sheet>
    );
}

export default ReadinessSheet;
