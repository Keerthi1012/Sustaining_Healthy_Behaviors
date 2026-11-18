import {
    Activity,
    BookOpen,
    CalendarCheck,
    Globe2,
    HeartPulse,
    ShieldCheck,
    TrendingUp,
} from "lucide-react";

import { getExerciseContent } from "../content/exercises";
import { useI18n } from "../i18n";

const WINDOW_KEYS = {
    starting: "outcomes.persistence.window.starting",
    building: "outcomes.persistence.window.building",
    sustained: "outcomes.persistence.window.sustained",
};

const FOCUS_KEYS = {
    prediabetes: "ecosystem.screeningPrediabetes",
    hypertension: "ecosystem.screeningHypertension",
    cardio_metabolic: "ecosystem.screeningCardio",
};

const ACCOMMODATION_KEYS = {
    heat: "ecosystem.flagHeatLabel",
    shift: "ecosystem.flagShiftLabel",
    fasting: "ecosystem.flagFastingLabel",
    mobilitySupport: "ecosystem.flagMobilityLabel",
};

const BARRIER_KEYS = {
    "Nothing in particular": "checkin.barrier.none",
    "Not enough time": "checkin.barrier.time",
    "Low energy": "checkin.barrier.energy",
    "Hot weather": "checkin.barrier.hotWeather",
    "I lost motivation": "checkin.barrier.motivation",
    "Family or work demands": "checkin.barrier.demands",
    "Discomfort or pain": "checkin.barrier.pain",
};

function formatSigned(value) {
    const normalized = Math.abs(value) < 0.05 ? 0 : value;
    return `${normalized > 0 ? "+" : ""}${normalized.toFixed(1)}`;
}

function Tile({ icon: Icon, title, children }) {
    return (
        <article className="world-outcomes__tile">
            <span className="world-outcomes__icon" aria-hidden="true">
                <Icon size={18} />
            </span>
            <h3>{title}</h3>
            {children}
        </article>
    );
}

function Signal({ icon: Icon, title, children }) {
    return (
        <article className="world-outcomes__signal">
            <span className="world-outcomes__signal-icon" aria-hidden="true">
                <Icon size={16} />
            </span>
            <div>
                <h3>{title}</h3>
                {children}
            </div>
        </article>
    );
}

function LearningInsight({ learning }) {
    const { t, locale } = useI18n();
    const insight = learning?.insight;

    if (!insight) return null;

    const action = insight.topAction
        ? getExerciseContent(
              {
                  id: insight.topAction.actionId,
                  domain: insight.topAction.domain,
                  title: insight.topAction.title,
              },
              locale
          )
        : null;
    const barrierLabel = insight.topBarrier
        ? t(
              BARRIER_KEYS[insight.topBarrier.barrier] ??
                  insight.topBarrier.barrier
          )
        : null;

    return (
        <section
            className="world-outcomes__learning"
            aria-labelledby="world-outcomes-learning-title"
        >
            <header className="world-outcomes__learning-head">
                <span className="world-outcomes__icon" aria-hidden="true">
                    <BookOpen size={18} />
                </span>
                <div>
                    <h3 id="world-outcomes-learning-title">
                        {t("outcomes.learning.title")}
                    </h3>
                    <p className="world-outcomes__learning-lead">
                        {insight.hasData
                            ? t("outcomes.learning.lead", {
                                  count: insight.totalResolved,
                              })
                            : t("outcomes.learning.empty")}
                    </p>
                </div>
            </header>

            {insight.hasData && (
                <>
                    <ul className="world-outcomes__learning-list">
                        {insight.topAction?.effective > 0 ? (
                            <li>
                                {t("outcomes.learning.action", {
                                    action:
                                        action?.title ??
                                        insight.topAction.actionId,
                                    count: insight.topAction.effective,
                                })}
                            </li>
                        ) : (
                            <li>{t("outcomes.learning.noComfort")}</li>
                        )}
                        {insight.topBarrier && (
                            <li>
                                {t("outcomes.learning.barrier", {
                                    barrier: barrierLabel,
                                    count: insight.topBarrier.count,
                                })}
                            </li>
                        )}
                        <li>
                            {insight.safetyPauses
                                ? t("outcomes.learning.safety", {
                                      count: insight.safetyPauses,
                                  })
                                : t("outcomes.learning.safetyNone")}
                        </li>
                    </ul>
                    <p className="world-outcomes__learning-note">
                        {t(
                            `outcomes.learning.guidance.${insight.guidance}`
                        )}
                    </p>
                </>
            )}
        </section>
    );
}

