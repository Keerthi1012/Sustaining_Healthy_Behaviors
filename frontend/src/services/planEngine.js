import { getActionsForGoal } from "../data/actions";
import { getGoal } from "../data/goals";
import { addDays, daysBetween, toDateKey } from "../utils/date";
import { isBackendProgressionEnabled } from "./config";
import {
    DEFAULT_ECOSYSTEM_CONTEXT,
    normalizeEcosystemContext,
} from "./ecosystemStore";
import {
    evaluateHabitProgression,
    fetchHabitsForGoal,
} from "./habitApi";
import {
    GENTLER_BARRIERS,
    getAggregateFeedbackAdjustment,
} from "./learning";
import { evaluateProgressionMirror } from "./progression";
import {
    isSameReadiness,
    normalizeReadiness,
} from "./readiness";

const PLAN_WEEKS = 4;
const PLAN_DAYS = PLAN_WEEKS * 7;
const MAX_MOVEMENT_BOUT_MINUTES = 10;
const SAFETY_BARRIERS = ["Discomfort or pain", "Hot weather"];
const GENTLE_CONTEXTS = [
    "Age 65+ / balance focus",
    "Managing blood sugar or heart health",
];

const ECOSYSTEM_ADAPTATION = {
    indoor_heat_safe: {
        anchor: "Indoors: a corridor, mall or cool shaded space",
        why: "Indoor movement keeps the effort safe in extreme heat while still counting.",
    },
    shift_aligned: {
        anchor: "About 90 minutes before your main sleep block",
        why: "This cue is aligned to a shift schedule instead of a fixed night-time clock.",
    },
    fasting_aligned: {
        anchor: "At Iftar, Suhoor or another non-fasting window",
        why: "This cue sits in a non-fasting window, so it supports your routine without interfering with fasting.",
    },
    mobility_adapted: {
        anchor: "Seated, supported or in a comfortable space",
        why: "This version keeps movement low-impact, with support close by.",
    },
};

const READINESS_ANCHORS = {
    hot: ECOSYSTEM_ADAPTATION.indoor_heat_safe.anchor,
    rainy: "Indoors or a covered route",
    cold: "A warm indoor space or a well-covered route",
    low: "A comfortable place, at your own pace",
};

const READINESS_WHY = {
    hot: "Today's step stays indoors or in shade because of the heat.",
    rainy: "Today's step stays indoors or under cover because of the rain.",
    cold: "Today's step stays warm and covered because of the cold.",
    low: "Today's step is set to your current energy and time.",
};

function getReadinessTag(readiness, lowCapacity) {
    if (readiness.weather === "hot") return "hot";
    if (readiness.weather === "rainy") return "rainy";
    if (readiness.weather === "cold") return "cold";
    if (lowCapacity) return "low";
    return null;
}

function getReadinessDose(entry, readiness, baseDose) {
    const lowCapacity =
        readiness.energy === "low" ||
        readiness.headspace === "heavy";
    const fallbackDose =
        entry.fallback?.dose ??
        Math.max(1, Math.floor(baseDose / 2));
    let dose = lowCapacity
        ? Math.min(baseDose, fallbackDose)
        : baseDose;

    if (readiness.time !== 10) {
        dose = Math.min(dose, readiness.time);
    }

    if (entry.domain === "movement") {
        dose = Math.min(dose, MAX_MOVEMENT_BOUT_MINUTES);
    }

    return Math.max(1, dose);
}

function applyReadinessToEntry(entry, readiness, base = null) {
    const normalized = normalizeReadiness(readiness);
    const baseDose =
        base?.dose ??
        (entry.readiness
            ? entry.readinessBaseDose
            : entry.dose) ??
        entry.plannedDose ??
        entry.dose;
    const plannedDose = entry.plannedDose ?? baseDose;
    const dose = getReadinessDose(entry, normalized, baseDose);
    const lowCapacity =
        normalized.energy === "low" ||
        normalized.headspace === "heavy";
    const readinessTag = getReadinessTag(normalized, lowCapacity);
    const baseAnchor =
        base?.anchor ??
        (entry.readiness
            ? entry.readinessBaseAnchor
            : entry.anchor) ??
        entry.anchor;
    const baseWhy =
        base?.why ??
        (entry.readiness ? entry.readinessBaseWhy : entry.why) ??
        entry.why;
    const anchor = readinessTag
        ? READINESS_ANCHORS[readinessTag]
        : baseAnchor;
    const weatherAlreadyAdapted =
        readinessTag === "hot" &&
        entry.adaptationTag === "indoor_heat_safe";
    const why =
        readinessTag && !weatherAlreadyAdapted
            ? [baseWhy, READINESS_WHY[readinessTag]]
                  .filter(Boolean)
                  .join(" ")
            : baseWhy;

    return {
        ...entry,
        plannedDose,
        plannedDurationLabel:
            entry.plannedDurationLabel ??
            formatDose(entry, plannedDose),
        readiness: normalized,
        readinessTag,
        readinessBaseDose: baseDose,
        readinessBaseAnchor: baseAnchor,
        readinessBaseWhy: baseWhy,
        adaptedByReadiness: true,
        readinessDose: dose,
        dose,
        durationLabel: formatDose(entry, dose),
        adapted: entry.adapted || dose < plannedDose,
        readinessAnchor: anchor,
        readinessWhy: why,
        anchor,
        why,
    };
}

