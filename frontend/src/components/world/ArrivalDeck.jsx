import { useState, useEffect } from "react";

import { useI18n } from "../../i18n";
import SwipeDeck from "./SwipeDeck";

import {
    ARRIVAL_TIME_VALUES,
    MOOD_READINESS,
    ARRIVAL_WEATHER_VALUES,
    buildArrivalReadiness,
} from "../../services/moodReadiness";

import { saveArrivalEntry, isArrivalDone, loadArrivalHistory } from "../../services/arrivalStore";

import Sheet from "../ui/Sheet";

function ArrivalDeck({ userId, onClose, onApply }) {
    const { t, locale } = useI18n();
    const [step, setStep] = useState("mood");
    const [mood, setMood] = useState(null);
    const [time, setTime] = useState(null);
    const [weather, setWeather] = useState(null);
    const [energy, setEnergy] = useState(null);
    const [headspace, setHeadspace] = useState(null);
    const [arrivalRecord, setArrivalRecord] = useState(null);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!userId) return;
        const existing = loadArrivalHistory(userId).find(
            (entry) => entry.date === new Date().toISOString().split("T")[0]
        );
        if (existing) {
            setArrivalRecord(existing);
            setStep("done");
        }
    }, [userId]);

    // Wait for i18n catalog to fully load before rendering cards
    useEffect(() => {
        // Allow one render cycle for i18n catalog to settle
        const timeout = setTimeout(() => setInitialized(true), 100);
        return () => clearTimeout(timeout);
    }, [locale]);

    const moodOptions = [
        { id: "calm", labelKey: "mood.card.calm.label", hintKey: "mood.card.calm.hint", emoji: "😌" },
        { id: "hopeful", labelKey: "mood.card.hopeful.label", hintKey: "mood.card.hopeful.hint", emoji: "🌱" },
        { id: "tired", labelKey: "mood.card.tired.label", hintKey: "mood.card.tired.hint", emoji: "😴" },
        { id: "heavy", labelKey: "mood.card.heavy.label", hintKey: "mood.card.heavy.hint", emoji: "😔" },
        { id: "restless", labelKey: "mood.card.restless.label", hintKey: "mood.card.restless.hint", emoji: "🌀" },
    ];

    const timeOptions = [
        { id: "2", labelKey: "arrival.time.two", emoji: "⌚", duration: 2 },
        { id: "5", labelKey: "arrival.time.five", emoji: "⌚", duration: 5 },
        { id: "10", labelKey: "arrival.time.ten", emoji: "⌚", duration: 10 },
    ];

    const weatherOptions = [
        { id: "mild", labelKey: "arrival.weather.mild", emoji: "🌤️" },
        { id: "hot", labelKey: "arrival.weather.hot", emoji: "☀️" },
        { id: "rainy", labelKey: "arrival.weather.rainy", emoji: "🌧️" },
        { id: "cold", labelKey: "arrival.weather.cold", emoji: "❄️" },
    ];

    const handleMoodChange = (id) => {
        setMood(id);
        const readiness = buildArrivalReadiness({ mood: id });
        setEnergy(readiness.energy);
        setHeadspace(readiness.headspace);
        setStep("time");
    };

    const handleTimeChange = (id) => {
        const selected = timeOptions.find((o) => o.id === id);
        if (selected) {
            setTime(Number(selected.duration));
            setStep("weather");
        }
    };

    const handleWeatherChange = (id) => {
        const selected = weatherOptions.find((o) => o.id === id);
        if (selected) {
            setWeather(selected.id);
            setStep("done");
            // Derive readiness on complete
            const readiness = buildArrivalReadiness({
                mood,
                time: Number(time),
                weather: selected.id,
            });
            setEnergy(readiness.energy);
            setHeadspace(readiness.headspace);
        }
    };

    const handleApply = () => {
        if (!mood || time === null || !weather) return;

        const readiness = buildArrivalReadiness({
            mood,
            time: Number(time),
            weather,
        });

        const dayId = `day-${new Date().toISOString().slice(0, 10)}`;
        saveArrivalEntry(userId, {
            mood,
            time: Number(time),
            weather,
            applied: {
                dayId,
                slot: "primary",
                beforeDose: null,
                afterDose: null,
                beforeLabel: "",
                afterLabel: "",
            },
        });

        onApply && onApply({ mood, time: Number(time), weather, energy, headspace });
        setStep("done");
    };

    const handleSkip = () => {
        saveArrivalEntry(userId, { skipped: true });
        setStep("done");
    };

    if (step === "done") return null;

    return (
        <Sheet
            title={t("arrival.title")}
            eyebrow={t("arrival.eyebrow")}
            onClose={() => setArrival({ open: false })}
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
                        disabled={!mood || time === null || !weather}
                    >
                        {t("arrival.apply")}
                    </button>
                </>
            }
        >
            <p className="sheet-lead">{t("arrival.lead")}</p>

            {step === "mood" && (
                <SwipeDeck
                    items={moodOptions}
                    legend={t("arrival.moodLegend")}
                    onChoose={handleMoodChange}
                    chooseLabel={t("arrival.choose")}
                    passLabel={t("arrival.pass")}
                >
                    {initialized && moodOptions.map((option) => ({
                        id: option.id,
                        labelKey: option.labelKey,
                        hintKey: option.hintKey,
                        emoji: option.emoji,
                    }))}
                </SwipeDeck>
            )}

            {step === "time" && (
                <SwipeDeck
                    items={timeOptions}
                    legend={t("arrival.timeLegend")}
                    onChoose={handleTimeChange}
                    chooseLabel={t("arrival.choose")}
                    passLabel={t("arrival.pass")}
                >
                    {initialized && timeOptions.map((option) => ({
                        id: option.id,
                        labelKey: option.labelKey,
                        emoji: option.emoji,
                    }))}
                </SwipeDeck>
            )}

            {step === "weather" && (
                <SwipeDeck
                    items={weatherOptions}
                    legend={t("arrival.weatherLegend")}
                    onChoose={handleWeatherChange}
                    chooseLabel={t("arrival.choose")}
                    passLabel={t("arrival.pass")}
                >
                    {initialized && weatherOptions.map((option) => ({
                        id: option.id,
                        labelKey: option.labelKey,
                        emoji: option.emoji,
                    }))}
                </SwipeDeck>
            )}
        </Sheet>
    );
}

export default ArrivalDeck;