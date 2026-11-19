import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Apple,
    BarChart3,
    Bell,
    Check,
    Clock,
    Footprints,
    MapPin,
    Moon,
    PauseCircle,
    Plus,
    Settings,
    ShieldAlert,
    Sprout,
    Sunrise,
    Wind,
} from "lucide-react";

import CompanionPair from "../companion/CompanionPair";
import SkyScene from "./SkyScene";
import UserMenu from "../ui/UserMenu";
import CheckInSheet from "./CheckInSheet";
import AutonomySheet from "./AutonomySheet";
import CelebrationBurst from "./CelebrationBurst";
import MeasurementSheet from "./MeasurementSheet";
import ReadinessSheet from "./ReadinessSheet";
import DemoClockSheet from "./DemoClockSheet";
import ArrivalDeck from "./ArrivalDeck";
import NudgeBanner from "./NudgeBanner";
import WhySheet from "./WhySheet";
import ExerciseMedia from "./ExerciseMedia";
import LanguageSwitch from "../ui/LanguageSwitch";
import { getExerciseContent } from "../../content/exercises";
import { useI18n } from "../../i18n";
import {
    addSecondaryGoal,
    applyEcosystemContext,
    applyProgressionDecision,
    applyReadiness,
    applyReturn,
    completeSlot,
    getActionableDay,
    getActionableDayIndex,
    getCompletedEntries,
    getDayResolution,
    getLapseInfo,
    getOptionalActionableStep,
    getPlanProgress,
    isDayResolved,
    getPlannedEntries,
    getProgressionStep,
    shrinkSlot,
    restSlot,
    undoRest,
} from "../../services/planEngine";
import {
    loadEcosystemContext,
    normalizeEcosystemContext,
    saveEcosystemContext,
} from "../../services/ecosystemStore";
import {
    isBackendJourneyEnabled,
    isBackendProgressionEnabled,
} from "../../services/config";
import { createIdempotencyKey } from "../../services/journeySync";
import { applyWeeklyPersonalisation } from "../../services/personalisation";
import { playCompletionChime } from "../../services/celebrationSound";
import { getMeasurement } from "../../services/measurement";
import { getOutcomeMetrics } from "../../services/outcomeMetrics";
import {
    SHIFT_MODES,
    getSchedulePreset,
    resolveJourneySchedule,
} from "../../services/realmSchedule";
import { getDemoClock } from "../../services/demoClock";
import {
    getMoodEntry,
    getMoodOption,
    saveMoodEntry,
} from "../../services/moodStore";
import {
    isArrivalDone,
    saveArrivalEntry,
} from "../../services/arrivalStore";
import { useNudgeScheduler } from "../../hooks/useNudgeScheduler";
import {
    REENGAGEMENT_STATES,
    getReengagementState,
    isReminderState,
} from "../../services/reengagement";
import {
    REMINDER_CHANNELS,
    getNotificationSupport,
    getReminderDecision,
    loadReminderState,
    saveReminderState,
    sendBrowserNotification,
} from "../../services/reminderService";
import { getWorldGrowth } from "../../game/world";
import {
    createWalkingActivity,
    getUserActivities,
} from "../../services/activityApi";
import { summarizeActivities } from "../../services/worldAdapter";
import { exportJourney } from "../../services/planStore";
import { AVAILABLE_GOALS } from "../../data/goals";
import { toDateKey } from "../../utils/date";
import "./WorldPage.css";

const DOMAIN_GROWTH_KEYS = {
    movement: "world.growth.movement",
    sleep: "world.growth.sleep",
    nutrition: "world.growth.nutrition",
    smoking: "world.growth.smoking",
};

const DOMAIN_DOT_TONE = {
    movement: "moss",
    sleep: "dusk",
    nutrition: "honey",
    smoking: "moss",
};

const READINESS_TIME_KEYS = {
    2: "readiness.time.two",
    5: "readiness.time.five",
    10: "readiness.time.ten",
};

function getRealmStats(plan, goalId) {
    const entries = getPlannedEntries(plan).filter(
        (entry) => entry.domain === goalId
    );
    const completed = entries.filter((entry) => entry.status === "completed");
    return {
        completed: completed.length,
        total: entries.length,
        percent: entries.length
            ? Math.round((completed.length / entries.length) * 100)
            : 0,
    };
}

function ActionCard({
    entry,
    isOptional = false,
    optionalDayNumber = null,
    onComplete,
    onSmaller,
    onWhy,
}) {
    const { t, locale } = useI18n();
    const content = getExerciseContent(entry, locale);
    const completed = entry.status === "completed";
    const paused = entry.status === "paused";
    const domainLabel =
        t(`world.realm.${entry.domain}`) || t("world.yourWorld");
    const progression = getProgressionStep(entry);

    return (
        <article
            className={`card action-card action-card--${entry.domain} ${completed ? "action-card--complete" : ""}`}
        >
            <ExerciseMedia
                entry={entry}
                variant="banner"
                className="action-card__media"
            />

            <header className="action-card__head">
                <span className={`realm-chip realm-chip--${entry.domain}`}>
                    {domainLabel}
                </span>
                <div className="action-card__tags">
                    {entry.adaptationTag && (
                        <span
                            className={`context-chip context-chip--${entry.adaptationTag}`}
                        >
                            {t(`ecosystem.tag.${entry.adaptationTag}`)}
                        </span>
                    )}
                    {progression && (
                        <span className="level-chip">
                            {t("world.level", {
                                level: progression.current.level,
                            })}
                            {progression.current.name
                                ? ` · ${progression.current.name}`
                                : ""}
                        </span>
                    )}
                </div>
            </header>

            <div className="action-card__title-row">
                <div>
                    <p className="quest-label">
                        {isOptional
                            ? optionalDayNumber
                                ? t("world.optionalDay", {
                                    day: optionalDayNumber,
                                })
                                : t("world.optionalDailyQuest")
                            : t("world.dailyQuest")}
                    </p>
                    <h2>{content.title}</h2>
                </div>
                <span className="action-card__duration">
                    <Clock size={18} aria-hidden="true" />
                    {entry.durationLabel}
                </span>
            </div>
            <p className="action-card__text">{content.text}</p>

            <div className="action-card__meta">
                <span>{content.anchor}</span>
                {entry.adapted && (
                    <span className="gentle-chip">{t("world.gentler")}</span>
                )}
            </div>

            {completed && (
                <div className="action-card__done" role="status">
                    <Check size={17} aria-hidden="true" />
                    <span>
                        <strong>{t("world.questComplete")}</strong>{" "}
                        {t("world.keptToday")}
                    </span>
                </div>
            )}

            {paused && (
                <div className="action-card__paused" role="status">
                    <ShieldAlert size={17} aria-hidden="true" />
                    {t("world.pausedSafety")}
                </div>
            )}

            {!completed && !paused && (
                <div className="action-card__actions">
                    <button className="btn btn--primary" type="button" onClick={onComplete}>
                        <Check size={17} aria-hidden="true" />
                        {t("world.iDidIt")}
                    </button>
                    <button className="btn btn--secondary" type="button" onClick={onSmaller}>
                        {t("world.somethingSmaller")}
                    </button>
                    <button
                        className="btn btn--ghost"
                        type="button"
                        onClick={() => onWhy(content)}
                    >
                        {t("world.whyThis")}
                    </button>
                </div>
            )}

            {(completed || paused) && (
                <button
                    className="text-button"
                    type="button"
                    onClick={() => onWhy(content)}
                >
                    {t("world.whyThisStep")}
                </button>
            )}
        </article>
    );
}