const ECOSYSTEM_MOVEMENT_ORDER = {
    heat: [
        "movement-reset",
        "movement-mobility-3",
        "movement-walk-5",
        "movement-rhythm",
        "movement-longer-way",
        "movement-reflect",
        "movement-fresh-air",
    ],
    mobility: [
        "movement-mobility-3",
        "movement-reset",
        "movement-rhythm",
        "movement-walk-5",
        "movement-longer-way",
        "movement-reflect",
        "movement-fresh-air",
    ],
};

const ECOSYSTEM_SLEEP_ORDER = [
    "sleep-wind-down",
    "sleep-worry-dump",
    "sleep-caffeine",
    "sleep-room",
    "sleep-wake-time",
    "sleep-morning-light",
    "sleep-notice",
];

const sleepOrder = {
    "Difficulty falling asleep": [
        "sleep-wind-down",
        "sleep-worry-dump",
        "sleep-caffeine",
    ],
    "Waking up during the night": [
        "sleep-room",
        "sleep-caffeine",
        "sleep-notice",
    ],
    "Irregular sleep schedule": [
        "sleep-wake-time",
        "sleep-morning-light",
        "sleep-notice",
    ],
    "Not feeling rested": [
        "sleep-notice",
        "sleep-room",
        "sleep-wake-time",
    ],
    "Too much screen time": [
        "sleep-wind-down",
        "sleep-room",
        "sleep-morning-light",
    ],
};

const movementOrder = {
    "Not enough time": ["movement-reset", "movement-walk-5", "movement-longer-way"],
    "Low energy": ["movement-mobility-3", "movement-reset", "movement-rhythm"],
    "Hot weather": ["movement-reset", "movement-mobility-3", "movement-walk-5"],
    "I lose motivation": ["movement-rhythm", "movement-walk-5", "movement-reflect"],
    "Discomfort or pain": ["movement-mobility-3", "movement-reset", "movement-reflect"],
    "Family or work demands": ["movement-longer-way", "movement-reset", "movement-walk-5"],
};

const movementContextOrder = {
    "Age 65+ / balance focus": [
        "movement-mobility-3",
        "movement-reset",
        "movement-walk-5",
    ],
    "Managing blood sugar or heart health": [
        "movement-walk-5",
        "movement-reset",
        "movement-mobility-3",
    ],
    "Long desk hours": [
        "movement-reset",
        "movement-mobility-3",
        "movement-walk-5",
    ],
};

function parseMinutes(value, fallback = 10) {
    const match = String(value ?? "").match(/\d+/);
    return match ? Number(match[0]) : fallback;
}

function getAnswers(profile) {
    return profile?.answers ?? {};
}

function getEcosystemContext(context) {
    return context ?? DEFAULT_ECOSYSTEM_CONTEXT;
}

function needsGentleStart(context) {
    const flags = context.contextFlags;

    return (
        flags.mobilitySupport ||
        context.healthAgeDelta >= 3 ||
        context.wearableBaseline.dailySteps < 4500
    );
}

function getEcosystemOrder(goalId, context) {
    if (goalId === "movement") {
        if (context.contextFlags.mobilitySupport) {
            return ECOSYSTEM_MOVEMENT_ORDER.mobility;
        }

        if (context.contextFlags.extremeHeatMode) {
            return ECOSYSTEM_MOVEMENT_ORDER.heat;
        }

        return null;
    }

    if (goalId === "sleep") {
        const lowSleep =
            context.wearableBaseline.avgSleepMinutes < 360;

        if (context.contextFlags.shiftWorker || lowSleep) {
            return ECOSYSTEM_SLEEP_ORDER;
        }
    }

    return null;
}

function getEcosystemAdaptationTag(domain, context) {
    const flags = context.contextFlags;

    if (domain === "movement") {
        if (flags.mobilitySupport) return "mobility_adapted";
        if (flags.extremeHeatMode) return "indoor_heat_safe";
        return null;
    }

    if (domain === "sleep") {
        return flags.shiftWorker ? "shift_aligned" : null;
    }

    if (domain === "nutrition") {
        return flags.fasting ? "fasting_aligned" : null;
    }

    return null;
}

function calibrateEcosystemDose(action, dose, context) {
    if (action.domain !== "movement" || !needsGentleStart(context)) {
        return dose;
    }

    return Math.max(
        1,
        Math.min(dose, Math.round(dose * 0.6))
    );
}

