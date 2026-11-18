import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import Sheet from "../ui/Sheet";
import { getExerciseContent } from "../../content/exercises";
import { useI18n } from "../../i18n";

const difficultyOptions = [
    {
        value: "easy",
        emoji: "😌",
        labelKey: "checkin.difficulty.easy.label",
        descriptionKey: "checkin.difficulty.easy.description",
    },
    {
        value: "comfortable",
        emoji: "🙂",
        labelKey: "checkin.difficulty.comfortable.label",
        descriptionKey: "checkin.difficulty.comfortable.description",
    },
    {
        value: "difficult",
        emoji: "😕",
        labelKey: "checkin.difficulty.difficult.label",
        descriptionKey: "checkin.difficulty.difficult.description",
    },
    {
        value: "too_much",
        emoji: "😣",
        labelKey: "checkin.difficulty.tooMuch.label",
        descriptionKey: "checkin.difficulty.tooMuch.description",
    },
];

const barrierOptions = [
    { value: "Nothing in particular", labelKey: "checkin.barrier.none" },
    { value: "Not enough time", labelKey: "checkin.barrier.time" },
    { value: "Low energy", labelKey: "checkin.barrier.energy" },
    { value: "Hot weather", labelKey: "checkin.barrier.hotWeather" },
    { value: "I lost motivation", labelKey: "checkin.barrier.motivation" },
    { value: "Family or work demands", labelKey: "checkin.barrier.demands" },
    { value: "Discomfort or pain", labelKey: "checkin.barrier.pain" },
];

const enjoymentOptions = [
    {
        value: "not_for_me",
        emoji: "🙅",
        labelKey: "checkin.enjoyment.notForMe.label",
    },
    {
        value: "okay",
        emoji: "🙂",
        labelKey: "checkin.enjoyment.okay.label",
    },
    {
        value: "loved",
        emoji: "😊",
        labelKey: "checkin.enjoyment.loved.label",
    },
];

const safetyOptions = [
    {
        value: "none",
        labelKey: "checkin.safety.none.label",
        descriptionKey: "checkin.safety.none.description",
    },
    {
        value: "pain",
        labelKey: "checkin.safety.pain.label",
        descriptionKey: "checkin.safety.pain.description",
    },
    {
        value: "concerning_symptom",
        labelKey: "checkin.safety.symptom.label",
        descriptionKey: "checkin.safety.symptom.description",
    },
];

function CheckInSheet({ entry, onClose, onSave }) {
    const { t, locale } = useI18n();
    const [difficulty, setDifficulty] = useState("comfortable");
    const [barrier, setBarrier] = useState("Nothing in particular");
    const [enjoyment, setEnjoyment] = useState("okay");
    const [safety, setSafety] = useState("none");

    const content = getExerciseContent(entry, locale);
    const isMovement = entry.domain === "movement";
    const safetyConcern = safety !== "none";

    return (
        <Sheet
            title={t("checkin.title")}
            eyebrow={content.title}
            onClose={onClose}
            footer={
                <>
                    <button className="btn btn--secondary" type="button" onClick={onClose}>
                        {t("checkin.cancel")}
                    </button>
                    <button
                        className="btn btn--primary"
                        type="button"
                        onClick={() =>
                            onSave({
                                difficulty,
                                barrier,
                                enjoyment,
                                safety,
                            })
                        }
                    >
                        {safetyConcern
                            ? t("checkin.pauseSave")
                            : t("checkin.save")}
                    </button>
                </>
            }
        >
            <p className="sheet-lead">{t("checkin.lead")}</p>

            <fieldset className="check-fieldset">
                <legend>{t("checkin.feelLegend")}</legend>
                <div className="check-options">
                    {difficultyOptions.map((option) => (
                        <label
                            className={`check-option ${difficulty === option.value ? "check-option--selected" : ""}`}
                            key={option.value}
                        >
                            <input
                                type="radio"
                                name="difficulty"
                                value={option.value}
                                checked={difficulty === option.value}
                                onChange={() => setDifficulty(option.value)}
                            />
                            <span className="check-emoji" aria-hidden="true">
                                {option.emoji}
                            </span>
                            <span>
                                <strong>{t(option.labelKey)}</strong>
                                <span>{t(option.descriptionKey)}</span>
                            </span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <fieldset className="check-fieldset">
                <legend>{t("checkin.enjoymentLegend")}</legend>
                <div className="check-pills">
                    {enjoymentOptions.map((option) => (
                        <label
                            className={`check-pill ${enjoyment === option.value ? "check-pill--selected" : ""}`}
                            key={option.value}
                        >
                            <input
                                type="radio"
                                name="enjoyment"
                                value={option.value}
                                checked={enjoyment === option.value}
                                onChange={() =>
                                    setEnjoyment(option.value)
                                }
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

            <fieldset className="check-fieldset">
                <legend>{t("checkin.barrierLegend")}</legend>
                <div className="check-pills">
                    {barrierOptions.map((option) => (
                        <label
                            className={`check-pill ${barrier === option.value ? "check-pill--selected" : ""}`}
                            key={option.value}
                        >
                            <input
                                type="radio"
                                name="barrier"
                                value={option.value}
                                checked={barrier === option.value}
                                onChange={() => setBarrier(option.value)}
                            />
                            <span>{t(option.labelKey)}</span>
                        </label>
                    ))}
                </div>
            </fieldset>

            {isMovement && (
                <fieldset className="check-fieldset">
                    <legend>{t("checkin.safetyLegend")}</legend>
                    <div className="check-options check-options--compact">
                        {safetyOptions.map((option) => (
                            <label
                                className={`check-option ${safety === option.value ? "check-option--selected" : ""}`}
                                key={option.value}
                            >
                                <input
                                    type="radio"
                                    name="safety"
                                    value={option.value}
                                    checked={safety === option.value}
                                    onChange={() => setSafety(option.value)}
                                />
                                <span>
                                    <strong>{t(option.labelKey)}</strong>
                                    <span>{t(option.descriptionKey)}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            )}

            {safetyConcern && (
                <div className="check-safety" role="status">
                    <ShieldAlert size={18} aria-hidden="true" />
                    <p>{t("checkin.safetyNotice")}</p>
                </div>
            )}
        </Sheet>
    );
}

export default CheckInSheet;
