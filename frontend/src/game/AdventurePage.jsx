import { useEffect, useState } from "react";
import {
    Apple,
    ArrowLeft,
    Check,
    Circle,
    Compass,
    Gift,
    Lock,
    Mountain,
    Pause,
    ScrollText,
    Sparkles,
    Trees,
} from "lucide-react";

import UserMenu from "../components/ui/UserMenu";
import VillageScene from "./VillageScene";
import {
    LOCATIONS,
    RESOURCES,
    RESOURCE_KEYS,
    getActivityReward,
    getLocation,
} from "./data";
import {
    claimRewards,
    createInitialState,
    getMilestone,
    summarizeReward,
} from "./engine";
import {
    getDaySlots,
    getPendingRewards,
    getVillageProgress,
} from "./progress";
import { getOptionalActionableStep } from "../services/planEngine";
import { loadVillage, saveVillage } from "./storage";
import "./AdventurePage.css";

const REALM_COLORS = {
    movement: "#6B9A5A",    // moss green
    sleep: "#6D7B8D",       // dusk blue
    nutrition: "#D4A853",   // honey amber
    smoking: "#88C0D0",     // sky blue
};

const RESOURCE_ICONS = {
    wood: Trees,
    stone: Mountain,
    food: Apple,
};

const DAY_STATUS_LABELS = {
    completed: "complete",
    current: "in progress",
    optional: "optional step waiting",
    locked: "locked",
};

function ResourceList({ resources, realm }) {
    const realmColor = REALM_COLORS[realm] || "#6B9A5A";

    return (
        <ul className="village-supplies__list">
            {RESOURCE_KEYS.map((key) => {
                const Icon = RESOURCE_ICONS[key];
                const resourceColor = REALM_COLORS[realm] || "#6B9A5A";

                return (
                    <li
                        className={`village-resource village-resource--${key}`}
                        key={key}
                        style={{ color: resourceColor }}
                        aria-label={`${RESOURCES[key].label}: ${resources[key]}`}
                    >
                        <span className="village-resource__icon" aria-hidden="true">
                            <Icon size={18} style={{ color: resourceColor }} />
                        </span>
                        <span className="village-resource__label">
                            {RESOURCES[key].label}
                        </span>
                        <strong style={{ color: resourceColor }}>{resources[key]}</strong>
                    </li>
                );
            })}
        </ul>
    );
}

