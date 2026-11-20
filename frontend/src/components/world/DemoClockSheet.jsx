import { useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";

import Sheet from "../ui/Sheet";
import {
    clearDemoClock,
    getDemoClock,
    setDemoClock,
} from "../../services/demoClock";
import { getBackendDemoMode } from "../../services/journeyApi";
import { useI18n } from "../../i18n";
import { toDateKey } from "../../utils/date";

const PRESETS = [
    { id: "movement", time: "19:30" },
    { id: "sleep", time: "22:15" },
    { id: "nutrition", time: "13:00" },
    { id: "smoking", time: "20:30" },
];

const MAX_JOURNEY_DAYS = 7;

function formatDateKey(dateKey, locale) {
    const date = new Date(`${dateKey}T00:00:00`);

    if (Number.isNaN(date.getTime())) return dateKey;

    return new Intl.DateTimeFormat(locale, {
        weekday: "short",
        month: "short",
        day: "numeric",
    }).format(date);
}

function DemoClockSheet({ days = [], onClose }) {
    const { t, locale } = useI18n();
    const current = getDemoClock();
    const [time, setTime] = useState(current?.time ?? "19:30");
    const [draftDate, setDraftDate] = useState(current?.date ?? "");
    const [error, setError] = useState("");
    const [demoModeStatus, setDemoModeStatus] = useState("loading");
    const systemDateKey = toDateKey();

    const journeyDays = days.slice(0, MAX_JOURNEY_DAYS);

    useEffect(() => {
        let active = true;

        getBackendDemoMode()
            .then((enabled) => {
                if (active) {
                    setDemoModeStatus(
                        enabled ? "enabled" : "disabled"
                    );
                }
            })
            .catch(() => {
                if (active) setDemoModeStatus("unknown");
            });

        return () => {
            active = false;
        };
    }, []);

    const apply = (value = time, nextDate = draftDate) => {
        if (!setDemoClock(value, nextDate || null)) {
            setError(t("demoClock.invalid"));
            return;
        }

        onClose();
    };

    return (
        <Sheet
            title={t("demoClock.title")}
            eyebrow={t("demoClock.eyebrow")}
            onClose={onClose}
            footer={
                <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={onClose}
                >
                    {t("common.done")}
                </button>
            }
        >
            <p className="sheet-lead">{t("demoClock.lead")}</p>

            {demoModeStatus === "disabled" && (
                <p className="demo-clock__warning" role="alert">
                    {t("demoClock.warningDisabled")}
                </p>
            )}

            {demoModeStatus === "unknown" && (
                <p className="demo-clock__warning" role="alert">
                    {t("demoClock.warningUnavailable")}
                </p>
            )}

            {current && (
                <p className="demo-clock__current" role="status">
                    {t("demoClock.current", { time: current.time })}
                </p>
            )}

            <div className="demo-clock__dates">
                <div
                    className="demo-clock__date-card"
                    role="group"
                    aria-label={t("demoClock.actualDate")}
                >
                    <span>{t("demoClock.actualDate")}</span>
                    <time dateTime={systemDateKey}>
                        {formatDateKey(systemDateKey, locale)} ·{" "}
                        {systemDateKey}
                    </time>
                </div>
                <div
                    className={`demo-clock__date-card demo-clock__date-card--simulated ${
                        draftDate ? "is-active" : ""
                    }`}
                    role="group"
                    aria-label={t("demoClock.simulatedDate")}
                >
                    <span>{t("demoClock.simulatedDate")}</span>
                    <time dateTime={draftDate || systemDateKey}>
                        {draftDate
                            ? `${formatDateKey(draftDate, locale)} · ${draftDate}`
                            : t("demoClock.notSet")}
                    </time>
                </div>
            </div>

            <div
                className="demo-clock__days"
                role="group"
                aria-label={t("demoClock.daysLabel")}
            >
                <button
                    className={`demo-day-chip demo-day-chip--system ${
                        draftDate ? "" : "is-selected"
                    }`}
                    type="button"
                    aria-pressed={!draftDate}
                    onClick={() => {
                        setDraftDate("");
                        setError("");
                    }}
                >
                    <span className="demo-day-chip__day">
                        <CalendarDays size={14} aria-hidden="true" />
                        {t("demoClock.systemDateOption")}
                    </span>
                    <time dateTime={systemDateKey}>{systemDateKey}</time>
                </button>

                {journeyDays.map((day, index) => {
                    const dateKey =
                        typeof day?.date === "string"
                            ? day.date.slice(0, 10)
                            : null;

                    if (!dateKey) return null;

                    return (
                        <button
                            className={`demo-day-chip ${
                                draftDate === dateKey
                                    ? "is-selected"
                                    : ""
                            }`}
                            type="button"
                            key={day.id ?? dateKey}
                            aria-pressed={draftDate === dateKey}
                            onClick={() => {
                                setDraftDate(dateKey);
                                setError("");
                            }}
                        >
                            <span className="demo-day-chip__day">
                                {t("demoClock.day", { day: index + 1 })}
                            </span>
                            <time dateTime={dateKey}>{dateKey}</time>
                        </button>
                    );
                })}
            </div>

            <label className="autonomy-field demo-clock__field">
                <span>{t("demoClock.timeLabel")}</span>
                <input
                    type="time"
                    value={time}
                    onChange={(event) => {
                        setTime(event.target.value);
                        setError("");
                    }}
                />
            </label>

            {error && (
                <p className="demo-clock__error" role="alert">
                    {error}
                </p>
            )}

            <div className="autonomy-actions">
                <button
                    className="btn btn--primary"
                    type="button"
                    onClick={() => apply()}
                >
                    {t("demoClock.apply")}
                </button>
                <button
                    className="btn btn--ghost"
                    type="button"
                    onClick={() => {
                        clearDemoClock();
                        onClose();
                    }}
                >
                    {t("demoClock.clear")}
                </button>
            </div>

            <p className="demo-clock__presets-label">
                {t("demoClock.presetsLabel")}
            </p>
            <div className="demo-clock__presets">
                {PRESETS.map((preset) => (
                    <button
                        className="btn btn--secondary"
                        type="button"
                        key={preset.id}
                        onClick={() => apply(preset.time)}
                    >
                        <Clock size={15} aria-hidden="true" />
                        {t(`demoClock.preset.${preset.id}`, {
                            time: preset.time,
                        })}
                    </button>
                ))}
            </div>

            <p className="demo-clock__note">{t("demoClock.note")}</p>
        </Sheet>
    );
}

export default DemoClockSheet;
