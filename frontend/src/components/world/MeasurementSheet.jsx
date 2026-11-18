import Sheet from "../ui/Sheet";

import { useI18n } from "../../i18n";

import { getMeasurement } from "../../services/measurement";

import { getOutcomeMetrics } from "../../services/outcomeMetrics";

function Stat({ label, value, note }) {
    return (
        <div className="stat">
            <span className="stat__value">{value}</span>
            <strong>{label}</strong>
            {note && <span className="stat__note">{note}</span>}
        </div>
    );
}

const GUIDANCE_NOTES = {
    gentler:
        "Recent feedback suggests keeping the next step gentle.",
    hold:
        "A recent safety pause is being respected, so the next step is not increasing.",
    increase:
        "Recent steps have felt comfortable, so the next step can grow slightly.",
    steady:
        "Recent feedback is mixed, so the next step stays steady.",
    rested:
        "You rested today. The next step will feel fresh when you return.",
};

function MeasurementSheet({ measurement, activitySummary, learning, onClose }) {
    const { t, locale } = useI18n();
    const insight = learning?.insight;
    const topAction = insight?.topAction;

    return (
        <Sheet
            title={t("measurement.title")}
            eyebrow={t("measurement.eyebrow")}
            onClose={onClose}
            footer={
                <button
                    className="btn btn--primary"
                    type="button"
                    onClick={onClose}
                >
                    {t("common.done")}
                </button>
            }
        >
            <p className="sheet-lead">{t("measurement.lead")}</p>

            <div className="stat-grid">
                <Stat
                    label={t("measurement.planKept")}
                    value={`${measurement.persistence}%`}
                    note={`${t("measurement.completedOf", {
                        completed: measurement.completedCount,
                        eligible: measurement.eligibleCount,
                    })}`}
                />
                <Stat
                    label={t("measurement.resting")}
                    value={`${measurement.restCount} day${measurement.restCount !== 1 ? "s" : ""}`}
                    note={t("measurement.restNote")}
                />
                <Stat
                    label={t("measurement.activeDays")}
                    value={measurement.activeDays}
                    note={t("measurement.ofDAys", { total: measurement.plannedCount })}
                />
                {insight?.enjoymentCaptured > 0 && (
                    <Stat
                        label={t("measurement.enjoyment")}
                        value={`${insight.enjoymentRate}%`}
                        note={`${insight.enjoymentCaptured} check-ins rated`}
                    />
                )}
                <Stat
                    label={t("measurement.movementMinutes")}
                    value={`${measurement.movementMinutes} min`}
                    note={
                        activitySummary?.count
                            ? `${activitySummary.count} ${t("measurement.syncedActivities")}`
                            : t("measurement.fromPlan")
                    }
                />
                <Stat
                    label={t("measurement.sleepActions")}
                    value={measurement.sleepActions}
                    note={t("measurement.calmerSteps")}
                />
                <Stat
                    label={t("measurement.returnedAfterPause")}
                    value={measurement.returnedAfterPause ? t("yes") : t("notYet")}
                    note={
                        measurement.returnedAfterPause
                            ? t("youCameBackStronger")
                            : t("doorStaysOpen")
                    }
                />
            </div>

            {insight?.hasData && (
                <section
                    className="measurement-learning"
                    aria-labelledby="measurement-learning-title"
                >
                    <h2 id="measurement-learning-title">
                        {t("measurement.whatWeLearned")}
                    </h2>
                    <p>
                        {insight.totalResolved} {t("measurement.momentsOfFeedback so far.")}
                        {insight.totalResolved > 0 && (
                            <span>
                                {insight.completedCount} {t("measurement.completed")},
                                {insight.pausedCount} {t("measurement.paused")}
                            </span>
                        )}
                    </p>
                    <ul>
                        {topAction?.effective > 0 ? (
                            <li>
                                Your steadiest step is {topAction.title} ({topAction.effective} {t("measurement.comfortable completions")}).
                            </li>
                        ) : (
                            <li>{t("measurement.noStepComfortableYet")}</li>
                        )}
                        {insight.topBarrier && (
                            <li>
                                {insight.topBarrier.barrier} came up{" "}
                                {insight.topBarrier.count} {t("measurement.times.")}
                            </li>
                        )}
                        {insight.enjoymentCaptured > 0 && (
                            <li>
                                You rated enjoyment in {insight.enjoymentCaptured} {t("measurement.checkins")};
                                {insight.enjoyedCount} {t("measurement.feltLikeAGoodFit.")}
                            </li>
                        )}
                        <li>
                            {insight.safetyPauses
                                ? `You paused for safety ${insight.safetyPauses} times. ${t("measurement.pausesRespected.")}`
                                : t("measurement.noSafetyPausesRecorded.")}
                        </li>
                    </ul>
                    <p className="measurement-learning__note">
                        {GUIDANCE_NOTES[insight.guidance] ??
                            GUIDANCE_NOTES.steady}
                    </p>
                </section>
            )}

            <div className="measurement-note">
                <p>
                    {t("measurement.progressNotAScore")}
                </p>
                {activitySummary?.count > 0 && (
                    <p>
                        {t("measurement.movementHistoryIsSynced")}.
                    </p>
                )}
            </div>
        </Sheet>
    );
}

export default MeasurementSheet;