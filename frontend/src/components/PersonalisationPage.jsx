import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import CompanionPair from "./companion/CompanionPair";
import { getOnboardingConfig } from "../data/onboarding";
import {
    ABU_DHABI_PRESET_IDS,
    DEFAULT_ECOSYSTEM_CONTEXT,
    SCREENING_OPTIONS,
    getSampleAbuDhabiProfile,
    normalizeEcosystemContext,
} from "../services/ecosystemStore";
import { useI18n } from "../i18n";
import "./PersonalisationPage.css";

const PRESET_LABEL_KEYS = {
    desk_heat: "ecosystem.presetDeskHeat",
    shift_nurse: "ecosystem.presetShiftNurse",
    ramadan_focus: "ecosystem.presetRamadan",
};

const SCREENING_LABEL_KEYS = {
    none: "ecosystem.screeningNone",
    prediabetes: "ecosystem.screeningPrediabetes",
    hypertension: "ecosystem.screeningHypertension",
    cardio_metabolic: "ecosystem.screeningCardio",
};

const FLAG_ROWS = [
    {
        id: "extremeHeatMode",
        labelKey: "ecosystem.flagHeatLabel",
        descriptionKey: "ecosystem.flagHeatDesc",
    },
    {
        id: "shiftWorker",
        labelKey: "ecosystem.flagShiftLabel",
        descriptionKey: "ecosystem.flagShiftDesc",
    },
    {
        id: "fasting",
        labelKey: "ecosystem.flagFastingLabel",
        descriptionKey: "ecosystem.flagFastingDesc",
    },
    {
        id: "mobilitySupport",
        labelKey: "ecosystem.flagMobilityLabel",
        descriptionKey: "ecosystem.flagMobilityDesc",
    },
];

const HEALTH_AGE_VALUES = Array.from(
    { length: 16 },
    (_, index) => index - 5
);

function formatSignedYears(value) {
    return value > 0 ? `+${value}` : `${value}`;
}

function getDefaultAnswers(config) {
    const answers = {};

    config?.questions?.forEach((question) => {
        if (question.defaultValue !== undefined) {
            answers[question.id] = question.defaultValue;
        }
    });

    return answers;
}

