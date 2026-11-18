import { Bell } from "lucide-react";

import { useI18n } from "../../i18n";

function NudgeBanner({ nudge, onOpen, onSnooze }) {
    const { t } = useI18n();
    const copyBase = nudge.copyBase;

    return (
        <article
            className={`nudge-banner nudge-banner--${nudge.intensity}`}
            role="status"
            aria-live="polite"
        >
            <span className="nudge-banner__icon" aria-hidden="true">
                <Bell size={18} />
            </span>
            <div className="nudge-banner__copy">
                <p className="eyebrow">
                    {t(`goals.${nudge.domain}.name`)}
                </p>
                <strong>{t(`${copyBase}.title`)}</strong>
                <p>{t(`${copyBase}.body`)}</p>
            </div>
            <div className="nudge-banner__actions">
                <button
                    className="btn btn--primary"
                    type="button"
                    onClick={onOpen}
                >
                    {t("nudges.open")}
                </button>
                <button
                    className="text-button"
                    type="button"
                    onClick={onSnooze}
                >
                    {t("nudges.snooze")}
                </button>
            </div>
        </article>
    );
}

export default NudgeBanner;
