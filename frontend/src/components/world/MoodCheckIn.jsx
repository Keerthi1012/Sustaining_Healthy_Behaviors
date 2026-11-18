import { useState, useEffect } from "react";

import Sheet from "../ui/Sheet";
import SwipeDeck from "./SwipeDeck";
import {
    MOOD_OPTIONS,
    getMoodOption,
    saveMoodEntry,
} from "../../services/moodStore";
import { useI18n } from "../../i18n";

function MoodCheckIn({ userId, initialMood, onClose, onSaved }) {
    const { t, locale } = useI18n();
    const [mood, setMood] = useState(initialMood ?? null);
    const [initialized, setInitialized] = useState(false);
    const option = mood ? getMoodOption(mood) : null;

    // Wait for i18n catalog to fully load before rendering cards
    useEffect(() => {
        const timeout = setTimeout(() => setInitialized(true), 100);
        return () => clearTimeout(timeout);
    }, [locale]);

    const handleChoose = (id) => {
        const entry = saveMoodEntry(userId, id);

        setMood(id);
        onSaved?.(entry);
    };

    const moodSwipeDeck = initialized ? (
        <SwipeDeck
            items={MOOD_OPTIONS}
            legend={t("mood.legend")}
            onChoose={handleChoose}
        />
    ) : null;

    return (
        <Sheet
            title={t("mood.title")}
            eyebrow={t("mood.eyebrow")}
            onClose={onClose}
            footer={
                <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={onClose}
                >
                    {option ? t("mood.close") : t("mood.skip")}
                </button>
            }
        >
            {option ? (
                <>
                    <div className="mood-confirm" role="status">
                        <span
                            className="mood-confirm__emoji"
                            aria-hidden="true"
                        >
                            {option.emoji}
                        </span>
                        <h3>
                            {t("mood.summary", {
                                mood: t(option.labelKey),
                            })}
                        </h3>
                        <p>{t(option.suggestionKey)}</p>
                    </div>

                    <button
                        className="text-button"
                        type="button"
                        onClick={() => setMood(null)}
                    >
                        {t("mood.again")}
                    </button>
                </>
            ) : (
                <>
                    <p className="sheet-lead">{t("mood.lead")}</p>
                    {moodSwipeDeck}
                </>
            )}
        </Sheet>
    );
}

export default MoodCheckIn;