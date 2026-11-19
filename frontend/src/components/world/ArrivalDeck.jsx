import { useState } from "react";

import { useI18n } from "../../i18n";
import SwipeDeck from "./SwipeDeck";
import { buildArrivalReadiness } from "../../services/moodReadiness";
import Sheet from "../ui/Sheet";

const MOOD_OPTIONS = [
    {
        id: "calm",
        labelKey: "mood.card.calm.label",
        hintKey: "mood.card.calm.hint",
        emoji: "😌",
    },
    {
        id: "hopeful",
        labelKey: "mood.card.hopeful.label",
        hintKey: "mood.card.hopeful.hint",
        emoji: "🌱",
    },
    {
        id: "tired",
        labelKey: "mood.card.tired.label",
        hintKey: "mood.card.tired.hint",
        emoji: "😴",
    },
    {
        id: "heavy",
        labelKey: "mood.card.heavy.label",
        hintKey: "mood.card.heavy.hint",
        emoji: "😔",
    },
    {
        id: "restless",
        labelKey: "mood.card.restless.label",
        hintKey: "mood.card.restless.hint",
        emoji: "🌀",
    },
];

const TIME_OPTIONS = [
    { id: "2", labelKey: "arrival.time.two", emoji: "⌚", duration: 2 },
    { id: "5", labelKey: "arrival.time.five", emoji: "⌚", duration: 5 },
    { id: "10", labelKey: "arrival.time.ten", emoji: "⌚", duration: 10 },
];

const WEATHER_OPTIONS = [
    { id: "mild", labelKey: "arrival.weather.mild", emoji: "🌤️" },
    { id: "hot", labelKey: "arrival.weather.hot", emoji: "☀️" },
    { id: "rainy", labelKey: "arrival.weather.rainy", emoji: "🌧️" },
    { id: "cold", labelKey: "arrival.weather.cold", emoji: "❄️" },
];

const STEP_ORDER = ["mood", "time", "weather", "summary"];