function orderActions(goalId, profile, actionsByGoal, ecosystemContext) {
    const backendActions = actionsByGoal?.[goalId];
    const actions = backendActions?.length
        ? backendActions
        : getActionsForGoal(goalId);
    const answers = getAnswers(profile);
    const context = getEcosystemContext(ecosystemContext);
    let order = getEcosystemOrder(goalId, context);

    if (!order) {
        if (goalId === "sleep") {
            order = sleepOrder[answers.sleepChallenge];
        } else if (SAFETY_BARRIERS.includes(answers.barrier)) {
            order = movementOrder[answers.barrier];
        } else {
            order =
                movementContextOrder[answers.context] ??
                movementOrder[answers.barrier];
        }
    }

    if (!order) {
        return actions;
    }

    return [...actions].sort((left, right) => {
        const leftIndex = order.indexOf(left.id);
        const rightIndex = order.indexOf(right.id);
        const leftRank = leftIndex === -1 ? 99 : leftIndex;
        const rightRank = rightIndex === -1 ? 99 : rightIndex;
        return leftRank - rightRank;
    });
}

function adjustMovementDose(action, profile, week) {
    const answers = getAnswers(profile);
    const preferred = parseMinutes(answers.time, 10);
    const comfortable = parseMinutes(
        answers.comfortableTime,
        preferred
    );
    const available = Math.min(preferred, comfortable);
    const barrier = answers.barrier;
    const gentle =
        barrier === "Low energy" ||
        barrier === "Discomfort or pain" ||
        GENTLE_CONTEXTS.includes(answers.context);
    const base = gentle ? action.fallbackDose : action.baseDose;
    const weekLift = gentle ? 0 : Math.min(week - 1, 3);
    return Math.max(
        1,
        Math.min(available, base + weekLift, MAX_MOVEMENT_BOUT_MINUTES)
    );
}

function formatDose(action, dose) {
    if (action.measure === "duration_minutes") {
        return `${dose} min`;
    }
    if (action.measure === "routine_completed") {
        return dose >= 5 ? `${dose} min` : "A few minutes";
    }
    return "A short pause";
}

function resolveEntryDose(action, profile, week) {
    if (action.source === "backend" && action.progressionLevels?.length) {
        const startingMinutes =
            action.progressionLevels[0].minutes ?? action.baseDose;
        const cap =
            action.domain === "movement"
                ? MAX_MOVEMENT_BOUT_MINUTES
                : Infinity;

        return Math.max(1, Math.min(startingMinutes, cap));
    }

    if (action.domain === "movement") {
        return adjustMovementDose(action, profile, week);
    }

    return action.baseDose;
}

function makeEntry(action, profile, week, dayIndex, ecosystemContext) {
    const context = getEcosystemContext(ecosystemContext);
    const baseDose = resolveEntryDose(action, profile, week);
    const dose = calibrateEcosystemDose(action, baseDose, context);
    const startingLevel = action.progressionLevels?.[0]?.level ?? null;
    const adaptationTag = getEcosystemAdaptationTag(
        action.domain,
        context
    );
    const adaptation = adaptationTag
        ? ECOSYSTEM_ADAPTATION[adaptationTag]
        : null;

    return {
        ...action,
        dose,
        plannedDose: dose,
        durationLabel: formatDose(action, dose),
        plannedDurationLabel: formatDose(action, dose),
        status: "planned",
        completedAt: null,
        feedback: null,
        adapted: false,
        week,
        dayIndex,
        progressionLevel: startingLevel,
        baseAnchor: action.anchor ?? null,
        baseWhy: action.why ?? null,
        ecosystemCalibrated: dose !== baseDose,
        adaptationTag,
        clinicalFocusTag:
            context.screeningRisk === "none"
                ? null
                : context.screeningRisk,
        anchor: adaptation?.anchor ?? action.anchor,
        why: adaptation
            ? `${action.why ?? ""} ${adaptation.why}`.trim()
            : action.why,
        fallback: {
            title: action.fallbackTitle,
            text: action.fallbackText,
            dose: action.fallbackDose,
            durationLabel: formatDose(action, action.fallbackDose),
        },
    };
}

function pickAction(goalId, profile, dayIndex, actionsByGoal, ecosystemContext) {
    const actions = orderActions(
        goalId,
        profile,
        actionsByGoal,
        ecosystemContext
    );
    return actions[dayIndex % actions.length];
}

function makeId(profile, startKey) {
    const goalPart = profile.primaryGoalId?.slice(0, 8) || "journey";
    return `sproutly-${goalPart}-${startKey}-${Date.now().toString(36)}`;
}

export function getProgressionStep(entry) {
    const levels = entry?.progressionLevels;

    if (!levels?.length) {
        return null;
    }

    const current =
        levels.find((level) => level.level === entry.progressionLevel) ??
        levels[0];
    const next =
        levels.find((level) => level.level > current.level) ?? null;

    return { current, next };
}