function OutcomesPanel({ metrics }) {
    const { t } = useI18n();
    const {
        persistence,
        retention,
        behaviour,
        resilience,
        trajectory,
        equityLens,
        inclusion,
        learning,
    } = metrics;
    const focusKey = FOCUS_KEYS[trajectory.clinicalFocus];
    const accommodationLabels = inclusion.accommodations
        .map((key) => t(ACCOMMODATION_KEYS[key]))
        .filter(Boolean)
        .join(", ");
    const hasTrajectoryShift =
        trajectory.hasContext &&
        trajectory.completionsConsidered >= 3;
    const languageKey =
        inclusion.locale === "ar"
            ? "language.arabic"
            : "language.english";
    const screeningKey =
        FOCUS_KEYS[equityLens.screeningFocus] ??
        "ecosystem.screeningNone";
    const contextSourceKey =
        equityLens.contextSource === "sahatna_malaffi_demo"
            ? "outcomes.equity.sourceDemo"
            : "outcomes.equity.sourceManual";
    const lastActiveText = !retention.lastCompletedAt
        ? t("outcomes.retention.noActivity")
        : retention.daysSinceLastComplete === 0
          ? t("outcomes.retention.lastActiveToday")
          : t("outcomes.retention.lastActive", {
                count: retention.daysSinceLastComplete,
            });
    const retentionValue = retention.activeDays
        ? t("outcomes.retention.value", {
              active: retention.activeDays,
              elapsed: retention.elapsedDays,
          })
        : t("outcomes.retention.empty");
    const day7Status =
        retention.elapsedDays < 7
            ? t("outcomes.retention.notReached")
            : retention.retained7
              ? t("outcomes.retention.kept")
              : t("outcomes.retention.notKept");
    const day28Status =
        retention.elapsedDays < 28
            ? t("outcomes.retention.notReached")
            : retention.retained28
              ? t("outcomes.retention.kept")
              : t("outcomes.retention.notKept");
    const activeRealmLabels = persistence.activeRealms
        .map((realm) => t(`world.realm.${realm}`))
        .join(", ");
    const realmSteps = Object.entries(behaviour.byRealm ?? {})
        .filter(([, stats]) => stats.completed > 0)
        .map(([realm, stats]) =>
            t("outcomes.behaviour.realmItem", {
                realm: t(`world.realm.${realm}`),
                count: stats.completed,
            })
        )
        .join(" · ");

    return (
        <section
            className="world-outcomes"
            aria-labelledby="world-outcomes-title"
        >
            <header className="world-outcomes__head">
                <div>
                    <p className="eyebrow">{t("outcomes.eyebrow")}</p>
                    <h2 id="world-outcomes-title">{t("outcomes.title")}</h2>
                </div>
                <span className="world-outcomes__window">
                    {t(
                        WINDOW_KEYS[persistence.sustainedWindowLabel] ??
                            WINDOW_KEYS.starting
                    )}
                </span>
            </header>

            <div className="world-outcomes__grid">
                <Tile
                    icon={HeartPulse}
                    title={t("outcomes.persistence.title")}
                >
                    <p className="world-outcomes__value">
                        <bdi>
                            {t("outcomes.persistence.value", {
                                rate: persistence.completionRate,
                            })}
                        </bdi>
                    </p>
                    <p className="world-outcomes__meta">
                        {persistence.eligibleMoments
                            ? t("outcomes.persistence.meta", {
                                  completed: persistence.completedMoments,
                                  eligible: persistence.eligibleMoments,
                              })
                            : t("outcomes.persistence.empty")}
                    </p>
                    <p className="world-outcomes__detail">
                        {t("outcomes.persistence.realms", {
                            count: persistence.activeRealms.length,
                        })}
                    </p>
                </Tile>

                <Tile
                    icon={ShieldCheck}
                    title={t("outcomes.resilience.title")}
                >
                    <p className="world-outcomes__value">
                        {t("outcomes.resilience.value", {
                            score: resilience.score,
                        })}
                    </p>
                    <p className="world-outcomes__meta">
                        {t("outcomes.resilience.meta", {
                            bounceBacks: resilience.bounceBacks,
                            saves: resilience.doseShrinkSaves,
                        })}
                    </p>
                    <p className="world-outcomes__detail">
                        {resilience.safetyPauses
                            ? t("outcomes.resilience.pauses", {
                                  count: resilience.safetyPauses,
                              })
                            : t("outcomes.resilience.noPauses")}
                    </p>
                </Tile>

                <Tile
                    icon={TrendingUp}
                    title={t("outcomes.trajectory.title")}
                >
                    {trajectory.hasContext ? (
                        <>
                            {focusKey && (
                                <span className="world-outcomes__badge">
                                    {t("outcomes.trajectory.focus", {
                                        focus: t(focusKey),
                                    })}
                                </span>
                            )}
                            <p className="world-outcomes__value">
                                <bdi>
                                    {hasTrajectoryShift
                                        ? t("outcomes.trajectory.shift", {
                                              baseline: formatSigned(
                                                  trajectory.baselineHealthAgeDelta
                                              ),
                                              projected: formatSigned(
                                                  trajectory.projectedHealthAgeDelta
                                              ),
                                          })
                                        : t("outcomes.trajectory.baseline", {
                                              delta: formatSigned(
                                                  trajectory.baselineHealthAgeDelta
                                              ),
                                          })}
                                </bdi>
                            </p>
                            <p className="world-outcomes__meta">
                                {hasTrajectoryShift
                                    ? t("outcomes.trajectory.modelled", {
                                          shift: Math.abs(
                                              trajectory.projectedDeltaShift
                                          ).toFixed(1),
                                      })
                                    : t(
                                          "outcomes.trajectory.insufficient"
                                      )}
                            </p>
                            <p className="world-outcomes__detail">
                                {t(trajectory.biomarkerNoteKey)}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="world-outcomes__value world-outcomes__value--muted">
                                {t("outcomes.trajectory.noContextValue")}
                            </p>
                            <p className="world-outcomes__meta">
                                {t("outcomes.trajectory.connect")}
                            </p>
                        </>
                    )}
                </Tile>
            </div>

            <div className="world-outcomes__signals">
                <Signal
                    icon={CalendarCheck}
                    title={t("outcomes.retention.title")}
                >
                    <p className="world-outcomes__signal-value">
                        {retentionValue}
                    </p>
                    <p className="world-outcomes__signal-meta">
                        {lastActiveText}
                    </p>
                    <p className="world-outcomes__signal-detail">
                        {t("outcomes.retention.windows", {
                            day7: day7Status,
                            day28: day28Status,
                        })}
                    </p>
                    <p className="world-outcomes__signal-detail">
                        {t("outcomes.retention.recent", {
                            last7: retention.activeLast7,
                            last28: retention.activeLast28,
                        })}
                    </p>
                    <p className="world-outcomes__signal-detail">
                        {t("outcomes.retention.returns", {
                            count: retention.returnCount,
                        })}
                    </p>
                </Signal>

                <Signal
                    icon={Activity}
                    title={t("outcomes.behaviour.title")}
                >
                    <p className="world-outcomes__signal-value">
                        {t("outcomes.behaviour.value", {
                            minutes: behaviour.movementMinutes,
                        })}
                    </p>
                    <p className="world-outcomes__signal-meta">
                        {t("outcomes.behaviour.meta", {
                            completed: behaviour.completedMoments,
                            realms: persistence.activeRealms.length,
                        })}
                    </p>
                    <p className="world-outcomes__signal-detail">
                        {behaviour.activityCount
                            ? t("outcomes.behaviour.synced", {
                                  count: behaviour.activityCount,
                                  minutes: behaviour.activityMinutes,
                              })
                            : activeRealmLabels ||
                              t("outcomes.behaviour.planOnly")}
                    </p>
                    <p className="world-outcomes__signal-detail">
                        {realmSteps || t("outcomes.behaviour.noRealmSteps")}
                    </p>
                </Signal>

                <Signal
                    icon={Globe2}
                    title={t("outcomes.equity.title")}
                >
                    <p className="world-outcomes__signal-value">
                        {t("outcomes.equity.value", {
                            language: t(languageKey),
                            accommodations:
                                accommodationLabels ||
                                t("outcomes.equity.noneShort"),
                        })}
                    </p>
                    <p className="world-outcomes__signal-meta">
                        {t("outcomes.equity.meta", {
                            focus: t(screeningKey),
                            source: t(contextSourceKey),
                        })}
                    </p>
                    <p className="world-outcomes__signal-detail">
                        {t(equityLens.noteKey)}
                    </p>
                </Signal>
            </div>

            <LearningInsight learning={learning} />

            <p className="world-outcomes__disclaimer">
                {t(trajectory.disclaimerKey)}
            </p>

            <details className="world-outcomes__methods">
                <summary>{t("outcomes.methods.summary")}</summary>
                <ul>
                    <li>{t("outcomes.methods.persistence")}</li>
                    <li>{t("outcomes.methods.retention")}</li>
                    <li>{t("outcomes.methods.behaviour")}</li>
                    <li>{t("outcomes.methods.resilience")}</li>
                    <li>{t("outcomes.methods.trajectory")}</li>
                    <li>{t("outcomes.methods.inclusion")}</li>
                    <li>{t("outcomes.methods.equity")}</li>
                </ul>
                <p className="world-outcomes__inclusion">
                    {t("outcomes.inclusion.privacy")}
                    {" · "}
                    {inclusion.syncEnabled
                        ? t("outcomes.inclusion.syncOn")
                        : t("outcomes.inclusion.syncOff")}
                    {accommodationLabels && (
                        <>
                            {" · "}
                            {t("outcomes.inclusion.adaptations", {
                                list: accommodationLabels,
                            })}
                        </>
                    )}
                </p>
            </details>
        </section>
    );
}

export default OutcomesPanel;