function WelcomeBack({ lapse, onReturn }) {
    const { t } = useI18n();
    const days = lapse.daysSinceLastComplete;
    const copy =
        days > 0
            ? t("world.welcomeBack.days", { count: days })
            : t("world.welcomeBack.gentle");

    return (
        <article className="welcome-back">
            <span className="welcome-back__icon" aria-hidden="true">
                <Sunrise size={20} />
            </span>
            <div>
                <p className="eyebrow">{t("world.welcomeBack.eyebrow")}</p>
                <h2>{t("world.welcomeBack.title")}</h2>
                <p>{copy}</p>
                <button className="btn btn--primary" type="button" onClick={onReturn}>
                    {t("world.welcomeBack.action")}
                </button>
            </div>
        </article>
    );
}

function PausedCard({ onResume }) {
    const { t } = useI18n();

    return (
        <article className="card paused-card">
            <span className="paused-card__icon" aria-hidden="true">
                <PauseCircle size={22} />
            </span>
            <div>
                <p className="eyebrow">{t("world.paused.eyebrow")}</p>
                <h2>{t("world.paused.title")}</h2>
                <p>{t("world.paused.body")}</p>
                <button className="btn btn--primary" type="button" onClick={onResume}>
                    {t("world.paused.resume")}
                </button>
            </div>
        </article>
    );
}

function GentleStepCard({ lapse, onSmaller }) {
    const { t } = useI18n();

    return (
        <article className="welcome-back welcome-back--slipping">
            <span className="welcome-back__icon" aria-hidden="true">
                <Footprints size={20} />
            </span>
            <div>
                <p className="eyebrow">
                    {t("world.reengagement.slipping.eyebrow")}
                </p>
                <h2>{t("world.reengagement.slipping.title")}</h2>
                <p>{t("world.reengagement.slipping.body")}</p>
                {lapse.daysSinceLastComplete > 0 && (
                    <p className="welcome-back__meta">
                        {t("world.reengagement.slipping.days", {
                            count: lapse.daysSinceLastComplete,
                        })}
                    </p>
                )}
                <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={onSmaller}
                >
                    {t("world.reengagement.slipping.action")}
                </button>
            </div>
        </article>
    );
}

function ReminderBanner({ state, onDismiss }) {
    const { t } = useI18n();
    const bodyKey =
        state === REENGAGEMENT_STATES.LAPSED
            ? "world.reminder.lapsedBody"
            : "world.reminder.slippingBody";

    return (
        <article className="reminder-banner" role="status">
            <span className="reminder-banner__icon" aria-hidden="true">
                <Bell size={18} />
            </span>
            <div>
                <strong>{t("world.reminder.title")}</strong>
                <p>{t(bodyKey)}</p>
            </div>
            <button
                className="text-button"
                type="button"
                onClick={onDismiss}
            >
                {t("world.reminder.dismiss")}
            </button>
        </article>
    );
}

function AddFocusCard({ goal, onAdd }) {
    const { t } = useI18n();

    if (!goal) return null;

    const goalName = t(`goals.${goal.id}.name`);

    return (
        <article className="card add-focus">
            <span className="add-focus__icon" aria-hidden="true">
                <Plus size={19} />
            </span>
            <div>
                <p className="eyebrow">{t("world.addFocus.eyebrow")}</p>
                <h2>{t("world.addFocus.title")}</h2>
                <p>
                    {t("world.addFocus.body", {
                        goal: goalName.toLowerCase(),
                    })}
                </p>
                <button className="btn btn--secondary" type="button" onClick={() => onAdd(goal.id)}>
                    {t("world.addFocus.action", { goal: goalName })}
                </button>
            </div>
        </article>
    );
}