export function buildPlan(profile, startDate = new Date(), options = {}) {
    if (!profile?.primaryGoalId) {
        throw new Error("A primary goal is needed to build a plan.");
    }

    const startKey = toDateKey(startDate);
    const secondaryGoalId = profile.secondaryGoalId || null;
    const ecosystemContext = normalizeEcosystemContext(
        options.ecosystemContext ?? DEFAULT_ECOSYSTEM_CONTEXT
    );
    const actionsByGoal =
        options.actionsByGoal ??
        (options.movementActions?.length
            ? { movement: options.movementActions }
            : null);
    const days = [];

    for (let index = 0; index < PLAN_DAYS; index += 1) {
        const week = Math.floor(index / 7) + 1;
        const dayIndex = index % 7;
        const date = addDays(startDate, index);
        const dateKey = toDateKey(date);
        const primaryAction = pickAction(
            profile.primaryGoalId,
            profile,
            dayIndex,
            actionsByGoal,
            ecosystemContext
        );
        const secondaryAction = secondaryGoalId
            ? pickAction(
                secondaryGoalId,
                profile,
                dayIndex,
                actionsByGoal,
                ecosystemContext
            )
            : null;

        days.push({
            id: `${startKey}-w${week}d${dayIndex + 1}`,
            date: dateKey,
            week,
            dayOfWeek: dayIndex + 1,
            primary: makeEntry(
                primaryAction,
                profile,
                week,
                dayIndex,
                ecosystemContext
            ),
            secondary: secondaryAction
                ? makeEntry(
                    secondaryAction,
                    profile,
                    week,
                    dayIndex,
                    ecosystemContext
                )
                : null,
        });
    }

    return {
        id: makeId(profile, startKey),
        createdAt: new Date().toISOString(),
        startDate: startKey,
        primaryGoalId: profile.primaryGoalId,
        secondaryGoalId,
        goalIds: [profile.primaryGoalId, secondaryGoalId].filter(Boolean),
        days,
        adaptations: [],
        ecosystemContext,
        safetyPause: false,
        safetyMessage: null,
        version: 1,
    };
}

export async function buildPlanAsync(
    profile,
    startDate = new Date(),
    options = {}
) {
    const goalIds = [
        ...new Set(
            [profile?.primaryGoalId, profile?.secondaryGoalId].filter(
                Boolean
            )
        ),
    ];
    const planOptions = {
        ecosystemContext: options.ecosystemContext,
    };

    if (!goalIds.length || !isBackendProgressionEnabled()) {
        return buildPlan(profile, startDate, planOptions);
    }

    const actionsByGoal = {};

    await Promise.all(
        goalIds.map(async (goalId) => {
            try {
                const actions = await fetchHabitsForGoal(goalId, {
                    token: options.token,
                });

                if (actions.length) {
                    actionsByGoal[goalId] = actions;
                }
            } catch {
                // Keep the local catalog for this domain.
            }
        })
    );

    if (!Object.keys(actionsByGoal).length) {
        return buildPlan(profile, startDate, planOptions);
    }

    return buildPlan(profile, startDate, {
        actionsByGoal,
        ecosystemContext: options.ecosystemContext,
    });
}

export function getSlot(day, slot) {
    return day?.[slot] ?? null;
}

export const PLAN_SLOT_ORDER = ["primary", "secondary"];

export function getPlanSlots(day) {
    if (!day) return [];

    return PLAN_SLOT_ORDER.filter((slot) => Boolean(day[slot]));
}

export function isSlotResolved(entry) {
    return (
        entry?.status === "completed" ||
        entry?.status === "paused" ||
        entry?.status === "rested"
    );
}

export function getDayResolution(day) {
    const slots = getPlanSlots(day);
    const resolved = slots.filter((slot) => isSlotResolved(day[slot]));

    return {
        dayId: day?.id ?? null,
        total: slots.length,
        resolved: resolved.length,
        complete: slots.length > 0 && resolved.length === slots.length,
        empty: slots.length === 0,
    };
}

export function isDayResolved(day) {
    const resolution = getDayResolution(day);

    return resolution.complete || resolution.empty;
}

export function isPrimaryResolved(day) {
    return !day?.primary || isSlotResolved(day.primary);
}

export function getActionableDay(plan) {
    const days = plan?.days ?? [];

    return (
        days.find(
            (day) => day.primary && !isSlotResolved(day.primary)
        ) ?? null
    );
}

export function getActionableDayIndex(plan) {
    const days = plan?.days ?? [];
    const actionable = getActionableDay(plan);

    if (!actionable) return -1;

    return days.findIndex((day) => day.id === actionable.id);
}

export function getOptionalActionableStep(plan) {
    const days = plan?.days ?? [];

    if (
        !plan?.secondaryGoalId &&
        !days.some((day) => day.secondary)
    ) {
        return null;
    }

    const primaryIndex = getActionableDayIndex(plan);
    const lastIndex =
        primaryIndex === -1 ? days.length - 1 : primaryIndex;

    for (let index = 0; index <= lastIndex; index += 1) {
        const day = days[index];
        const entry = day?.secondary;

        if (entry && !isSlotResolved(entry)) {
            return {
                day,
                entry,
                index,
                slot: "secondary",
            };
        }
    }

    return null;
}

