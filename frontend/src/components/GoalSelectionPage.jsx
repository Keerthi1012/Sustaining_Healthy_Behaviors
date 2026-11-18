import {
    Apple,
    ArrowLeft,
    ArrowRight,
    Footprints,
    Moon,
    Wind,
} from "lucide-react";
import CompanionPair from "./companion/CompanionPair";
import { GOALS } from "../data/goals";
import { useI18n } from "../i18n";
import "./GoalSelectionPage.css";

const icons = {
    footprints: Footprints,
    moon: Moon,
    apple: Apple,
    wind: Wind,
};

function GoalSelectionPage({ onContinue, onBack }) {
    const { t } = useI18n();

    return (
        <main className="goal-page">
            <header className="goal-header">
                <button className="back-button" type="button" onClick={onBack}>
                    <ArrowLeft
                        className="icon-directional"
                        size={16}
                        aria-hidden="true"
                    />
                    {t("common.back")}
                </button>
                <span className="goal-step">{t("goals.step")}</span>
            </header>

            <section className="goal-intro">
                <CompanionPair
                    heartSize={92}
                    mindSize={92}
                    heartExpression="welcome"
                    mindExpression="welcome"
                />
                <p className="eyebrow">{t("goals.eyebrow")}</p>
                <h1>{t("goals.title")}</h1>
                <p>{t("goals.description")}</p>
            </section>

            <section className="goal-grid" aria-label={t("goals.gridLabel")}>
                {GOALS.map((goal) => {
                    const Icon = icons[goal.icon];
                    const disabled = !goal.available;

                    return (
                        <button
                            className={`goal-card goal-card--${goal.id} ${disabled ? "goal-card--disabled" : ""}`}
                            key={goal.id}
                            type="button"
                            onClick={() => onContinue(goal)}
                            disabled={disabled}
                        >
                            <span className="goal-icon" aria-hidden="true">
                                <Icon size={28} />
                            </span>

                            <span className="goal-card-text">
                                <span className="goal-card-title">
                                    <strong>
                                        {t(`goals.${goal.id}.name`)}
                                    </strong>
                                    {disabled && (
                                        <span className="goal-badge">
                                            {t("goals.comingLater")}
                                        </span>
                                    )}
                                </span>
                                <span className="goal-realm">
                                    {t(`goals.${goal.id}.realm`)}
                                </span>
                                <span className="goal-description">
                                    {t(`goals.${goal.id}.description`)}
                                </span>
                            </span>

                            {!disabled && (
                                <ArrowRight
                                    className="goal-arrow icon-directional"
                                    size={20}
                                    aria-hidden="true"
                                />
                            )}
                        </button>
                    );
                })}
            </section>

            <p className="goal-note">{t("goals.note")}</p>
        </main>
    );
}

export default GoalSelectionPage;