function QuestList({ day }) {
    return (
        <ul className="village-quests">
            {getDaySlots(day).map(({ slot, entry }) => {
                const done = entry.status === "completed";
                const paused = entry.status === "paused";
                const reward = done
                    ? summarizeReward(getActivityReward(entry, slot))
                    : "";

                return (
                    <li
                        className={`village-quest village-quest--${entry.status}`}
                        key={slot}
                    >
                        <span className="village-quest__mark" aria-hidden="true">
                            {done ? (
                                <Check size={15} />
                            ) : paused ? (
                                <Pause size={15} />
                            ) : (
                                <Circle size={13} />
                            )}
                        </span>
                        <span className="village-quest__body">
                            <span className="village-quest__slot">
                                {slot === "secondary" ? "Second focus" : "Main step"}
                            </span>
                            <strong>{entry.title}</strong>
                            <span className="village-quest__meta">
                                {entry.durationLabel}
                            </span>
                        </span>
                        <span className="village-quest__status">
                            {done
                                ? reward
                                    ? `+${reward}`
                                    : "Done"
                                : paused
                                  ? "Paused"
                                  : "Ready"}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

function DayRoadmap({ progress }) {
    return (
        <ol className="village-roadmap">
            {progress.days.map((day) => {
                const label = `Day ${day.index + 1}: ${
                    DAY_STATUS_LABELS[day.status]
                }`;

                return (
                    <li
                        className={`village-roadmap__day village-roadmap__day--${day.status}`}
                        key={day.dayId}
                        aria-label={label}
                        title={label}
                    >
                        {day.status === "completed" ? (
                            <Check size={13} aria-hidden="true" />
                        ) : day.status === "locked" ? (
                            <Lock size={12} aria-hidden="true" />
                        ) : day.status === "optional" ? (
                            <Circle size={10} aria-hidden="true" />
                        ) : (
                            <span aria-hidden="true">{day.index + 1}</span>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

function AdventurePage({ journey, user, onExit, onLogout }) {
    const plan = journey?.plan ?? null;
    const planId = plan?.id ?? "journey";
    const [village, setVillage] = useState(
        () => loadVillage(planId) ?? createInitialState(planId)
    );
    const [selectedId, setSelectedId] = useState(LOCATIONS[0].id);
    const [announcement, setAnnouncement] = useState("");

    useEffect(() => {
        saveVillage(planId, village);
    }, [planId, village]);

    const selected = getLocation(selectedId) ?? LOCATIONS[0];
    const milestone = getMilestone(village);
    const SelectedIcon = RESOURCE_ICONS[selected.resource];
    const progress = getVillageProgress(plan);
    const currentDay =
        progress.currentIndex === -1 ? null : plan.days[progress.currentIndex];
    const currentStatus =
        progress.currentIndex === -1
            ? null
            : progress.days[progress.currentIndex];
    const primaryRealm =
        currentDay?.primary?.domain ??
        plan?.days?.[0]?.primary?.domain ??
        null;
    const optionalStep = getOptionalActionableStep(plan);
    const pending = getPendingRewards(village, plan);
    const completedPercent = progress.total
        ? Math.round((progress.completedCount / progress.total) * 100)
        : 0;

    const handleSelect = (location) => {
        setSelectedId(location.id);
    };

    const handleClaim = () => {
        const outcome = claimRewards(village, plan);

        if (outcome.reason === "nothing-to-claim") {
            setAnnouncement(
                "There is nothing new to gather yet. Complete a step in your plan first."
            );
            return;
        }

        const total = {};

        for (const item of outcome.granted) {
            for (const [resource, amount] of Object.entries(item.reward)) {
                total[resource] = (total[resource] ?? 0) + amount;
            }
        }

        setVillage(outcome.state);
        setAnnouncement(
            `You gathered ${summarizeReward(total)}. The village is a little fuller.`
        );
    };

    return (
        <main className="village-page">
            <a className="skip-link" href="#village-quests">
                Skip to today's steps
            </a>

            <header className="village-topbar">
                <button
                    className="back-button village-back"
                    type="button"
                    onClick={onExit}
                    aria-label="Back home"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span className="village-back__label">Back home</span>
                </button>

                <div className="village-brand">
                    <span className="village-brand__mark" aria-hidden="true">
                        <Compass size={18} />
                    </span>
                    <span className="village-brand__text">
                        <span className="village-brand__eyebrow">SPROUTLY</span>
                        <strong>The Village</strong>
                    </span>
                </div>

                <div className="village-topbar__end">
                    <span
                        className="village-day"
                        aria-label={
                            progress.allComplete
                                ? "All village days complete"
                                : currentDay
                                  ? `Village day ${progress.currentDayNumber} of ${progress.total}`
                                  : optionalStep
                                    ? "Optional step open"
                                    : `Village day ${progress.currentDayNumber} of ${progress.total}`
                        }
                    >
                        <Compass size={15} aria-hidden="true" />
                        {progress.allComplete
                            ? "All days done"
                            : currentDay
                              ? `Day ${progress.currentDayNumber} of ${progress.total}`
                              : optionalStep
                                ? "Optional step open"
                                : `Day ${progress.currentDayNumber} of ${progress.total}`}
                    </span>
                    <UserMenu user={user} onLogout={onLogout} />
                </div>
            </header>

            <section className="village-intro" aria-labelledby="village-title">
                <p className="eyebrow">A QUIET SIDE PATH</p>
                <h1 id="village-title">The village grows with you</h1>
                <p className="village-intro__lead">
                    Every small step you complete in your plan brings something
                    back to the village. Finish the steps of one day to open the
                    next. Nothing here can be lost, and no day is ever a race.
                </p>
            </section>

            <section
                className="village-supplies"
                aria-labelledby="village-supplies-title"
            >
                <h2 id="village-supplies-title" className="visually-hidden">
                    Village supplies
                </h2>

                <ResourceList resources={village.resources} realm={primaryRealm} />

                <div
                    className="village-progress"
                    aria-label={`Village days complete: ${progress.completedCount} of ${progress.total}`}
                >
                    <div className="village-progress__head">
                        <span>
                            <Compass size={16} aria-hidden="true" />
                            Village days
                        </span>
                        <strong>
                            {progress.completedCount} / {progress.total}
                        </strong>
                    </div>
                    <span
                        className="village-progress__track"
                        role="progressbar"
                        aria-label="Village days complete"
                        aria-valuemin={0}
                        aria-valuemax={progress.total}
                        aria-valuenow={progress.completedCount}
                    >
                        <span style={{ width: `${completedPercent}%` }} />
                    </span>
                    <p>
                        {progress.allComplete
                            ? "Every day is complete. The village rests in the quiet."
                            : currentStatus
                              ? `Day ${progress.currentDayNumber} is open: ${currentStatus.resolved} of ${currentStatus.total} steps done.`
                              : optionalStep
                                ? `Day ${optionalStep.index + 1} has an optional step waiting. The main path is complete.`
                                : "The village is waiting for your first step."}
                    </p>
                </div>
            </section>

            <div className="village-layout">
                <section
                    className="village-map-card"
                    aria-labelledby="village-map-title"
                >
                    <header className="village-map-card__head">
                        <div>
                            <p className="eyebrow">THE VALLEY</p>
                            <h2 id="village-map-title">Places that grow</h2>
                        </div>
                        <span className="village-map-card__note">
                            Opened by your steps
                        </span>
                    </header>

                    <div className="village-map">
                        <VillageScene lanternLit={milestone.complete} />

                        {LOCATIONS.map((location) => {
                            const Icon = RESOURCE_ICONS[location.resource];
                            const active = location.id === selectedId;

                            return (
                                <button
                                    className={`village-spot ${active ? "village-spot--selected" : ""}`}
                                    key={location.id}
                                    type="button"
                                    style={{
                                        left: location.x,
                                        top: location.y,
                                    }}
                                    onClick={() => handleSelect(location)}
                                    aria-label={`Look at ${location.name}`}
                                    aria-pressed={active}
                                >
                                    <span
                                        className="village-spot__pin"
                                        aria-hidden="true"
                                    >
                                        <Icon size={18} />
                                    </span>
                                    <span className="village-spot__label">
                                        {location.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div
                        className="village-location"
                        aria-labelledby="village-location-title"
                    >
                        <div className="village-location__head">
                            <span
                                className={`village-location__icon village-location__icon--${selected.resource}`}
                                aria-hidden="true"
                            >
                                <SelectedIcon size={20} />
                            </span>
                            <div>
                                <p className="eyebrow">A PLACE IN THE VALLEY</p>
                                <h2 id="village-location-title">
                                    {selected.name}
                                </h2>
                            </div>
                        </div>

                        <p className="village-location__description">
                            {selected.description}
                        </p>
                        <p className="village-location__hint">
                            This place gives {RESOURCES[selected.resource].label.toLowerCase()} as you
                            complete steps. It never asks anything of you in return.
                        </p>
                    </div>
                </section>

                <aside className="village-side" aria-label="Village notes">
                    <section
                        className="village-card village-quests-card"
                        id="village-quests"
                        aria-labelledby="village-quests-title"
                    >
                        <header className="village-card__head">
                            <span className="village-card__icon" aria-hidden="true">
                                <ScrollText size={18} />
                            </span>
                            <div>
                                <p className="eyebrow">TODAY'S STEPS</p>
                                <h2 id="village-quests-title">
                                    {progress.allComplete
                                        ? "Every day is done"
                                        : currentDay
                                          ? `Village day ${progress.currentDayNumber}`
                                          : optionalStep
                                            ? "Optional steps"
                                            : `Village day ${progress.currentDayNumber}`}
                                </h2>
                            </div>
                        </header>

                        {progress.allComplete ? (
                            <p className="village-card__copy">
                                You have walked every day of this plan. The
                                village is grateful, and there is no more to
                                gather for now.
                            </p>
                        ) : currentDay ? (
                            <>
                                <p className="village-card__copy">
                                    Complete these steps at home. When the
                                    day is finished, the next one opens.
                                </p>
                                <QuestList day={currentDay} />
                            </>
                        ) : optionalStep ? (
                            <>
                                <p className="village-card__copy">
                                    Your main path is complete. These optional
                                    steps can wait or be gathered whenever you
                                    like.
                                </p>
                                <QuestList day={optionalStep.day} />
                            </>
                        ) : (
                            <p className="village-card__copy">
                                There is no step scheduled for today yet. Rest
                                is a fine choice.
                            </p>
                        )}

                        <button
                            className="village-button village-button--primary village-claim"
                            type="button"
                            onClick={handleClaim}
                            disabled={!pending.length}
                        >
                            <Gift size={17} aria-hidden="true" />
                            {pending.length
                                ? `Gather ${pending.length} reward${pending.length === 1 ? "" : "s"}`
                                : "Nothing to gather yet"}
                        </button>

                        <p
                            className="village-notice"
                            role="status"
                            aria-live="polite"
                        >
                            {announcement}
                        </p>
                    </section>

                    <section
                        className="village-card"
                        aria-labelledby="village-roadmap-title"
                    >
                        <header className="village-card__head">
                            <span className="village-card__icon" aria-hidden="true">
                                <Compass size={18} />
                            </span>
                            <div>
                                <p className="eyebrow">THE ROAD AHEAD</p>
                                <h2 id="village-roadmap-title">Village days</h2>
                            </div>
                        </header>

                        <p className="village-card__copy">
                            A day opens only once the day before it is
                            complete. Missing a day never removes what you have.
                        </p>

                        <DayRoadmap progress={progress} />

                        {!progress.allComplete && currentDay && progress.currentDayNumber < progress.total && (
                            <p className="village-roadmap__note">
                                Day {progress.currentDayNumber + 1} opens after
                                the main step for Day {progress.currentDayNumber} is
                                complete.
                            </p>
                        )}

                        {!progress.allComplete && !currentDay && optionalStep && (
                            <p className="village-roadmap__note">
                                Optional steps stay open without holding back the
                                main path.
                            </p>
                        )}
                    </section>

                    <section
                        className="village-card village-journal"
                        aria-labelledby="village-journal-title"
                    >
                        <header className="village-card__head">
                            <span className="village-card__icon" aria-hidden="true">
                                <ScrollText size={18} />
                            </span>
                            <div>
                                <p className="eyebrow">FIELD NOTES</p>
                                <h2 id="village-journal-title">What the village found</h2>
                            </div>
                        </header>

                        <p className="village-card__copy">
                            A simple record of what your steps have brought
                            back. Nothing here is ever spent or lost.
                        </p>

                        <ul className="village-log">
                            {village.log.slice(0, 4).map((entry) => (
                                <li key={entry.id}>
                                    <span
                                        className={`village-log__dot village-log__dot--${entry.kind}`}
                                        aria-hidden="true"
                                    />
                                    <span>{entry.text}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section
                        className={`village-card village-milestone ${milestone.complete ? "village-milestone--done" : ""}`}
                        aria-labelledby="village-milestone-title"
                    >
                        <header className="village-card__head">
                            <span className="village-card__icon" aria-hidden="true">
                                <Sparkles size={18} />
                            </span>
                            <div>
                                <p className="eyebrow">VILLAGE PROJECT</p>
                                <h2 id="village-milestone-title">
                                    The welcome table
                                </h2>
                            </div>
                        </header>

                        <p className="village-card__copy">
                            Gather a little of everything for the village's
                            shared table.
                        </p>

                        <ul className="village-milestone__list">
                            {milestone.rows.map((row) => {
                                const Icon = RESOURCE_ICONS[row.key];

                                return (
                                    <li
                                        className={`village-milestone__row village-milestone__row--${row.key}`}
                                        key={row.key}
                                        aria-label={`${row.label} for the welcome table: ${row.current} of ${row.target}`}
                                    >
                                        <span
                                            className="village-milestone__icon"
                                            aria-hidden="true"
                                        >
                                            {row.current >= row.target ? (
                                                <Check size={14} />
                                            ) : (
                                                <Icon size={14} />
                                            )}
                                        </span>
                                        <span className="village-milestone__label">
                                            {row.label}
                                        </span>
                                        <strong>
                                            {row.current} / {row.target}
                                        </strong>
                                        <span
                                            className="village-milestone__bar"
                                            aria-hidden="true"
                                        >
                                            <span
                                                style={{
                                                    width: `${row.percent}%`,
                                                }}
                                            />
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>

                        <p className="village-milestone__note">
                            {milestone.complete
                                ? "Enough for the next chapter. For now, enjoy the quiet."
                                : "There is no timer. The table fills as you go."}
                        </p>
                    </section>
                </aside>
            </div>

            <footer className="village-footer">
                <p>
                    The village is a quiet extra beside your daily plan. Your
                    companions are waiting at home.
                </p>
            </footer>
        </main>
    );
}

export default AdventurePage;