function updateSlot(plan, dayId, slot, updater) {
    return {
        ...plan,
        days: plan.days.map((day) =>
            day.id === dayId
                ? {
                    ...day,
                    [slot]: updater(day[slot]),
                }
                : day
        ),
    };
}

function addAdaptation(plan, adaptation) {
    return {
        ...plan,
        adaptations: [
            ...(plan.adaptations ?? []),
            {
                id: `adaptation-${Date.now().toString(36)}`,
                at: new Date().toISOString(),
                ...adaptation,
            },
        ],
    };
}

function adaptEntryToEcosystem(entry, context) {
    if (!entry || entry.status !== "planned") return entry;

    const baseAnchor = entry.baseAnchor ?? entry.anchor;
    const baseWhy = entry.baseWhy ?? entry.why;
    const adaptationTag = getEcosystemAdaptationTag(
        entry.domain,
        context
    );
    const adaptation = adaptationTag
        ? ECOSYSTEM_ADAPTATION[adaptationTag]
        : null;
    const baseDose = entry.plannedDose ?? entry.dose;
    const shouldCalibrate =
        entry.domain === "movement" &&
        needsGentleStart(context) &&
        !entry.ecosystemCalibrated;
    const plannedDose = shouldCalibrate
        ? calibrateEcosystemDose(entry, baseDose, context)
        : baseDose;
    const adapted = {
        ...entry,
        baseAnchor,
        baseWhy,
        plannedDose,
        plannedDurationLabel: formatDose(entry, plannedDose),
        dose: plannedDose,
        durationLabel: formatDose(entry, plannedDose),
        ecosystemCalibrated:
            entry.ecosystemCalibrated === true ||
            shouldCalibrate ||
            plannedDose !== baseDose,
        adaptationTag,
        clinicalFocusTag:
            context.screeningRisk === "none"
                ? null
                : context.screeningRisk,
        anchor: adaptation ? adaptation.anchor : baseAnchor,
        why: adaptation
            ? `${baseWhy ?? ""} ${adaptation.why}`.trim()
            : baseWhy,
    };

    if (!entry.readiness) {
        return adapted;
    }

    return applyReadinessToEntry(adapted, entry.readiness, {
        dose: plannedDose,
        anchor: adapted.anchor,
        why: adapted.why,
    });
}

export function applyEcosystemContext(plan, ecosystemContext) {
    if (!plan?.days) return plan;

    const context = normalizeEcosystemContext(ecosystemContext);

    if (plan.paused) {
        return addAdaptation(
            {
                ...plan,
                adaptations: plan.adaptations ?? [],
                ecosystemContext: context,
            },
            {
                type: "ecosystem",
                reason: "Context saved without changing steps while the plan is paused.",
                context,
            }
        );
    }

    const days = plan.days.map((day) => ({
        ...day,
        primary: adaptEntryToEcosystem(day.primary, context),
        secondary: adaptEntryToEcosystem(day.secondary, context),
    }));
    const next = {
        ...plan,
        adaptations: plan.adaptations ?? [],
        ecosystemContext: context,
        days,
    };

    return addAdaptation(next, {
        type: "ecosystem",
        reason: "Upcoming steps were adapted to the health and daily context.",
        context,
    });
}

export function applyReadiness(plan, dayId, slot, readiness) {
    if (!plan?.days || plan.safetyPause) return plan;

    const day = plan.days.find((item) => item.id === dayId);
    const entry = day?.[slot];

    if (!entry || entry.status !== "planned") return plan;

    const normalized = normalizeReadiness(readiness);

    if (entry.readiness && isSameReadiness(entry.readiness, normalized)) {
        return plan;
    }

    const next = updateSlot(plan, dayId, slot, (current) =>
        applyReadinessToEntry(current, normalized)
    );

    return addAdaptation(next, {
        type: "readiness",
        dayId,
        slot,
        targetDayId: dayId,
        targetSlot: slot,
        reason:
            "Today's step was adapted to the current energy, time and weather.",
        readiness: normalized,
    });
}

function findNextEntry(plan, dayId, slot) {
    const dayIndex = plan.days.findIndex((day) => day.id === dayId);
    if (dayIndex === -1) return null;

    for (let index = dayIndex + 1; index < plan.days.length; index += 1) {
        const entry = plan.days[index][slot];
        if (entry && entry.status === "planned") {
            return { day: plan.days[index], entry };
        }
    }

    return null;
}