function PersonalisationPage({
    goal,
    onBack,
    onComplete,
    initialEcosystemContext,
}) {
    const { t } = useI18n();
    const config = getOnboardingConfig(goal?.id);
    const [answers, setAnswers] = useState(() =>
        getDefaultAnswers(config)
    );
    const [ecosystemContext, setEcosystemContext] = useState(() =>
        normalizeEcosystemContext(initialEcosystemContext)
    );

    if (!config) {
        return (
            <main className="personal-page">
                <button className="back-button" type="button" onClick={onBack}>
                    <ArrowLeft
                        className="icon-directional"
                        size={16}
                        aria-hidden="true"
                    />
                    {t("common.backToFocus")}
                </button>
                <p>{t("personalisation.missingFocus")}</p>
            </main>
        );
    }

    const allAnswered = config.questions
        .filter((question) => !question.optional)
        .every((question) => answers[question.id]);

    const handleChange = (id, value) => {
        setAnswers((previous) => ({
            ...previous,
            [id]: value,
        }));
    };

    const updateEcosystem = (patch) => {
        setEcosystemContext((previous) =>
            normalizeEcosystemContext({
                ...previous,
                source: "manual",
                updatedAt: null,
                ...patch,
            })
        );
    };

    const handleFlagChange = (flag, value) => {
        setEcosystemContext((previous) =>
            normalizeEcosystemContext({
                ...previous,
                source: "manual",
                updatedAt: null,
                contextFlags: {
                    ...previous.contextFlags,
                    [flag]: value,
                },
            })
        );
    };

    const handleStepsChange = (value) => {
        setEcosystemContext((previous) =>
            normalizeEcosystemContext({
                ...previous,
                source: "manual",
                updatedAt: null,
                wearableBaseline: {
                    ...previous.wearableBaseline,
                    dailySteps: value,
                },
            })
        );
    };

    const handlePreset = (presetId) => {
        const preset = getSampleAbuDhabiProfile(presetId);

        if (preset) setEcosystemContext(preset);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!allAnswered) return;

        onComplete(
            {
                primaryGoalId: goal.id,
                goalIds: [goal.id],
                answers,
            },
            normalizeEcosystemContext(ecosystemContext)
        );
    };

    return (
        <main className="personal-page">
            <header className="personal-header">
                <button className="back-button" type="button" onClick={onBack}>
                    <ArrowLeft
                        className="icon-directional"
                        size={16}
                        aria-hidden="true"
                    />
                    {t("common.backToFocus")}
                </button>
                <span>{t("personalisation.step")}</span>
            </header>

            <section className="personal-intro">
                <CompanionPair
                    heartSize={82}
                    mindSize={82}
                    heartExpression="welcome"
                    mindExpression="thinking"
                />
                <p className="eyebrow">{t("personalisation.eyebrow")}</p>
                <h1>{t(config.titleKey)}</h1>
                <p>{t(config.descriptionKey)}</p>
            </section>

            <form className="personal-form" onSubmit={handleSubmit}>
                {config.questions.map((question, index) => (
                    <fieldset className="personal-question" key={question.id}>
                        <legend>
                            <span>{index + 1}.</span> {t(question.labelKey)}
                            {question.optional
                                ? t("common.optionalSuffix")
                                : ""}
                        </legend>

                        <div className="personal-options">
                            {question.type === "time" ? (
                                <input
                                    className="personal-time-input"
                                    type="time"
                                    aria-label={t(question.labelKey)}
                                    value={answers[question.id] ?? ""}
                                    onChange={(event) =>
                                        handleChange(
                                            question.id,
                                            event.target.value
                                        )
                                    }
                                />
                            ) : (
                                question.options.map((option) => (
                                    <label
                                        className={`personal-option ${answers[question.id] === option.value ? "personal-option--selected" : ""}`}
                                        key={option.value}
                                    >
                                        <input
                                            type="radio"
                                            name={question.id}
                                            value={option.value}
                                            checked={
                                                answers[question.id] ===
                                                option.value
                                            }
                                            onChange={() =>
                                                handleChange(
                                                    question.id,
                                                    option.value
                                                )
                                            }
                                        />
                                        <span>{t(option.labelKey)}</span>
                                    </label>
                                ))
                            )}
                        </div>

                        {question.helperKey && (
                            <p className="personal-helper">
                                {t(question.helperKey)}
                            </p>
                        )}
                    </fieldset>
                ))}

                <fieldset className="personal-question personal-ecosystem">
                    <legend>{t("ecosystem.sectionTitle")}</legend>
                    <p className="personal-ecosystem__intro">
                        {t("ecosystem.sectionSubtitle")}
                    </p>

                    <div className="personal-ecosystem__block">
                        <p
                            className="personal-ecosystem__label"
                            id="ecosystem-presets-label"
                        >
                            {t("ecosystem.presetsLabel")}
                        </p>
                        <div
                            className="personal-ecosystem__presets"
                            role="group"
                            aria-labelledby="ecosystem-presets-label"
                        >
                            {ABU_DHABI_PRESET_IDS.map((presetId) => (
                                <button
                                    className="context-preset"
                                    type="button"
                                    key={presetId}
                                    onClick={() => handlePreset(presetId)}
                                >
                                    {t(PRESET_LABEL_KEYS[presetId])}
                                </button>
                            ))}
                            <button
                                className="context-preset context-preset--clear"
                                type="button"
                                onClick={() =>
                                    setEcosystemContext(
                                        normalizeEcosystemContext(
                                            DEFAULT_ECOSYSTEM_CONTEXT
                                        )
                                    )
                                }
                            >
                                {t("ecosystem.presetClear")}
                            </button>
                        </div>
                    </div>

                    <div className="personal-ecosystem__flags">
                        {FLAG_ROWS.map((row) => (
                            <label className="personal-flag" key={row.id}>
                                <span className="personal-flag__copy">
                                    <strong>{t(row.labelKey)}</strong>
                                    <span>{t(row.descriptionKey)}</span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={
                                        ecosystemContext.contextFlags[
                                            row.id
                                        ]
                                    }
                                    onChange={(event) =>
                                        handleFlagChange(
                                            row.id,
                                            event.target.checked
                                        )
                                    }
                                />
                            </label>
                        ))}
                    </div>

                    <div className="personal-ecosystem__fields">
                        <label className="personal-field">
                            <span>{t("ecosystem.healthAgeLabel")}</span>
                            <select
                                value={ecosystemContext.healthAgeDelta}
                                onChange={(event) =>
                                    updateEcosystem({
                                        healthAgeDelta: Number(
                                            event.target.value
                                        ),
                                    })
                                }
                            >
                                {HEALTH_AGE_VALUES.map((value) => (
                                    <option value={value} key={value}>
                                        {formatSignedYears(value)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="personal-field">
                            <span>{t("ecosystem.screeningLabel")}</span>
                            <select
                                value={ecosystemContext.screeningRisk}
                                onChange={(event) =>
                                    updateEcosystem({
                                        screeningRisk: event.target.value,
                                    })
                                }
                            >
                                {SCREENING_OPTIONS.map((option) => (
                                    <option value={option} key={option}>
                                        {t(SCREENING_LABEL_KEYS[option])}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="personal-field">
                            <span>{t("ecosystem.stepsBaselineLabel")}</span>
                            <input
                                type="number"
                                min="0"
                                max="60000"
                                step="100"
                                inputMode="numeric"
                                value={
                                    ecosystemContext.wearableBaseline
                                        .dailySteps
                                }
                                onChange={(event) =>
                                    handleStepsChange(
                                        event.target.value === ""
                                            ? 0
                                            : Number(event.target.value)
                                    )
                                }
                            />
                        </label>
                    </div>
                </fieldset>

                <button
                    className="personal-submit"
                    type="submit"
                    disabled={!allAnswered}
                >
                    {t("personalisation.submit")}
                </button>

                <p className="personal-footnote">
                    {t("personalisation.footnote")}
                </p>
            </form>
        </main>
    );
}

export default PersonalisationPage;
