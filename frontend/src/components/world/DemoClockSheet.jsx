import { useState } from "react";
import { Clock } from "lucide-react";

import Sheet from "../ui/Sheet";
import {
    clearDemoClock,
    getDemoClock,
    setDemoClock,
} from "../../services/demoClock";
import { useI18n } from "../../i18n";

const PRESETS = [
    { id: "movement", time: "19:30" },
    { id: "sleep", time: "22:15" },
    { id: "nutrition", time: "13:00" },
    { id: "smoking", time: "20:30" },
];

function DemoClockSheet({ onClose }) {
    const { t } = useI18n();
    const current = getDemoClock();
    const [time, setTime] = useState(current?.time ?? "19:30");
    const [error, setError] = useState("");

    const apply = (value = time) => {
        if (!setDemoClock(value)) {
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

            {current && (
                <p className="demo-clock__current" role="status">
                    {t("demoClock.current", { time: current.time })}
                </p>
            )}

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