function applyNextStep(plan, dayId, slot, feedback, aggregate = null) {
    const next = findNextEntry(plan, dayId, slot);
    if (!next) return plan;

    const { day, entry } = next;
    const difficulty = feedback?.difficulty;
    const barrier = feedback?.barrier;
    const recent =
        aggregate ??
        getAggregateFeedbackAdjustment(plan, {
            domain: entry.domain,
            excludeDayId: dayId,
            excludeSlot: slot,
        });
    const needsGentler =
        difficulty === "too_much" ||
        GENTLER_BARRIERS.includes(barrier) ||
        recent.direction === "gentler";

    if (needsGentler) {
        return updateSlot(plan, day.id, slot, (current) => {
            const fallbackDose =
                current.fallback?.dose ??
                Math.max(1, Math.floor(current.dose / 2));

            return {
                ...current,
                adapted: true,
                dose: fallbackDose,
                durationLabel:
                    current.fallback?.durationLabel ??
                    formatDose(current, fallbackDose),
                title: current.fallback?.title ?? current.title,
                text: current.fallback?.text ?? current.text,
            };
        });
    }

    if (recent.direction === "hold") {
        return plan;
    }

    // Only movement grows the dose after comfortable feedback. Sleep,
    // nutrition and smoking keep their steady rhythm.
    if (
        entry.domain === "movement" &&
        (difficulty === "easy" || difficulty === "comfortable")
    ) {
        return updateSlot(plan, day.id, slot, (current) => {
            const dose = Math.min(
                current.dose + 1,
                MAX_MOVEMENT_BOUT_MINUTES
            );
            return {
                ...current,
                dose,
                durationLabel: formatDose(current, dose),
            };
        });
    }

    return plan;
}

export function completeSlot(plan, dayId, slot, feedback, options = {}) {
    const safety = feedback?.safety ?? "none";
    const shouldPause = safety !== "none";
    const useBackendProgression =
        options.useBackendProgression ?? isBackendProgressionEnabled();
    const at = options.now
        ? new Date(options.now).toISOString()
        : new Date().toISOString();
    const sourceEntry =
        plan.days.find((day) => day.id === dayId)?.[slot] ?? null;
    const backendManaged =
        options.deferProgression ||
        (useBackendProgression &&
            sourceEntry?.source === "backend" &&
            Boolean(sourceEntry?.progressionLevels?.length));

    let next = updateSlot(plan, dayId, slot, (entry) => ({
        ...entry,
        status: shouldPause ? "paused" : "completed",
        completedAt: at,
        feedback,
    }));

    if (shouldPause) {
        next = {
            ...next,
            safetyPause: true,
            safetyMessage:
                "Thank you for telling us. Please stop this activity and seek medical advice if the concern continues.",
        };
        next = addAdaptation(next, {
            type: "safety_pause",
            dayId,
            slot,
            targetDayId: dayId,
            targetSlot: slot,
            reason: "A safety concern was reported.",
        });
    } else if (!backendManaged) {
        const aggregate = getAggregateFeedbackAdjustment(next, {
            domain: sourceEntry?.domain,
            excludeDayId: dayId,
            excludeSlot: slot,
        });
        const needsGentler =
            feedback?.difficulty === "too_much" ||
            GENTLER_BARRIERS.includes(feedback?.barrier) ||
            aggregate?.direction === "gentler";
        const gentlerTarget = needsGentler
            ? findNextEntry(next, dayId, slot)
            : null;

        next = applyNextStep(next, dayId, slot, feedback, aggregate);

        if (needsGentler) {
            const reason = feedback?.barrier
                ? `Next step made gentler because of: ${feedback.barrier}.`
                : aggregate?.direction === "gentler"
                  ? "Next step made gentler after recent feedback."
                  : "Next step made gentler after feedback.";

            next = addAdaptation(next, {
                type: "adjusted",
                dayId,
                slot,
                targetDayId: gentlerTarget?.day.id ?? null,
                targetSlot: gentlerTarget ? slot : null,
                reason,
            });
        }
    }

    return next;
}

function collectFeedback(plan, goalId, habitId) {
    return plan.days
        .flatMap((day) =>
            PLAN_SLOT_ORDER.map((slot) => day[slot]).filter(Boolean)
        )
        .filter(
            (entry) =>
                entry.domain === goalId &&
                entry.status === "completed" &&
                entry.feedback &&
                (!habitId || (entry.habitId ?? entry.id) === habitId)
        )
        .map((entry) => ({
            completed: true,
            difficulty: entry.feedback.difficulty,
            safety_signal: entry.feedback.safety ?? "none",
            recorded_at: entry.completedAt ?? new Date(0).toISOString(),
        }));
}

function findNextHabitEntry(plan, dayId, habitId, domain) {
    const startIndex = plan.days.findIndex((day) => day.id === dayId);

    for (let index = startIndex + 1; index < plan.days.length; index += 1) {
        for (const slot of PLAN_SLOT_ORDER) {
            const entry = plan.days[index][slot];

            if (
                entry &&
                entry.domain === domain &&
                entry.status === "planned" &&
                (!habitId || (entry.habitId ?? entry.id) === habitId)
            ) {
                return { day: plan.days[index], slot, entry };
            }
        }
    }

    return null;
}

