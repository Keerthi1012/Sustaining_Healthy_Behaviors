import { useState } from "react";
import {
    Download,
    PauseCircle,
    PlayCircle,
    Plus,
    RotateCcw,
    Trash2,
} from "lucide-react";
import Sheet from "../ui/Sheet";
import { AVAILABLE_GOALS } from "../../data/goals";
import { DEFAULT_ECOSYSTEM_CONTEXT } from "../../services/ecosystemStore";
import {
    REALM_DOMAINS,
    SHIFT_MODES,
    formatWindow,
    getSchedulePreset,
    normalizeSchedule,
} from "../../services/realmSchedule";
import {
    REMINDER_CADENCES,
    REMINDER_CHANNELS,
    getNotificationSupport,
    normalizeReminderPreferences,
    requestNotificationPermission,
} from "../../services/reminderService";
import { useI18n } from "../../i18n";

const ECOSYSTEM_FLAG_ROWS = [
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

const SHIFT_OPTION_KEYS = [
    { value: SHIFT_MODES.DAY, labelKey: "autonomy.nudges.shift.day" },
    {
        value: SHIFT_MODES.NIGHT,
        labelKey: "autonomy.nudges.shift.night",
    },
    {
        value: SHIFT_MODES.ROTATING,
        labelKey: "autonomy.nudges.shift.rotating",
    },
    {
        value: SHIFT_MODES.CUSTOM,
        labelKey: "autonomy.nudges.shift.custom",
    },
];

function ToggleRow({ label, description, checked, onChange }) {
    return (
        <label className="toggle-row">
            <span>
                <strong>{label}</strong>
                <span>{description}</span>
            </span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
            />
        </label>
    );
}

function AutonomySheet({
    plan,
    preferences,
    ecosystemContext = DEFAULT_ECOSYSTEM_CONTEXT,
    outcomeMetrics,
    onTogglePreference,
    onToggleEcosystemFlag,
    onPauseToggle,
    onAddSecondary,
    onExport,
    onReset,
    onClose,
}) {
    const { t } = useI18n();
    const [confirmReset, setConfirmReset] = useState(false);
    const [includeOutcomeMetrics, setIncludeOutcomeMetrics] =
        useState(true);
    const [notificationPermission, setNotificationPermission] =
        useState(() => getNotificationSupport().permission);
    const reminderPreferences = normalizeReminderPreferences(
        preferences.reminders
    );
    const updateReminders = (patch) =>
        onTogglePreference("reminders", {
            ...reminderPreferences,
            ...patch,
        });
    const schedule = normalizeSchedule(preferences.schedule);
    const nudges = {
        enabled: false,
        channel: "in_app",
        ...(preferences.nudges ?? {}),
    };
    const updateNudges = (patch) =>
        onTogglePreference("nudges", { ...nudges, ...patch });
    const updateSchedule = (patch) =>
        onTogglePreference(
            "schedule",
            normalizeSchedule({ ...schedule, ...patch })
        );
    const updateWindow = (domain, index, key, value) => {
        const windows = (schedule.windows[domain] ?? []).map(
            (window, windowIndex) =>
                windowIndex === index
                    ? { ...window, [key]: value }
                    : window
        );

        updateSchedule({
            windows: { ...schedule.windows, [domain]: windows },
        });
    };
    const addWindow = (domain) => {
        const windows = [...(schedule.windows[domain] ?? [])];

        if (windows.length >= 4) return;

        windows.push({ start: "12:00", end: "13:00" });
        updateSchedule({
            windows: { ...schedule.windows, [domain]: windows },
        });
    };
    const removeWindow = (domain, index) => {
        const windows = (schedule.windows[domain] ?? []).filter(
            (_, windowIndex) => windowIndex !== index
        );

        updateSchedule({
            windows: { ...schedule.windows, [domain]: windows },
        });
    };
    const changeShift = (mode) => {
        onTogglePreference("schedule", getSchedulePreset(mode));
    };
    const planRealmIds = [
        ...new Set(
            [plan.primaryGoalId, plan.secondaryGoalId].filter(Boolean)
        ),
    ];
    const realmIds = REALM_DOMAINS.filter((domain) =>
        planRealmIds.includes(domain)
    );
    const windowSummary = realmIds
        .map((domain) => {
            const windows = schedule.windows[domain] ?? [];

            if (!windows.length) return null;

            return `${t(`goals.${domain}.name`)} ${windows
                .map(formatWindow)
                .join(", ")}`;
        })
        .filter(Boolean)
        .join(" · ");
    const requestBrowserPermission = async () => {
        const permission = await requestNotificationPermission();
        setNotificationPermission(permission);
    };
    const primaryGoalName = plan.primaryGoalId
        ? t(`goals.${plan.primaryGoalId}.name`)
        : t("world.yourWorld");
    const secondaryGoalName = plan.secondaryGoalId
        ? t(`goals.${plan.secondaryGoalId}.name`)
        : null;
    const availableSecond = AVAILABLE_GOALS.filter(
        (goal) => goal.id !== plan.primaryGoalId && goal.id !== plan.secondaryGoalId
    );

    return (
        <Sheet
            title={t("autonomy.title")}
            eyebrow={t("autonomy.eyebrow")}
            onClose={onClose}
            footer={
                <button className="btn btn--secondary" type="button" onClick={onClose}>
                    {t("common.done")}
                </button>
            }
        >
            <section className="autonomy-section">
                <h3>{t("autonomy.focus.title")}</h3>
                <p>
                    {t("autonomy.focus.primary", { name: primaryGoalName })}
                    {secondaryGoalName
                        ? t("autonomy.focus.secondary", {
                              name: secondaryGoalName,
                          })
                        : t("autonomy.focus.addHint")}
                </p>

                {!plan.secondaryGoalId && availableSecond.length > 0 && (
                    <div className="autonomy-actions">
                        {availableSecond.map((goal) => (
                            <button
                                className="btn btn--ghost"
                                type="button"
                                key={goal.id}
                                onClick={() => onAddSecondary(goal.id)}
                            >
                                {t("world.addFocus.action", {
                                    goal: t(`goals.${goal.id}.name`),
                                })}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <section className="autonomy-section">
                <h3>{t("autonomy.support.title")}</h3>
                <ToggleRow
                    label={t("autonomy.showReturnCard.label")}
                    description={t("autonomy.showReturnCard.description")}
                    checked={preferences.showReturnCard !== false}
                    onChange={(value) => onTogglePreference("showReturnCard", value)}
                />
                <ToggleRow
                    label={t("autonomy.quietWorld.label")}
                    description={t("autonomy.quietWorld.description")}
                    checked={preferences.quietWorld === true}
                    onChange={(value) => onTogglePreference("quietWorld", value)}
                />
                <ToggleRow
                    label={t("autonomy.sound.label")}
                    description={t("autonomy.sound.description")}
                    checked={preferences.soundEnabled !== false}
                    onChange={(value) => onTogglePreference("soundEnabled", value)}
                />
            </section>

            <section className="autonomy-section">
                <h3>{t("autonomy.nudges.title")}</h3>
                <p>{t("autonomy.nudges.body")}</p>
                <ToggleRow
                    label={t("autonomy.nudges.enabled.label")}
                    description={t("autonomy.nudges.enabled.description")}
                    checked={nudges.enabled === true}
                    onChange={(value) =>
                        updateNudges({ enabled: value })
                    }
                />

                {nudges.enabled === true && (
                    <>
                        <div className="autonomy-fields">
                            <label className="autonomy-field">
                                <span>
                                    {t("autonomy.nudges.shift.label")}
                                </span>
                                <select
                                    value={schedule.mode}
                                    onChange={(event) =>
                                        changeShift(event.target.value)
                                    }
                                >
                                    {SHIFT_OPTION_KEYS.map((option) => (
                                        <option
                                            value={option.value}
                                            key={option.value}
                                        >
                                            {t(option.labelKey)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="autonomy-field">
                                <span>
                                    {t("autonomy.nudges.maxPerDay")}
                                </span>
                                <select
                                    value={schedule.maxPerDay}
                                    onChange={(event) =>
                                        updateSchedule({
                                            maxPerDay: Number(
                                                event.target.value
                                            ),
                                        })
                                    }
                                >
                                    {[1, 2, 3, 4].map((value) => (
                                        <option value={value} key={value}>
                                            {t(
                                                "autonomy.nudges.maxPerDayValue",
                                                { count: value }
                                            )}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {windowSummary && (
                            <p
                                className="autonomy-nudges__preview"
                                aria-live="polite"
                            >
                                {t("autonomy.nudges.preview", {
                                    summary: windowSummary,
                                })}
                            </p>
                        )}

                        {schedule.mode === SHIFT_MODES.ROTATING && (
                            <p className="autonomy-nudges__note">
                                {t("autonomy.nudges.rotatingNote")}
                            </p>
                        )}

                        <div className="autonomy-windows">
                            {realmIds.map((domain) => {
                                const realmName = t(
                                    `goals.${domain}.name`
                                );
                                const windows =
                                    schedule.windows[domain] ?? [];

                                return (
                                    <div
                                        className="autonomy-realm"
                                        key={domain}
                                    >
                                        <strong>{realmName}</strong>
                                        {windows.map((window, index) => (
                                            <div
                                                className="autonomy-window-row"
                                                key={`${domain}-${index}`}
                                            >
                                                <input
                                                    type="time"
                                                    aria-label={t(
                                                        "autonomy.nudges.startLabel",
                                                        {
                                                            realm: realmName,
                                                            index: index + 1,
                                                        }
                                                    )}
                                                    value={window.start}
                                                    onChange={(event) =>
                                                        updateWindow(
                                                            domain,
                                                            index,
                                                            "start",
                                                            event.target
                                                                .value
                                                        )
                                                    }
                                                />
                                                <span aria-hidden="true">
                                                    –
                                                </span>
                                                <input
                                                    type="time"
                                                    aria-label={t(
                                                        "autonomy.nudges.endLabel",
                                                        {
                                                            realm: realmName,
                                                            index: index + 1,
                                                        }
                                                    )}
                                                    value={window.end}
                                                    onChange={(event) =>
                                                        updateWindow(
                                                            domain,
                                                            index,
                                                            "end",
                                                            event.target
                                                                .value
                                                        )
                                                    }
                                                />
                                                <button
                                                    className="icon-button autonomy-window-row__remove"
                                                    type="button"
                                                    aria-label={t(
                                                        "autonomy.nudges.removeWindow",
                                                        {
                                                            realm: realmName,
                                                            index: index + 1,
                                                        }
                                                    )}
                                                    onClick={() =>
                                                        removeWindow(
                                                            domain,
                                                            index
                                                        )
                                                    }
                                                >
                                                    <Trash2
                                                        size={15}
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                        {windows.length < 4 && (
                                            <button
                                                className="btn btn--ghost"
                                                type="button"
                                                onClick={() =>
                                                    addWindow(domain)
                                                }
                                            >
                                                <Plus
                                                    size={15}
                                                    aria-hidden="true"
                                                />
                                                {t(
                                                    "autonomy.nudges.addWindow"
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {realmIds.length === 0 && (
                            <p className="autonomy-nudges__note">
                                {t("autonomy.nudges.noRealms")}
                            </p>
                        )}

                        <div className="autonomy-fields">
                            <label className="autonomy-field">
                                <span>
                                    {t("autonomy.nudges.busyStart")}
                                </span>
                                <input
                                    type="time"
                                    value={schedule.quietHours.start}
                                    onChange={(event) =>
                                        updateSchedule({
                                            quietHours: {
                                                ...schedule.quietHours,
                                                start: event.target.value,
                                            },
                                        })
                                    }
                                />
                            </label>
                            <label className="autonomy-field">
                                <span>
                                    {t("autonomy.nudges.busyEnd")}
                                </span>
                                <input
                                    type="time"
                                    value={schedule.quietHours.end}
                                    onChange={(event) =>
                                        updateSchedule({
                                            quietHours: {
                                                ...schedule.quietHours,
                                                end: event.target.value,
                                            },
                                        })
                                    }
                                />
                            </label>
                        </div>
                        <p className="autonomy-nudges__note">
                            {t("autonomy.nudges.busyNote")}
                        </p>
                    </>
                )}
            </section>

            <section className="autonomy-section">
                <h3>{t("autonomy.reminders.title")}</h3>
                <p>{t("autonomy.reminders.body")}</p>
                <ToggleRow
                    label={t("autonomy.reminders.enabled.label")}
                    description={t(
                        "autonomy.reminders.enabled.description"
                    )}
                    checked={reminderPreferences.enabled}
                    onChange={(value) =>
                        updateReminders({ enabled: value })
                    }
                />

                {reminderPreferences.enabled && (
                    <>
                        <div className="autonomy-fields">
                            <label className="autonomy-field">
                                <span>
                                    {t(
                                        "autonomy.reminders.cadence.label"
                                    )}
                                </span>
                                <select
                                    value={reminderPreferences.cadence}
                                    onChange={(event) =>
                                        updateReminders({
                                            cadence: event.target.value,
                                        })
                                    }
                                >
                                    <option
                                        value={REMINDER_CADENCES.DAILY}
                                    >
                                        {t(
                                            "autonomy.reminders.cadence.daily"
                                        )}
                                    </option>
                                    <option
                                        value={
                                            REMINDER_CADENCES.TWICE_DAILY
                                        }
                                    >
                                        {t(
                                            "autonomy.reminders.cadence.twiceDaily"
                                        )}
                                    </option>
                                </select>
                            </label>

                            <label className="autonomy-field">
                                <span>
                                    {t(
                                        "autonomy.reminders.channel.label"
                                    )}
                                </span>
                                <select
                                    value={reminderPreferences.channel}
                                    onChange={(event) =>
                                        updateReminders({
                                            channel: event.target.value,
                                        })
                                    }
                                >
                                    <option
                                        value={REMINDER_CHANNELS.IN_APP}
                                    >
                                        {t(
                                            "autonomy.reminders.channel.inApp"
                                        )}
                                    </option>
                                    <option
                                        value={REMINDER_CHANNELS.BROWSER}
                                    >
                                        {t(
                                            "autonomy.reminders.channel.browser"
                                        )}
                                    </option>
                                </select>
                            </label>
                        </div>

                        <div className="autonomy-fields">
                            <label className="autonomy-field">
                                <span>
                                    {t(
                                        "autonomy.reminders.quietStart"
                                    )}
                                </span>
                                <input
                                    type="time"
                                    value={
                                        reminderPreferences.quietHours
                                            .start
                                    }
                                    onChange={(event) =>
                                        updateReminders({
                                            quietHours: {
                                                ...reminderPreferences.quietHours,
                                                start: event.target.value,
                                            },
                                        })
                                    }
                                />
                            </label>

                            <label className="autonomy-field">
                                <span>
                                    {t("autonomy.reminders.quietEnd")}
                                </span>
                                <input
                                    type="time"
                                    value={
                                        reminderPreferences.quietHours
                                            .end
                                    }
                                    onChange={(event) =>
                                        updateReminders({
                                            quietHours: {
                                                ...reminderPreferences.quietHours,
                                                end: event.target.value,
                                            },
                                        })
                                    }
                                />
                            </label>
                        </div>

                        {reminderPreferences.channel ===
                            REMINDER_CHANNELS.BROWSER && (
                            <div className="autonomy-reminder-permission">
                                <p>
                                    {t(
                                        `autonomy.reminders.permission.${notificationPermission}`
                                    )}
                                </p>
                                {notificationPermission ===
                                    "default" && (
                                    <button
                                        className="btn btn--secondary"
                                        type="button"
                                        onClick={
                                            requestBrowserPermission
                                        }
                                    >
                                        {t(
                                            "autonomy.reminders.permission.action"
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </section>

            {onToggleEcosystemFlag && (
                <section className="autonomy-section">
                    <h3>{t("ecosystem.sectionTitle")}</h3>
                    <p>{t("ecosystem.autonomyBody")}</p>
                    {ECOSYSTEM_FLAG_ROWS.map((row) => (
                        <ToggleRow
                            key={row.id}
                            label={t(row.labelKey)}
                            description={t(row.descriptionKey)}
                            checked={Boolean(
                                ecosystemContext.contextFlags[row.id]
                            )}
                            onChange={(value) =>
                                onToggleEcosystemFlag(row.id, value)
                            }
                        />
                    ))}
                </section>
            )}

            <section className="autonomy-section">
                <h3>{t("autonomy.pause.title")}</h3>
                <p>{t("autonomy.pause.body")}</p>
                <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={onPauseToggle}
                >
                    {plan.paused ? (
                        <>
                            <PlayCircle size={17} aria-hidden="true" />
                            {t("world.paused.resume")}
                        </>
                    ) : (
                        <>
                            <PauseCircle size={17} aria-hidden="true" />
                            {t("autonomy.pause.action")}
                        </>
                    )}
                </button>
            </section>

            <section className="autonomy-section">
                <h3>{t("autonomy.data.title")}</h3>
                <p>{t("autonomy.data.body")}</p>
                {outcomeMetrics && (
                    <div className="autonomy-outcomes">
                        <p>
                            {t("outcomes.export.summary", {
                                rate: outcomeMetrics.persistence
                                    .completionRate,
                                score: outcomeMetrics.resilience.score,
                            })}
                        </p>
                        <ToggleRow
                            label={t("outcomes.export.label")}
                            description={t(
                                "outcomes.export.description"
                            )}
                            checked={includeOutcomeMetrics}
                            onChange={setIncludeOutcomeMetrics}
                        />
                    </div>
                )}
                <div className="autonomy-actions">
                    <button
                        className="btn btn--secondary"
                        type="button"
                        onClick={() =>
                            onExport(includeOutcomeMetrics)
                        }
                    >
                        <Download size={17} aria-hidden="true" />
                        {t("autonomy.data.export")}
                    </button>
                    {!confirmReset ? (
                        <button
                            className="btn btn--ghost"
                            type="button"
                            onClick={() => setConfirmReset(true)}
                        >
                            {t("autonomy.data.startOver")}
                        </button>
                    ) : (
                        <button
                            className="btn btn--danger"
                            type="button"
                            onClick={onReset}
                        >
                            <RotateCcw size={17} aria-hidden="true" />
                            {t("autonomy.data.confirmReset")}
                        </button>
                    )}
                </div>
            </section>
        </Sheet>
    );
}

export default AutonomySheet;