function ArrivalDeck({ initialMood = null, onClose, onApply, onSkip }) {
    const { t } = useI18n();
    const [step, setStep] = useState("mood");
    const [mood, setMood] = useState(initialMood);
    const [time, setTime] = useState(null);
    const [weather, setWeather] = useState(null);

    const moodOption =
        MOOD_OPTIONS.find((option) => option.id === mood) ?? null;
    const timeOption =
        TIME_OPTIONS.find((option) => option.duration === time) ?? null;
    const weatherOption =
        WEATHER_OPTIONS.find((option) => option.id === weather) ?? null;
    const ready = Boolean(moodOption && timeOption && weatherOption);

    const handleMoodChange = (id) => {
        setMood(id);
        setStep("time");
    };

    const handleTimeChange = (id) => {
        const selected = TIME_OPTIONS.find((option) => option.id === id);
        if (!selected) return;
        setTime(selected.duration);
        setStep("weather");
    };

    const handleWeatherChange = (id) => {
        const selected = WEATHER_OPTIONS.find((option) => option.id === id);
        if (!selected) return;
        setWeather(selected.id);
        setStep("summary");
    };

    const handleApply = () => {
        if (!ready) return;

        onApply?.({
            mood,
            time,
            weather,
            readiness: buildArrivalReadiness({ mood, time, weather }),
        });
        onClose?.();
    };

    const handleSkip = () => {
        onSkip?.();
        onClose?.();
    };

    const goBack = () => {
        const index = STEP_ORDER.indexOf(step);
        setStep(STEP_ORDER[Math.max(0, index - 1)]);
    };

    const summary = ready ? buildArrivalReadiness({ mood, time, weather }) : null;

    return (
        <Sheet
            title={t("arrival.title")}
            eyebrow={t("arrival.eyebrow")}
            onClose={() => onClose?.()}
            footer={
                <>
                    <button
                        className="btn btn--secondary"
                        type="button"
                        onClick={handleSkip}
                    >
                        {t("arrival.skip")}
                    </button>
                    <button
                        className="btn btn--primary"
                        type="button"
                        onClick={handleApply}
                        disabled={!ready}
                    >
                        {t("arrival.apply")}
                    </button>
                </>
            }
        >
            {step === "summary" ? (
                <div className="arrival-summary">
                    <p className="sheet-lead">{t("arrival.summaryLead")}</p>

                    <ul className="arrival-summary__list">
                        <li>
                            <span
                                className="arrival-summary__emoji"
                                aria-hidden="true"
                            >
                                {moodOption?.emoji}
                            </span>
                            <span className="arrival-summary__label">
                                {t("arrival.summaryMood")}
                            </span>
                            <strong>{t(moodOption.labelKey)}</strong>
                            <button
                                className="text-button"
                                type="button"
                                onClick={() => setStep("mood")}
                            >
                                {t("arrival.change")}
                            </button>
                        </li>
                        <li>
                            <span
                                className="arrival-summary__emoji"
                                aria-hidden="true"
                            >
                                {timeOption?.emoji}
                            </span>
                            <span className="arrival-summary__label">
                                {t("arrival.summaryTime")}
                            </span>
                            <strong>{t(timeOption.labelKey)}</strong>
                            <button
                                className="text-button"
                                type="button"
                                onClick={() => setStep("time")}
                            >
                                {t("arrival.change")}
                            </button>
                        </li>
                        <li>
                            <span
                                className="arrival-summary__emoji"
                                aria-hidden="true"
                            >
                                {weatherOption?.emoji}
                            </span>
                            <span className="arrival-summary__label">
                                {t("arrival.conditions")}
                            </span>
                            <strong>{t(weatherOption.labelKey)}</strong>
                            <button
                                className="text-button"
                                type="button"
                                onClick={() => setStep("weather")}
                            >
                                {t("arrival.change")}
                            </button>
                        </li>
                    </ul>

                    <p className="arrival-summary__note">
                        {t("arrival.readiness", {
                            time: summary.time,
                            energy: t(
                                `readiness.energy.${summary.energy}.label`
                            ),
                        })}
                    </p>
                </div>
            ) : (
                <>
                    <p className="sheet-lead">{t("arrival.lead")}</p>

                    {step === "mood" && (
                        <SwipeDeck
                            items={MOOD_OPTIONS}
                            initialIndex={Math.max(
                                0,
                                MOOD_OPTIONS.findIndex(
                                    (option) => option.id === mood
                                )
                            )}
                            legend={t("arrival.moodLegend")}
                            onChoose={handleMoodChange}
                            chooseLabel={t("arrival.mood.choose")}
                            passLabel={t("arrival.mood.pass")}
                        />
                    )}

                    {step === "time" && (
                        <SwipeDeck
                            items={TIME_OPTIONS}
                            initialIndex={Math.max(
                                0,
                                TIME_OPTIONS.findIndex(
                                    (option) => option.duration === time
                                )
                            )}
                            legend={t("arrival.timeLegend")}
                            onChoose={handleTimeChange}
                            chooseLabel={t("arrival.mood.choose")}
                            passLabel={t("arrival.mood.pass")}
                        />
                    )}

                    {step === "weather" && (
                        <SwipeDeck
                            items={WEATHER_OPTIONS}
                            initialIndex={Math.max(
                                0,
                                WEATHER_OPTIONS.findIndex(
                                    (option) => option.id === weather
                                )
                            )}
                            legend={t("arrival.conditionsLegend")}
                            onChoose={handleWeatherChange}
                            chooseLabel={t("arrival.mood.choose")}
                            passLabel={t("arrival.mood.pass")}
                        />
                    )}

                    {step !== "mood" && (
                        <button
                            className="text-button"
                            type="button"
                            onClick={goBack}
                        >
                            {t("arrival.back")}
                        </button>
                    )}
                </>
            )}
        </Sheet>
    );
}

export default ArrivalDeck;