function applyDecisionToPlan(plan, dayId, slot, decision) {
    if (!decision || decision.action === "maintain") {
        return plan;
    }

    const completed =
        plan.days.find((day) => day.id === dayId)?.[slot] ?? null;
    const next = findNextHabitEntry(
        plan,
        dayId,
        completed?.habitId ?? completed?.id,
        completed?.domain
    );

    if (!next) {
        return plan;
    }

    if (decision.action === "safety_pause") {
        const paused = updateSlot(plan, next.day.id, next.slot, (entry) => ({
            ...entry,
            adapted: true,
            dose: entry.fallback?.dose ?? entry.dose,
            durationLabel:
                entry.fallback?.durationLabel ?? entry.durationLabel,
            title: entry.fallback?.title ?? entry.title,
            text: entry.fallback?.text ?? entry.text,
        }));

        return addAdaptation(paused, {
            type: "safety_pause",
            dayId: next.day.id,
            slot: next.slot,
            targetDayId: next.day.id,
            targetSlot: next.slot,
            reason: decision.reason,
        });
    }

    const recommended = Number(decision.recommended_target);

    if (!Number.isFinite(recommended)) {
        return plan;
    }

    const dose = Math.max(
        1,
        Math.min(
            Math.round(recommended),
            next.entry.domain === "movement"
                ? MAX_MOVEMENT_BOUT_MINUTES
                : Infinity
        )
    );
    const adjusted = updateSlot(plan, next.day.id, next.slot, (entry) => ({
        ...entry,
        adapted: decision.action === "decrease",
        dose,
        durationLabel: formatDose(entry, dose),
        progressionLevel:
            decision.recommended_level ?? entry.progressionLevel,
    }));

    return addAdaptation(adjusted, {
        type: "adjusted",
        dayId: next.day.id,
        slot: next.slot,
        targetDayId: next.day.id,
        targetSlot: next.slot,
        reason: decision.reason,
    });
}

export async function applyProgressionDecision(
    plan,
    dayId,
    slot,
    options = {}
) {
    const completed =
        plan.days.find((day) => day.id === dayId)?.[slot] ?? null;

    if (
        completed?.source !== "backend" ||
        !completed.progressionLevels?.length
    ) {
        return plan;
    }

    const goalId = completed.domain;
    const useBackend =
        options.useBackendProgression ?? isBackendProgressionEnabled();
    const currentLevel =
        completed.progressionLevel ??
        completed.progressionLevels[0]?.level ??
        1;
    const feedbackHistory = collectFeedback(
        plan,
        goalId,
        completed.habitId ?? completed.id
    );
    let decision = null;

    if (useBackend) {
        try {
            decision = await (options.evaluate ??
                ((payload) =>
                    evaluateHabitProgression(goalId, payload)))({
                habitId: completed.habitId,
                currentLevel,
                progressionPaused: Boolean(plan.safetyPause),
                feedbackHistory,
                token: options.token,
            });
        } catch {
            decision = null;
        }
    }

    if (!decision) {
        decision = evaluateProgressionMirror({
            currentLevel,
            levels: completed.progressionLevels,
            policy: {
                ...(completed.progressionPolicy ?? {}),
                paused: Boolean(plan.safetyPause),
            },
            feedbackHistory,
        });
    }

    return applyDecisionToPlan(plan, dayId, slot, decision);
}

export function shrinkSlot(plan, dayId, slot) {
    let next = updateSlot(plan, dayId, slot, (entry) => ({
        ...entry,
        dose: entry.fallback?.dose ?? Math.max(1, Math.floor(entry.dose / 2)),
        durationLabel:
            entry.fallback?.durationLabel ??
            formatDose(entry, Math.max(1, Math.floor(entry.dose / 2))),
        adapted: true,
        title: entry.fallback?.title ?? entry.title,
        text: entry.fallback?.text ?? entry.text,
    }));

    next = addAdaptation(next, {
        type: "smaller",
        dayId,
        slot,
        targetDayId: dayId,
        targetSlot: slot,
        reason: "A smaller step was offered.",
    });

    return next;
}

export function restSlot(plan, dayId, slot, options = {}) {
    const day = plan?.days?.find((item) => item.id === dayId);
    const entry = day?.[slot];

    if (!entry || entry.status !== "planned") return plan;

    const at = options.now
        ? new Date(options.now).toISOString()
        : new Date().toISOString();
    const reason =
        typeof options.reason === "string" && options.reason
            ? options.reason
            : "tired";

    let next = updateSlot(plan, dayId, slot, (current) => ({
        ...current,
        status: "rested",
        restedAt: at,
        restReason: reason,
    }));

    next = addAdaptation(next, {
        type: "rest",
        dayId,
        slot,
        targetDayId: dayId,
        targetSlot: slot,
        reason: "Rested today instead of pushing through.",
    });

    return next;
}

