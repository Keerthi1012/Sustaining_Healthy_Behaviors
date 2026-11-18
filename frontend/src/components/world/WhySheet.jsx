import Sheet from "../ui/Sheet";
import { getBctLabelKeys } from "../../data/bctLabels";
import { getProgressionStep } from "../../services/planEngine";
import { useI18n } from "../../i18n";

const DOMAIN_BOUNDARIES = {
    movement:
        "ACSM safety boundaries: keep a single movement bout to about 10 minutes or less. Stop for pain, dizziness, faintness or unusual shortness of breath. Short movement breaks complement, and do not replace, medical advice.",
    sleep:
        "AASM safety boundaries: this support does not diagnose or treat insomnia or sleep apnoea. Seek clinical advice for persistent insomnia, loud snoring, gasping or severe daytime sleepiness.",
    nutrition:
        "WHO and CDC boundaries: this is general nutrition education, not medical nutrition therapy. Follow personalised advice for diabetes, kidney disease, allergies or disordered eating.",
    smoking:
        "WHO and USPHS boundaries: this support complements, and does not replace, counselling and approved cessation medication. Seek clinical advice if pregnant or managing heart or lung disease.",
};

function BoundaryList({ items = [] }) {
    if (!items.length) return null;

    return (
        <ul className="why-list">
            {items.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
            ))}
        </ul>
    );
}

function WhySheet({ entry, onClose }) {
    const { t, locale } = useI18n();
    const progression = getProgressionStep(entry);
    const nextMinutes = progression?.next
        ? entry.domain === "movement"
            ? Math.min(progression.next.minutes, 10)
            : progression.next.minutes
        : null;

    return (
        <Sheet
            title={t("why.title")}
            eyebrow={entry.title}
            onClose={onClose}
            footer={
                <button className="btn btn--primary" type="button" onClick={onClose}>
                    {t("common.gotIt")}
                </button>
            }
        >
            <p className="sheet-lead">{entry.why}</p>

            {entry.personalisation && (
                <section className="why-section">
                    <h3>{t("why.personalised")}</h3>
                    <p>
                        {t(
                            `why.personalised.${entry.personalisation.reasonCode}`
                        )}
                    </p>
                </section>
            )}

            {entry.clinicalFocusTag && (
                <section className="why-section">
                    <h3>{t("ecosystem.clinical.title")}</h3>
                    <p>
                        {t(
                            `ecosystem.clinical.${entry.clinicalFocusTag}`
                        )}
                    </p>
                    <p className="why-section__notice">
                        {t("ecosystem.clinical.notice")}
                    </p>
                </section>
            )}

            <section className="why-section">
                <h3>{t("why.basedOn")}</h3>
                <div className="why-chips">
                    {getBctLabelKeys(entry.bctIds).map((key) => (
                        <span className="why-chip" key={key}>
                            {t(key)}
                        </span>
                    ))}
                </div>
            </section>

            {progression && (
                <section className="why-section">
                    <h3>{t("why.growing")}</h3>
                    <p>
                        {t("why.level", {
                            level: progression.current.level,
                        })}
                        {progression.current.name
                            ? ` · ${progression.current.name}`
                            : ""}
                        .{" "}
                        {progression.next
                            ? t("why.nextStep", { minutes: nextMinutes })
                            : t("why.topLevel")}
                    </p>
                </section>
            )}

            <section className="why-section">
                <h3>{t("why.clinical")}</h3>
                {locale === "ar" && (
                    <p className="why-section__notice">
                        {t("why.englishNotice")}
                    </p>
                )}
                {entry.clinicalBasis && <p>{entry.clinicalBasis}</p>}
                {entry.boundaries ? (
                    <>
                        <p className="why-section__label">
                            {t("why.notFor")}
                        </p>
                        <BoundaryList items={entry.boundaries.not_for} />
                        <p className="why-section__label">
                            {t("why.seekHelp")}
                        </p>
                        <BoundaryList items={entry.boundaries.seek_help_if} />
                        {entry.boundaries.population_exclusions?.length >
                            0 && (
                            <>
                                <p className="why-section__label">
                                    {t("why.extraCare")}
                                </p>
                                <BoundaryList
                                    items={
                                        entry.boundaries
                                            .population_exclusions
                                    }
                                />
                            </>
                        )}
                    </>
                ) : (
                    <p>{DOMAIN_BOUNDARIES[entry.domain] ?? entry.limits}</p>
                )}
            </section>

            <section className="why-section">
                <h3>{t("why.limits")}</h3>
                <p>{entry.limits}</p>
            </section>

            <section className="why-section">
                <h3>{t("why.safety")}</h3>
                <p>{entry.safety}</p>
                {entry.safetyRules?.screening?.length > 0 && (
                    <>
                        <p className="why-section__label">
                            {t("why.checkBefore")}
                        </p>
                        <BoundaryList items={entry.safetyRules.screening} />
                    </>
                )}
                {entry.safetyRules?.signals?.length > 0 && (
                    <BoundaryList
                        items={entry.safetyRules.signals.map(
                            (signal) =>
                                `${signal.label}: ${signal.guidance}`
                        )}
                    />
                )}
            </section>
        </Sheet>
    );
}

export default WhySheet;