function RealmPanel({ plan }) {
    const { t } = useI18n();
    const movement = getRealmStats(plan, "movement");
    const sleep = getRealmStats(plan, "sleep");
    const nutrition = getRealmStats(plan, "nutrition");
    const smoking = getRealmStats(plan, "smoking");
    const realms = [
        {
            id: "movement",
            icon: Footprints,
            stats: movement,
        },
        {
            id: "sleep",
            icon: Moon,
            stats: sleep,
        },
        {
            id: "nutrition",
            icon: Apple,
            stats: nutrition,
        },
        {
            id: "smoking",
            icon: Wind,
            stats: smoking,
        },
    ];

    return (
        <section className="card realm-panel">
            <header className="card__head">
                <div>
                    <p className="eyebrow">{t("world.realms.eyebrow")}</p>
                    <h2>{t("world.realms.title")}</h2>
                </div>
            </header>

            <ul className="realm-list">
                {realms.map((realm) => {
                    const Icon = realm.icon;
                    const isPrimary = plan.primaryGoalId === realm.id;
                    const isSecondary = plan.secondaryGoalId === realm.id;
                    const active = isPrimary || isSecondary;

                    return (
                        <li
                            className={`realm-row realm-row--${realm.id} ${active ? "" : "realm-row--quiet"}`}
                            key={realm.id}
                        >
                            <span className="realm-row__icon" aria-hidden="true">
                                <Icon size={17} />
                            </span>
                            <span className="realm-row__text">
                                <strong>
                                    {t(`world.realm.${realm.id}`)}
                                    {isPrimary && (
                                        <span className="realm-tag">
                                            {t("world.realms.primary")}
                                        </span>
                                    )}
                                    {isSecondary && (
                                        <span className="realm-tag">
                                            {t("world.realms.second")}
                                        </span>
                                    )}
                                </strong>
                                <span>{t(`goals.${realm.id}.realm`)}</span>
                            </span>
                            <span className="realm-row__level">
                                {realm.stats.total
                                    ? `${realm.stats.completed}/${realm.stats.total}`
                                    : t("world.realms.notActive")}
                            </span>
                            <span className="realm-row__bar" aria-hidden="true">
                                <span style={{ width: `${realm.stats.percent}%` }} />
                            </span>
                        </li>
                    );
                })}
            </ul>

            <p className="realm-panel__note">{t("world.realms.note")}</p>
        </section>
    );
}

function GrowthFeed({ plan }) {
    const { t } = useI18n();
    const completed = getCompletedEntries(plan);
    const recent = [...completed].reverse().slice(0, 3);
    const returned = plan.adaptations.some(
        (adaptation) => adaptation.type === "return"
    );
    const smaller = plan.adaptations.some(
        (adaptation) => adaptation.type === "smaller"
    );

    return (
        <section className="card growth-card">
            <p className="eyebrow">{t("world.growthFeed.eyebrow")}</p>
            <h2>{t("world.growthFeed.title")}</h2>

            {recent.length === 0 && !returned && !smaller && (
                <p className="growth-empty">{t("world.game.empty")}</p>
            )}

            <ul className="growth-list">
                {returned && (
                    <li>
                        <span className="growth-list__dot growth-list__dot--moss" />
                        {t("world.growthFeed.returned")}
                    </li>
                )}
                {smaller && (
                    <li>
                        <span className="growth-list__dot growth-list__dot--honey" />
                        {t("world.growthFeed.smaller")}
                    </li>
                )}
                {recent.map((entry) => (
                    <li key={`${entry.id}-${entry.completedAt}`}>
                        <span
                            className={`growth-list__dot growth-list__dot--${DOMAIN_DOT_TONE[entry.domain] ?? "dusk"}`}
                        />
                        {t(
                            DOMAIN_GROWTH_KEYS[entry.domain] ??
                            "world.growth.generic"
                        )}
                    </li>
                ))}
            </ul>

            <p className="growth-card__note">{t("world.growthFeed.note")}</p>
        </section>
    );
}