export function undoRest(plan, dayId, slot) {
    const day = plan?.days?.find((item) => item.id === dayId);
    const entry = day?.[slot];

    if (!entry || entry.status !== "rested") return plan;

    const next = updateSlot(plan, dayId, slot, (current) => ({
        ...current,
        status: "planned",
        restedAt: null,
        restReason: null,
    }));

    return {
        ...next,
        adaptations: (next.adaptations ?? []).filter(
            (adaptation) =>
                !(
                    adaptation?.type === "rest" &&
                    adaptation?.dayId === dayId &&
                    adaptation?.slot === slot
                )
        ),
    };
}

export function getLapseInfo(plan, todayKey = toDateKey()) {
    if (!plan) {
        return {
            needsReturn: false,
            missedCount: 0,
            daysSinceLastComplete: 0,
        };
    }

    const waiting = plan.days.filter(
        (day) => day.date < todayKey && !isDayResolved(day)
    );

    // A rested day is a real resolution. It should never make the user look
    // lapsed, even though it does not count as a completed moment.
    const resolvedAt = plan.days
        .flatMap((day) => [day.primary, day.secondary])
        .flatMap((entry) => [entry?.completedAt, entry?.restedAt])
        .filter(Boolean)
        .sort()
        .at(-1);

    const daysSinceLastComplete = resolvedAt
        ? daysBetween(toDateKey(resolvedAt), todayKey)
        : daysBetween(plan.startDate, todayKey);

    // The plan never skips a day, so a pause is only worth mentioning once the
    // user has actually been away for a few days.
    const needsReturn = daysSinceLastComplete >= 3;

    return {
        needsReturn,
        missedCount: waiting.length,
        daysSinceLastComplete: Math.max(0, daysSinceLastComplete),
    };
}

export function applyReturn(plan) {
    const currentDay = getActionableDay(plan);

    if (!currentDay) return plan;

    const slot =
        currentDay.primary?.status === "planned" ? "primary" : "secondary";

    let next = plan;

    if (currentDay[slot]?.status === "planned") {
        next = updateSlot(next, currentDay.id, slot, (entry) => ({
            ...entry,
            dose: entry.fallback?.dose ?? 1,
            durationLabel: entry.fallback?.durationLabel ?? "1 min",
            adapted: true,
            title: entry.fallback?.title ?? entry.title,
            text:
                entry.fallback?.text ??
                "Start with one gentle minute. Your progress is still here.",
        }));
    }

    next = addAdaptation(next, {
        type: "return",
        dayId: currentDay.id,
        slot,
        targetDayId: currentDay.id,
        targetSlot: slot,
        reason: "Returned after a pause without resetting progress.",
    });

    return next;
}

export function addSecondaryGoal(plan, profile, goalId) {
    if (!goalId || goalId === plan.primaryGoalId || plan.secondaryGoalId) {
        return plan;
    }

    const todayKey = toDateKey();
    const days = plan.days.map((day) => {
        if (day.date < todayKey || day.secondary) return day;
        const action = pickAction(
            goalId,
            { ...profile, answers: {} },
            day.dayOfWeek - 1,
            null,
            plan.ecosystemContext
        );
        return {
            ...day,
            secondary: makeEntry(
                action,
                { ...profile, answers: {} },
                day.week,
                day.dayOfWeek - 1,
                plan.ecosystemContext
            ),
        };
    });

    let next = {
        ...plan,
        secondaryGoalId: goalId,
        goalIds: [plan.primaryGoalId, goalId],
        days,
    };

    next = addAdaptation(next, {
        type: "second_focus",
        reason: `${getGoal(goalId)?.name ?? "A second focus"} added to the plan.`,
    });

    return next;
}

function getProgressDays(plan) {
    const days = plan?.days ?? [];
    const actionableIndex = getActionableDayIndex(plan);

    // Include the open moment so partial progress inside it is visible, and
    // keep prior moments so several completions in one calendar day all count.
    return actionableIndex === -1
        ? days
        : days.slice(0, actionableIndex + 1);
}

export function getCompletedEntries(plan) {
    return getProgressDays(plan)
        .flatMap((day) => [day.primary, day.secondary])
        .filter((entry) => entry?.status === "completed");
}

export function getRestedEntries(plan) {
    return getProgressDays(plan)
        .flatMap((day) => [day.primary, day.secondary])
        .filter((entry) => entry?.status === "rested");
}

export function getPlannedEntries(plan) {
    return getProgressDays(plan)
        .flatMap((day) => [day.primary, day.secondary])
        .filter(Boolean);
}

export function isDayCountedForProgress(day) {
    const resolved = isDayResolved(day);
    const rested = day?.primary?.status === "rested" || (day?.secondary?.status === "rested");
    return resolved && !rested;
}

export function getPlanProgress(plan) {
    const days = plan?.days ?? [];
    const total = days.length;
    const resolved = days.filter((day) => isDayCountedForProgress(day)).length;

    return {
        resolved,
        total,
        percent: total ? Math.round((resolved / total) * 100) : 0,
    };
}

export function getGrowth(plan) {
    const planned = getPlannedEntries(plan).length;
    if (!planned) return 0;
    return Math.min(1, getCompletedEntries(plan).length / planned);
}