function WorldPage({
    journey,
    user,
    token,
    onJourneyChange,
    onCompleteJourney,
    syncNotice,
    onReset,
    onOpenAdventure,
    onLogout,
}) {
    const { t, locale } = useI18n();
    const plan = journey.plan;
    const profile = journey.profile;
    const preferences = journey.preferences ?? {};
    const todayKey = String(toDateKey());
    const currentDay = getActionableDay(plan);
    const optionalStep = getOptionalActionableStep(plan);
    const primaryDayIndex = getActionableDayIndex(plan);
    const currentDayIndex = currentDay
        ? primaryDayIndex
        : optionalStep?.index ?? -1;
    const activeDay = currentDay ?? optionalStep?.day ?? null;
    const dayResolution = getDayResolution(activeDay);
    const lapse = getLapseInfo(plan, todayKey);
    const reengagement = getReengagementState(plan, todayKey);
    const reminderSupport = getNotificationSupport();

    // 👉 MOVED readinessTargetEntry HERE so hooks can read it
    const readinessTargetEntry = !plan.safetyPause
        ? currentDay?.primary?.status === "planned"
            ? {
                dayId: currentDay.id,
                slot: "primary",
                entry: currentDay.primary,
            }
            : optionalStep?.entry?.status === "planned"
                ? {
                    dayId: optionalStep.day.id,
                    slot: "secondary",
                    entry: optionalStep.entry,
                }
                : null
        : null;

    // 👉 ALL STATE HOOKS GROUPED AT THE TOP
    const [activities, setActivities] = useState([]);
    const [activityState, setActivityState] = useState("loading");
    const [checkin, setCheckin] = useState(null);
    const [readinessTarget, setReadinessTarget] = useState(null);
    const [sheet, setSheet] = useState(() =>
        user?.user_id && !isArrivalDone(user.user_id, todayKey)
            ? "mood"
            : null
    );
    const [whyEntry, setWhyEntry] = useState(null);
    const [celebration, setCelebration] = useState(false);
    const [danceVariant, setDanceVariant] = useState(0);
    const [notice, setNotice] = useState("");
    const [dismissedReminderState, setDismissedReminderState] = useState(null);
    const [ecosystemContext, setEcosystemContext] = useState(() => {
        const stored = user?.user_id
            ? loadEcosystemContext(user.user_id)
            : null;

        if (stored?.updatedAt) return stored;

        return (
            plan.ecosystemContext ??
            stored ??
            loadEcosystemContext()
        );
    });

    const reminderDecision = useMemo(
        () =>
            getReminderDecision({
                preferences: preferences.reminders,
                state: reengagement.state,
                lastSentAt: loadReminderState(user?.user_id)
                    .lastSentAt,
                permission: reminderSupport.permission,
                supported: reminderSupport.supported,
            }),
        [
            preferences.reminders,
            reengagement.state,
            user?.user_id,
            reminderSupport.permission,
            reminderSupport.supported,
        ]
    );

    const planProgress = getPlanProgress(plan);
    const schedule = useMemo(
        () =>
            resolveJourneySchedule(journey, {
                shiftWorker:
                    ecosystemContext.contextFlags.shiftWorker,
            }),
        [journey, ecosystemContext]
    );
    const nudgesEnabled = preferences.nudges?.enabled === true;
    const {
        nudge,
        dismiss: dismissNudge,
        snooze: snoozeNudge,
    } = useNudgeScheduler({
        userId: user?.user_id,
        plan,
        schedule,
        enabled: nudgesEnabled,
    });
    const demoClock = getDemoClock();
    const moodToday = getMoodEntry(user?.user_id, todayKey);
    const moodOption = moodToday
        ? getMoodOption(moodToday.mood)
        : null;
    const worldGrowth = useMemo(() => getWorldGrowth(plan), [plan]);
    const suggestedSecond = AVAILABLE_GOALS.find(
        (goal) =>
            goal &&
            goal.id !== plan.primaryGoalId &&
            goal.id !== plan.secondaryGoalId
    );

    const realmLabel = plan.primaryGoalId
        ? t(`goals.${plan.primaryGoalId}.realm`)
        : t("world.yourWorld");
    const primaryGoalName = plan.primaryGoalId
        ? t(`goals.${plan.primaryGoalId}.name`)
        : t("world.growingGently");
    const secondaryGoalName = plan.secondaryGoalId
        ? t(`goals.${plan.secondaryGoalId}.name`)
        : null;

    const outcomeMetrics = useMemo(
        () =>
            getOutcomeMetrics(plan, ecosystemContext, {
                locale,
                todayKey,
                activities,
            }),
        [plan, ecosystemContext, locale, todayKey, activities]
    );

    const activitySummary = useMemo(
        () => summarizeActivities(activities, todayKey),
        [activities, todayKey]
    );
    const measurement = useMemo(
        () => getMeasurement(plan, activities),
        [plan, activities]
    );

    const loadActivities = useCallback(async () => {
        try {
            const data = await getUserActivities();
            setActivities(data);
            setActivityState("ready");
        } catch {
            setActivityState("error");
        }
    }, []);

    const retryActivities = () => {
        setActivityState("loading");
        loadActivities();
    };

    // 👉 ALL EFFECTS GROUPED HERE
    useEffect(() => {
        let active = true;

        getUserActivities()
            .then((data) => {
                if (!active) return;
                setActivities(data);
                setActivityState("ready");
            })
            .catch(() => {
                if (!active) return;
                setActivityState("error");
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!celebration) return undefined;
        const timeout = window.setTimeout(() => setCelebration(false), 3200);
        return () => window.clearTimeout(timeout);
    }, [celebration]);

    useEffect(() => {
        if (!notice) return undefined;
        const timeout = window.setTimeout(() => setNotice(""), 5200);
        return () => window.clearTimeout(timeout);
    }, [notice]);

    useEffect(() => {
        if (!isReminderState(reengagement.state)) return;

        const support = getNotificationSupport();
        const stored = loadReminderState(user?.user_id);
        const decision = getReminderDecision({
            preferences: preferences.reminders,
            state: reengagement.state,
            lastSentAt: stored.lastSentAt,
            permission: support.permission,
            supported: support.supported,
        });

        if (!decision.shouldShow) return;

        if (decision.channel === REMINDER_CHANNELS.BROWSER) {
            sendBrowserNotification({
                title: t("world.reminder.title"),
                body: t(
                    reengagement.state ===
                        REENGAGEMENT_STATES.LAPSED
                        ? "world.reminder.lapsedBody"
                        : "world.reminder.slippingBody"
                ),
            });
        }

        saveReminderState(user?.user_id, {
            lastSentAt: new Date().toISOString(),
        });
    }, [
        reengagement.state,
        preferences.reminders,
        todayKey,
        t,
        user?.user_id,
    ]);

    const commitPlan = useCallback(
        (nextPlan, extra = {}, options = {}) => {
            onJourneyChange(
                {
                    ...journey,
                    ...extra,
                    plan: nextPlan,
                    updatedAt: new Date().toISOString(),
                },
                options
            );
        },
        [journey, onJourneyChange]
    );

    const celebrate = () => {
        setDanceVariant(Math.floor(Math.random() * 3));
        setCelebration(true);
    };

    const handleComplete = (dayId, slot) => {
        const day = plan.days.find((item) => item.id === dayId);

        if (!day?.[slot] || day[slot].status !== "planned") return;

        setCheckin({
            slot,
            entry: day[slot],
            dayId,
        });
    };

    const handleSaveCheckin = async (feedback) => {
        if (!checkin) return;
        const entry = checkin.entry;
        const safe = feedback.safety === "none";
        const useBackendJourney =
            isBackendJourneyEnabled() &&
            typeof onCompleteJourney === "function";
        const useBackendProgression =
            entry.source === "backend" &&
            Boolean(entry.progressionLevels?.length) &&
            safe &&
            isBackendProgressionEnabled();

        if (safe) {
            playCompletionChime({
                enabled: preferences.soundEnabled !== false,
            });
        }

        let nextPlan = completeSlot(
            plan,
            checkin.dayId,
            checkin.slot,
            feedback,
            {
                useBackendProgression:
                    useBackendJourney ||
                    useBackendProgression,
                deferProgression: useBackendJourney,
            }
        );

        if (useBackendJourney) {
            commitPlan(nextPlan, {}, { skipSync: true });
            setCheckin(null);
            if (safe) celebrate();

            onCompleteJourney({
                dayId: checkin.dayId,
                slot: checkin.slot,
                feedback,
                idempotencyKey: createIdempotencyKey(),
            })
                .then((result) => {
                    if (!result?.journey?.plan) return;

                    const personalisedPlan =
                        applyWeeklyPersonalisation(
                            result.journey.plan,
                            checkin.dayId,
                            checkin.slot
                        );

                    if (personalisedPlan === result.journey.plan) {
                        return;
                    }

                    onJourneyChange({
                        ...result.journey,
                        plan: personalisedPlan,
                        updatedAt: new Date().toISOString(),
                    });
                    setNotice(t("world.notice.personalised"));
                })
                .catch(() => { });
        } else {
            if (useBackendProgression) {
                try {
                    nextPlan = await applyProgressionDecision(
                        nextPlan,
                        checkin.dayId,
                        checkin.slot,
                        { useBackendProgression, token }
                    );
                } catch {
                    // Keep the completed step even if progression preview fails.
                }
            }

            const beforePersonalisation = nextPlan;
            nextPlan = applyWeeklyPersonalisation(
                nextPlan,
                checkin.dayId,
                checkin.slot
            );

            commitPlan(nextPlan);
            setCheckin(null);
            if (safe) celebrate();

            if (nextPlan !== beforePersonalisation) {
                setNotice(t("world.notice.personalised"));
            }
        }

        if (
            entry.domain === "movement" &&
            feedback.safety === "none"
        ) {
            try {
                const saved = await createWalkingActivity({
                    durationMinutes: entry.dose,
                    startedAt: new Date().toISOString(),
                });
                setActivities((previous) => [saved, ...previous]);
                setActivityState("ready");
            } catch {
                setNotice(t("world.notice.movementSync"));
            }
        }
    };

    const handleSmaller = (dayId, slot) => {
        const day = plan.days.find((item) => item.id === dayId);

        if (!day?.[slot]) return;

        const nextPlan = shrinkSlot(plan, dayId, slot);
        commitPlan(nextPlan);
        setNotice(t("world.notice.smaller"));
    };

    const handleOpenReadiness = (target) => {
        if (!target?.entry || target.entry.status !== "planned") return;
        setReadinessTarget(target);
    };

    const handleSaveReadiness = (readiness) => {
        if (!readinessTarget) return;

        const nextPlan = applyReadiness(
            plan,
            readinessTarget.dayId,
            readinessTarget.slot,
            readiness
        );

        if (nextPlan !== plan) {
            commitPlan(nextPlan);
        }
        setReadinessTarget(null);
        setNotice(t("readiness.notice"));
    };

    const handleApplyArrival = ({ mood, time, weather, readiness }) => {
        if (!user?.user_id) return;

        saveMoodEntry(user.user_id, mood);

        const target = readinessTargetEntry;
        let beforeDose = null;
        let afterDose = null;

        if (target) {
            beforeDose = target.entry?.dose ?? null;

            const nextPlan = applyReadiness(
                plan,
                target.dayId,
                target.slot,
                readiness
            );

            if (nextPlan !== plan) {
                commitPlan(nextPlan);
            }

            afterDose =
                nextPlan.days.find((day) => day.id === target.dayId)?.[
                    target.slot
                ]?.dose ?? beforeDose;
        }

        saveArrivalEntry(user.user_id, {
            mood,
            time,
            weather,
            applied: target
                ? {
                      dayId: target.dayId,
                      slot: target.slot,
                      beforeDose,
                      afterDose,
                  }
                : null,
        });

        setSheet(null);
        setNotice(
            t(target ? "arrival.notice" : "arrival.noticeNoStep")
        );
    };

    const handleSkipArrival = () => {
        saveArrivalEntry(user?.user_id, { skipped: true });
        setSheet(null);
    };

    const handleReturn = () => {
        const nextPlan = applyReturn(plan);
        commitPlan(nextPlan);
        celebrate();
        setNotice(t("world.notice.returned"));
    };

    const handleAddSecondary = (goalId) => {
        const nextPlan = addSecondaryGoal(plan, profile, goalId);
        const nextProfile = {
            ...profile,
            secondaryGoalId: goalId,
            goalIds: [profile.primaryGoalId, goalId],
        };
        onJourneyChange({
            ...journey,
            profile: nextProfile,
            plan: nextPlan,
            updatedAt: new Date().toISOString(),
        });
        const goalName = goalId
            ? t(`goals.${goalId}.name`)
            : t("world.addFocus.title");
        setNotice(t("world.notice.addedSecondary", { name: goalName }));
    };

    const handleTogglePause = () => {
        commitPlan({ ...plan, paused: !plan.paused });
    };

    const handleTogglePreference = (key, value) => {
        onJourneyChange({
            ...journey,
            preferences: {
                ...preferences,
                [key]: value,
            },
        });
    };

    const handleToggleEcosystemFlag = (flag, value) => {
        const nextContext = normalizeEcosystemContext({
            ...ecosystemContext,
            source: "manual",
            updatedAt: null,
            contextFlags: {
                ...ecosystemContext.contextFlags,
                [flag]: value,
            },
        });
        const savedContext = saveEcosystemContext(
            user?.user_id,
            nextContext
        );

        setEcosystemContext(savedContext);
        commitPlan(
            applyEcosystemContext(plan, savedContext),
            flag === "shiftWorker"
                ? {
                    preferences: {
                        ...preferences,
                        schedule: getSchedulePreset(
                            value
                                ? SHIFT_MODES.NIGHT
                                : SHIFT_MODES.DAY
                        ),
                    },
                }
                : {}
        );
        setNotice(t("ecosystem.notice.updated"));
    };

    const handleReset = () => {
        onReset();
    };

    const dayNumber = currentDayIndex + 1;
    const dayTotal = plan.days.length;
    const carriedOver = Boolean(currentDay) && currentDay.date < todayKey;
    const previousDay =
        currentDayIndex > 0 ? plan.days[currentDayIndex - 1] : null;
    const previousDayCompletedAt =
        previousDay && isDayResolved(previousDay)
            ? [previousDay.primary, previousDay.secondary]
                .filter((entry) => entry?.completedAt)
                .map((entry) => entry.completedAt)
                .sort()
                .at(-1)
            : null;
    const justCompletedDay =
        Boolean(previousDayCompletedAt) &&
        toDateKey(previousDayCompletedAt) === todayKey;
    const dayFinished = dayResolution.complete || justCompletedDay;
    const dayNote = carriedOver ? t("world.dayNote") : "";
    const dayStatus =
        dayResolution.resolved > 0
            ? t("world.dayStatusDone", {
                resolved: dayResolution.resolved,
                total: dayResolution.total,
            })
            : t("world.dayStatusProgress");
    const questTitle =
        currentDay && optionalStep
            ? t("world.quest.two")
            : currentDay
                ? t("world.quest.one")
                : t("world.quest.optional");
    const optionalDayNumber =
        optionalStep && optionalStep.index !== currentDayIndex
            ? optionalStep.index + 1
            : null;

    const bubble = celebration
        ? t("world.bubble.celebration")
        : reengagement.state === REENGAGEMENT_STATES.LAPSED &&
            preferences.showReturnCard !== false
            ? t("world.bubble.return")
            : reengagement.state === REENGAGEMENT_STATES.SLIPPING
                ? t("world.bubble.slipping")
                : reengagement.state === REENGAGEMENT_STATES.PAUSED
                    ? t("world.bubble.paused")
                    : dayFinished
                        ? t("world.bubble.done")
                        : t("world.bubble.step");

    const heartExpression = celebration
        ? "happy"
        : dayFinished
            ? "happy"
            : "welcome";
    const mindExpression = celebration
        ? "happy"
        : isReminderState(reengagement.state)
            ? "thinking"
            : dayFinished
                ? "happy"
                : "welcome";

    return (
        <main className="world-page">
            <a className="skip-link" href="#world-today">
                {t("world.skip")}
            </a>

            <header className="world-topbar">
                <div className="world-brand">
                    <span className="world-brand__icon" aria-hidden="true">
                        <Sprout size={18} />
                    </span>
                    <span>{t("brand.name")}</span>
                </div>

                <div className="world-topbar__actions">
                    <span className={`realm-chip realm-chip--${plan.primaryGoalId}`}>
                        {realmLabel}
                    </span>
                    <button
                        className="village-entry"
                        type="button"
                        onClick={onOpenAdventure}
                        aria-label={t("world.home.openWorldAria")}
                    >
                        <MapPin size={16} aria-hidden="true" />
                        <span className="village-entry__label">
                            {t("world.game.title")}
                        </span>
                    </button>
                    <LanguageSwitch />
                    <button
                        className="icon-button"
                        type="button"
                        onClick={() => setSheet("demoClock")}
                        aria-label={
                            demoClock
                                ? t("demoClock.openActive", {
                                      time: demoClock.time,
                                  })
                                : t("demoClock.open")
                        }
                    >
                        <Clock size={18} aria-hidden="true" />
                    </button>
                    {demoClock && (
                        <span
                            className="demo-clock-badge"
                            title={t("demoClock.badge", {
                                time: demoClock.time,
                            })}
                        >
                            {demoClock.time}
                        </span>
                    )}
                    <button
                        className="icon-button"
                        type="button"
                        onClick={() => setSheet("measurement")}
                        aria-label={t("world.openProgress")}
                    >
                        <BarChart3 size={18} aria-hidden="true" />
                    </button>
                    <button
                        className="icon-button"
                        type="button"
                        onClick={() => setSheet("autonomy")}
                        aria-label={t("world.openSettings")}
                    >
                        <Settings size={18} aria-hidden="true" />
                    </button>
                    <UserMenu user={user} onLogout={onLogout} />
                </div>
            </header>

            <section
                className={`world-hero ${preferences.quietWorld ? "world-hero--quiet" : ""}`}
                aria-labelledby="world-title"
            >
                <SkyScene quiet={preferences.quietWorld} />
                <div className="world-hero__shade" aria-hidden="true" />
                <div className="world-hero__caption">
                    <p className="eyebrow">{t("world.eyebrow")}</p>
                    <h1 id="world-title">{realmLabel}</h1>
                    <p>
                        {primaryGoalName}
                        {secondaryGoalName
                            ? ` ${t("world.heroAlongside", {
                                name: secondaryGoalName,
                            })}`
                            : ""}
                    </p>
                </div>

                <div
                    className={`companion-stage ${celebration ? "companion-stage--celebrating" : ""}`}
                >
                    {celebration && (
                        <CelebrationBurst
                            quiet={preferences.quietWorld}
                            variant={danceVariant}
                        />
                    )}
                    <div
                        className={`companion-bubble ${celebration ? "companion-bubble--celebrate" : ""}`}
                        role="status"
                        aria-live="polite"
                    >
                        {bubble}
                    </div>
                    <CompanionPair
                        heartSize={164}
                        mindSize={164}
                        heartExpression={heartExpression}
                        mindExpression={mindExpression}
                        className={
                            celebration
                                ? `companion-pair--dancing companion-pair--dance-${danceVariant}`
                                : preferences.quietWorld
                                    ? ""
                                    : "companion-pair--floating"
                        }
                    />
                </div>
            </section>

            <div className="world-content">
                <section
                    id="world-today"
                    className="today"
                    aria-label={t("world.nextSteps")}
                >
                    {nudge &&
                        !checkin &&
                        !readinessTarget &&
                        !sheet && (
                            <NudgeBanner
                                nudge={nudge}
                                onOpen={() => {
                                    dismissNudge();
                                    const target =
                                        document.getElementById(
                                            "world-today"
                                        );
                                    target?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                    });
                                    target
                                        ?.querySelector(
                                            ".btn--primary"
                                        )
                                        ?.focus();
                                }}
                                onSnooze={snoozeNudge}
                            />
                        )}

                    {(notice || syncNotice) && (
                        <div className="inline-note" role="status">
                            <p>{notice || syncNotice}</p>
                        </div>
                    )}

                    {activityState === "error" && (
                        <div className="inline-note inline-note--warning">
                            <p>{t("world.activityError")}</p>
                            <button className="btn btn--ghost" type="button" onClick={retryActivities}>
                                {t("world.tryAgain")}
                            </button>
                        </div>
                    )}

                    {plan.safetyPause && (
                        <div className="inline-note inline-note--safety" role="status">
                            <ShieldAlert size={20} aria-hidden="true" />
                            <div>
                                <p>{plan.safetyMessage}</p>
                                <button
                                    className="btn btn--secondary"
                                    type="button"
                                    onClick={() =>
                                        commitPlan({
                                            ...plan,
                                            safetyPause: false,
                                            safetyMessage: null,
                                        })
                                    }
                                >
                                    {t("world.iUnderstand")}
                                </button>
                            </div>
                        </div>
                    )}

                    {moodOption ? (
                        <article className="mood-today" role="status">
                            <span
                                className="mood-today__emoji"
                                aria-hidden="true"
                            >
                                {moodOption.emoji}
                            </span>
                            <p>
                                {t("mood.summary", {
                                    mood: t(moodOption.labelKey),
                                })}
                            </p>
                            <button
                                className="text-button"
                                type="button"
                                onClick={() => setSheet("mood")}
                            >
                                {t("mood.change")}
                            </button>
                        </article>
                    ) : (
                        <article className="mood-prompt">
                            <span
                                className="mood-prompt__emoji"
                                aria-hidden="true"
                            >
                                🌤️
                            </span>
                            <div>
                                <p className="eyebrow">
                                    {t("mood.eyebrow")}
                                </p>
                                <strong>{t("mood.title")}</strong>
                                <p>{t("mood.prompt.body")}</p>
                            </div>
                            <button
                                className="btn btn--secondary"
                                type="button"
                                onClick={() => setSheet("mood")}
                            >
                                {t("mood.open")}
                            </button>
                        </article>
                    )}

                    {reengagement.state ===
                        REENGAGEMENT_STATES.PAUSED ? (
                        <PausedCard onResume={handleTogglePause} />
                    ) : (
                        <>
                            {reminderDecision.shouldShow &&
                                reminderDecision.channel ===
                                REMINDER_CHANNELS.IN_APP &&
                                dismissedReminderState !==
                                reengagement.state && (
                                    <ReminderBanner
                                        state={reengagement.state}
                                        onDismiss={() =>
                                            setDismissedReminderState(
                                                reengagement.state
                                            )
                                        }
                                    />
                                )}

                            {reengagement.state ===
                                REENGAGEMENT_STATES.LAPSED &&
                                preferences.showReturnCard !== false && (
                                    <WelcomeBack
                                        lapse={lapse}
                                        onReturn={handleReturn}
                                    />
                                )}

                            {reengagement.state ===
                                REENGAGEMENT_STATES.SLIPPING &&
                                reengagement.smallerStepOffered &&
                                preferences.showReturnCard !== false && (
                                    <GentleStepCard
                                        lapse={reengagement}
                                        onSmaller={() => {
                                            if (currentDay) {
                                                handleSmaller(
                                                    currentDay.id,
                                                    "primary"
                                                );
                                            } else if (optionalStep) {
                                                handleSmaller(
                                                    optionalStep.day.id,
                                                    "secondary"
                                                );
                                            }
                                        }}
                                    />
                                )}

                            {currentDay || optionalStep ? (
                                <>
                                    {justCompletedDay && (
                                        <div className="inline-note" role="status">
                                            <p>
                                                <strong>
                                                    {t("world.home.dayComplete", {
                                                        day: dayNumber - 1,
                                                    })}
                                                </strong>{" "}
                                                {t("world.keptToday")}
                                            </p>
                                        </div>
                                    )}

                                    {worldGrowth.total > 0 && (
                                        <div className="reward-ready" role="status">
                                            <div className="reward-ready__lead">
                                                <Sprout
                                                    size={18}
                                                    aria-hidden="true"
                                                />
                                                <p>
                                                    <strong>
                                                        {t(
                                                            "world.home.growthReady"
                                                        )}
                                                    </strong>{" "}
                                                    {worldGrowth.next
                                                        ? t(
                                                            "world.home.next",
                                                            {
                                                                moment: t(
                                                                    worldGrowth
                                                                        .next
                                                                        .momentKey
                                                                ),
                                                            }
                                                        )
                                                        : t(
                                                            "world.game.complete"
                                                        )}
                                                </p>
                                            </div>

                                            <div className="reward-ready__row">
                                                <span className="reward-ready__summary">
                                                    {t("world.game.steps", {
                                                        count: worldGrowth.total,
                                                    })}
                                                </span>
                                                <button
                                                    className="btn btn--primary"
                                                    type="button"
                                                    onClick={onOpenAdventure}
                                                >
                                                    <MapPin
                                                        size={16}
                                                        aria-hidden="true"
                                                    />
                                                    {t(
                                                        "world.home.openWorld"
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="quest-heading">
                                        <div>
                                            <p className="eyebrow">
                                                {currentDay
                                                    ? t("world.dayOf", {
                                                        day: dayNumber,
                                                        total: dayTotal,
                                                    })
                                                    : t("world.optionalDayOf", {
                                                        day: dayNumber,
                                                        total: dayTotal,
                                                    })}
                                            </p>
                                            <h2>{questTitle}</h2>
                                            {dayNote && (
                                                <p className="quest-heading__note">
                                                    {dayNote}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={`quest-status ${dayResolution.resolved > 0
                                                    ? "quest-status--done"
                                                    : ""
                                                }`}
                                        >
                                            {dayStatus}
                                        </span>
                                    </div>

                                    <div className="progress-strip">
                                        <span className="progress-strip__label">
                                            {t("world.momentsOf", {
                                                resolved: planProgress.resolved,
                                                total: planProgress.total,
                                            })}
                                        </span>
                                        <span
                                            className="progress-strip__track"
                                            role="progressbar"
                                            aria-label={t("world.momentsKeptAria", {
                                                resolved: planProgress.resolved,
                                                total: planProgress.total,
                                            })}
                                            aria-valuemin={0}
                                            aria-valuemax={planProgress.total}
                                            aria-valuenow={planProgress.resolved}
                                        >
                                            <span
                                                className="progress-strip__fill"
                                                style={{
                                                    width: `${planProgress.percent}%`,
                                                }}
                                            />
                                        </span>
                                        <span className="progress-strip__percent">
                                            {planProgress.percent}%
                                        </span>
                                    </div>

                                    {readinessTargetEntry &&
                                        (readinessTargetEntry.entry
                                            .readiness ? (
                                            <div
                                                className="readiness-summary"
                                                role="status"
                                            >
                                                <div>
                                                    <p className="eyebrow">
                                                        {t(
                                                            "readiness.summaryEyebrow"
                                                        )}
                                                    </p>
                                                    <p>
                                                        {t(
                                                            "readiness.summary",
                                                            {
                                                                energy: t(
                                                                    `readiness.energy.${readinessTargetEntry.entry.readiness.energy}.label`
                                                                ),
                                                                time: t(
                                                                    READINESS_TIME_KEYS[
                                                                    readinessTargetEntry
                                                                        .entry
                                                                        .readiness
                                                                        .time
                                                                    ]
                                                                ),
                                                                weather: t(
                                                                    `readiness.weather.${readinessTargetEntry.entry.readiness.weather}`
                                                                ),
                                                            }
                                                        )}
                                                    </p>
                                                </div>
                                                <button
                                                    className="text-button"
                                                    type="button"
                                                    onClick={() =>
                                                        handleOpenReadiness(
                                                            readinessTargetEntry
                                                        )
                                                    }
                                                >
                                                    {t("readiness.change")}
                                                </button>
                                            </div>
                                        ) : (
                                            <article className="readiness-prompt">
                                                <div>
                                                    <p className="eyebrow">
                                                        {t(
                                                            "readiness.promptEyebrow"
                                                        )}
                                                    </p>
                                                    <strong>
                                                        {t(
                                                            "readiness.promptTitle"
                                                        )}
                                                    </strong>
                                                    <p>
                                                        {t(
                                                            "readiness.promptBody"
                                                        )}
                                                    </p>
                                                </div>
                                                <button
                                                    className="btn btn--secondary"
                                                    type="button"
                                                    onClick={() =>
                                                        handleOpenReadiness(
                                                            readinessTargetEntry
                                                        )
                                                    }
                                                >
                                                    {t("readiness.open")}
                                                </button>
                                            </article>
                                        ))}

                                    {currentDay && (
                                        <ActionCard
                                            entry={currentDay.primary}
                                            onComplete={() =>
                                                handleComplete(
                                                    currentDay.id,
                                                    "primary"
                                                )
                                            }
                                            onSmaller={() =>
                                                handleSmaller(
                                                    currentDay.id,
                                                    "primary"
                                                )
                                            }
                                            onWhy={() =>
                                                setWhyEntry(currentDay.primary)
                                            }
                                        />
                                    )}

                                    {optionalStep && (
                                        <ActionCard
                                            entry={optionalStep.entry}
                                            isOptional
                                            optionalDayNumber={optionalDayNumber}
                                            onComplete={() =>
                                                handleComplete(
                                                    optionalStep.day.id,
                                                    "secondary"
                                                )
                                            }
                                            onSmaller={() =>
                                                handleSmaller(
                                                    optionalStep.day.id,
                                                    "secondary"
                                                )
                                            }
                                            onWhy={() =>
                                                setWhyEntry(optionalStep.entry)
                                            }
                                        />
                                    )}

                                    {currentDay &&
                                        !optionalStep &&
                                        !plan.secondaryGoalId && (
                                            <AddFocusCard
                                                goal={suggestedSecond}
                                                onAdd={handleAddSecondary}
                                            />
                                        )}
                                </>
                            ) : (
                                <article className="card plan-complete">
                                    <p className="eyebrow">
                                        {t("world.planComplete.eyebrow")}
                                    </p>
                                    <h2>{t("world.planComplete.title")}</h2>
                                    <p>{t("world.planComplete.body")}</p>
                                </article>
                            )}
                        </>
                    )}
                </section>

                <aside className="world-side" aria-label={t("world.progressAria")}>
                    <RealmPanel plan={plan} />
                    <GrowthFeed plan={plan} />
                </aside>
            </div>

            <footer className="world-footer">
                <p>{t("world.footer")}</p>
            </footer>

            {checkin && (
                <CheckInSheet
                    entry={checkin.entry}
                    onClose={() => setCheckin(null)}
                    onSave={handleSaveCheckin}
                />
            )}

            {readinessTarget && (
                <ReadinessSheet
                    entry={readinessTarget.entry}
                    initialReadiness={readinessTarget.entry.readiness}
                    onClose={() => setReadinessTarget(null)}
                    onSave={handleSaveReadiness}
                />
            )}

            {sheet === "demoClock" && (
                <DemoClockSheet onClose={() => setSheet(null)} />
            )}

            {sheet === "mood" && (
                <ArrivalDeck
                    initialMood={moodToday?.mood}
                    onClose={() => setSheet(null)}
                    onApply={handleApplyArrival}
                    onSkip={handleSkipArrival}
                />
            )}

            {sheet === "autonomy" && (
                <AutonomySheet
                    plan={plan}
                    preferences={preferences}
                    ecosystemContext={ecosystemContext}
                    outcomeMetrics={outcomeMetrics}
                    onToggleEcosystemFlag={handleToggleEcosystemFlag}
                    onTogglePreference={handleTogglePreference}
                    onPauseToggle={handleTogglePause}
                    onAddSecondary={handleAddSecondary}
                    onExport={(includeOutcomeMetrics) =>
                        exportJourney(
                            journey,
                            includeOutcomeMetrics
                                ? { outcomeMetrics }
                                : {}
                        )
                    }
                    onReset={handleReset}
                    onClose={() => setSheet(null)}
                />
            )}

            {sheet === "measurement" && (
                <MeasurementSheet
                    measurement={measurement}
                    activitySummary={activitySummary}
                    learning={outcomeMetrics.learning}
                    onClose={() => setSheet(null)}
                />
            )}

            {whyEntry && (
                <WhySheet entry={whyEntry} onClose={() => setWhyEntry(null)} />
            )}
        </main>
    );
}

export default WorldPage;