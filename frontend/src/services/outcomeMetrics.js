import { daysBetween, toDateKey } from "../utils/date";
import { isBackendJourneyEnabled } from "./config";
import {
    DEFAULT_ECOSYSTEM_CONTEXT,
    normalizeEcosystemContext,
} from "./ecosystemStore";
import { getLearningSummary } from "./learning";

const SLOTS = ["primary", "secondary"];
const REALM_ORDER = ["movement", "sleep", "nutrition", "smoking"];
const REALM_WEIGHTS = {
    movement: 0.06,
    sleep: 0.05,
    nutrition: 0.04,
    smoking: 0.06,
};
const ACCOMMODATIONS = [
    ["extremeHeatMode", "heat"],
    ["shiftWorker", "shift"],
    ["fasting", "fasting"],
    ["mobilitySupport", "mobilitySupport"],
];
const BIOMARKER_KEYS = {
    none: "outcomes.biomarker.none",
    prediabetes: "outcomes.biomarker.prediabetes",
    hypertension: "outcomes.biomarker.hypertension",
    cardio_metabolic: "outcomes.biomarker.cardioMetabolic",
};

function roundOne(value) {
    return Math.round(value * 10) / 10;
}

function getEntryKey(dayId, slot) {
    return `${dayId}:${slot}`;
}

function getSlotsForDay(day) {
    return SLOTS.map((slot) => ({
        slot,
        entry: day?.[slot] ?? null,
    })).filter(({ entry }) => Boolean(entry));
}

function hasResolvedEntry(day) {
    return getSlotsForDay(day).some(
        ({ entry }) =>
            entry.status === "completed" ||
            entry.status === "paused" ||
            entry.status === "rested"
    );
}

function getWindowDays(days, todayKey) {
    return days.filter(
        (day) =>
            !day.date ||
            day.date <= todayKey ||
            hasResolvedEntry(day)
    );
}

function hasHealthContext(context) {
    return Boolean(
        context.updatedAt ||
            context.screeningRisk !== "none" ||
            context.healthAgeDelta !== 0 ||
            Object.values(context.contextFlags ?? {}).some(Boolean)
    );
}

function getContext(plan, ecosystemContext) {
    const planContext = plan?.ecosystemContext
        ? normalizeEcosystemContext(plan.ecosystemContext)
        : null;
    const fallback = ecosystemContext
        ? normalizeEcosystemContext(ecosystemContext)
        : null;

    if (!planContext) {
        return (
            fallback ??
            normalizeEcosystemContext(DEFAULT_ECOSYSTEM_CONTEXT)
        );
    }

    if (!fallback) return planContext;

    if (!hasHealthContext(planContext)) return fallback;

    const planUpdated = Date.parse(planContext.updatedAt ?? "");
    const fallbackUpdated = Date.parse(fallback.updatedAt ?? "");

    if (
        hasHealthContext(fallback) &&
        Number.isFinite(fallbackUpdated) &&
        (!Number.isFinite(planUpdated) ||
            fallbackUpdated > planUpdated)
    ) {
        return fallback;
    }

    return planContext;
}

function getTargetKey(adaptation) {
    const dayId = adaptation?.targetDayId ?? adaptation?.dayId;
    const slot = adaptation?.targetSlot ?? adaptation?.slot;

    return dayId && slot ? getEntryKey(dayId, slot) : null;
}

function findEntry(plan, dayId, slot) {
    const day = (plan?.days ?? []).find((item) => item.id === dayId);

    return day?.[slot] ?? null;
}

function findNextAdaptedEntry(plan, dayId, slot) {
    const days = plan?.days ?? [];
    const startIndex = days.findIndex((day) => day.id === dayId);

    if (startIndex === -1) return null;

    for (let index = startIndex + 1; index < days.length; index += 1) {
        const entry = days[index]?.[slot];

        if (entry?.adapted) {
            return {
                dayId: days[index].id,
                slot,
                entry,
            };
        }
    }

    return null;
}

function getDoseSaveTargets(plan) {
    const targets = new Set();

    for (const adaptation of plan?.adaptations ?? []) {
        if (
            adaptation?.type !== "smaller" &&
            adaptation?.type !== "adjusted"
        ) {
            continue;
        }

        const explicitKey = getTargetKey(adaptation);

        if (adaptation.targetDayId && adaptation.targetSlot) {
            targets.add(explicitKey);
            continue;
        }

        if (adaptation.type === "smaller") {
            const key = getEntryKey(adaptation.dayId, adaptation.slot);
            targets.add(key);
            continue;
        }

        const source = findEntry(plan, adaptation.dayId, adaptation.slot);

        if (source?.adapted && source.status !== "completed") {
            targets.add(getEntryKey(adaptation.dayId, adaptation.slot));
            continue;
        }

        const next = findNextAdaptedEntry(
            plan,
            adaptation.dayId,
            adaptation.slot
        );

        if (next) {
            targets.add(getEntryKey(next.dayId, next.slot));
        }
    }

    return targets;
}

function getWindowEntries(plan, windowDays) {
    const dayIndex = new Map(
        windowDays.map((day) => [day.id, day])
    );

    return (plan?.days ?? [])
        .flatMap((day) =>
            getSlotsForDay(day).map(({ slot, entry }) => ({
                day,
                slot,
                entry,
                key: getEntryKey(day.id, slot),
                inWindow: dayIndex.has(day.id),
            }))
        )
        .filter(({ inWindow }) => inWindow);
}

function getBounceBacks(plan, completedEntries) {
    const bounceKeys = new Set();

    for (const adaptation of plan?.adaptations ?? []) {
        if (adaptation?.type !== "return") continue;

        const key = getTargetKey(adaptation);

        if (key) bounceKeys.add(key);
    }

    for (const { day, slot, entry } of completedEntries) {
        if (!entry.completedAt || !day.date) continue;

        if (toDateKey(entry.completedAt) > day.date) {
            bounceKeys.add(getEntryKey(day.id, slot));
        }
    }

    return bounceKeys.size;
}

function getSafetyPauses(plan, windowEntries) {
    const pauseKeys = new Set(
        windowEntries
            .filter(({ entry }) => entry.status === "paused")
            .map(({ key }) => key)
    );

    for (const adaptation of plan?.adaptations ?? []) {
        if (adaptation?.type !== "safety_pause") continue;

        const key = getTargetKey(adaptation);

        if (key) pauseKeys.add(key);
    }

    return pauseKeys.size;
}

function getPlanStartKey(plan) {
    return plan?.startDate ?? plan?.days?.[0]?.date ?? null;
}

function getElapsedDays(plan, todayKey) {
    const startKey = getPlanStartKey(plan);

    if (!startKey) return 0;

    return Math.max(1, daysBetween(startKey, todayKey) + 1);
}

function getActiveDayKeys(completedEntries) {
    return [
        ...new Set(
            completedEntries
                .map(({ entry }) =>
                    entry.completedAt
                        ? toDateKey(entry.completedAt)
                        : null
                )
                .filter(Boolean)
        ),
    ].sort();
}

function getReturnCount(plan) {
    return (plan?.adaptations ?? []).filter(
        (adaptation) => adaptation?.type === "return"
    ).length;
}

function getRetention(plan, completedEntries, todayKey) {
    const startKey = getPlanStartKey(plan);
    const elapsedDays = getElapsedDays(plan, todayKey);
    const activeDayKeys = getActiveDayKeys(completedEntries);
    const lastCompletedAt =
        completedEntries
            .map(({ entry }) => entry.completedAt)
            .filter(Boolean)
            .sort()
            .at(-1) ?? null;
    const lastCompletedKey = lastCompletedAt
        ? toDateKey(lastCompletedAt)
        : null;
    const daysSinceLastComplete = lastCompletedKey
        ? Math.max(0, daysBetween(lastCompletedKey, todayKey))
        : elapsedDays;
    const activeLast7 = activeDayKeys.filter((dayKey) => {
        const offset = daysBetween(dayKey, todayKey);
        return offset >= 0 && offset < 7;
    }).length;
    const activeLast28 = activeDayKeys.filter((dayKey) => {
        const offset = daysBetween(dayKey, todayKey);
        return offset >= 0 && offset < 28;
    }).length;
    const retained7 =
        Boolean(startKey) &&
        elapsedDays >= 7 &&
        activeDayKeys.some(
            (dayKey) => daysBetween(startKey, dayKey) >= 6
        );
    const retained28 =
        Boolean(startKey) &&
        elapsedDays >= 28 &&
        activeDayKeys.some(
            (dayKey) => daysBetween(startKey, dayKey) >= 27
        );

    return {
        activeDays: activeDayKeys.length,
        activeLast7,
        activeLast28,
        elapsedDays,
        lastCompletedAt,
        daysSinceLastComplete,
        retained7,
        retained28,
        returnCount: getReturnCount(plan),
    };
}

function getBehaviour(windowEntries, completedEntries, activities) {
    const byRealm = REALM_ORDER.reduce((realms, realm) => {
        const realmEntries = windowEntries.filter(
            ({ entry }) => entry.domain === realm
        );
        const completed = realmEntries.filter(
            ({ entry }) => entry.status === "completed"
        );
        const movementMinutes =
            realm === "movement"
                ? completed.reduce(
                      (total, { entry }) =>
                          total + (Number(entry.dose) || 0),
                      0
                  )
                : 0;

        realms[realm] = {
            total: realmEntries.length,
            completed: completed.length,
            paused: realmEntries.filter(
                ({ entry }) => entry.status === "paused"
            ).length,
            rested: realmEntries.filter(
                ({ entry }) => entry.status === "rested"
            ).length,
            activeDays: getActiveDayKeys(completed).length,
            minutes: roundOne(movementMinutes),
        };

        return realms;
    }, {});
    const activityMinutes = activities.reduce(
        (total, activity) =>
            total + (Number(activity?.duration_minutes) || 0),
        0
    );

    return {
        byRealm,
        movementMinutes: byRealm.movement.minutes,
        activityMinutes: roundOne(activityMinutes),
        activityCount: activities.length,
        completedMoments: completedEntries.length,
    };
}

function getEquityLens(inclusion, trajectory) {
    return {
        locale: inclusion.locale,
        accommodations: inclusion.accommodations,
        screeningFocus: trajectory.clinicalFocus,
        contextSource: inclusion.contextSource,
        cohortComparisonAvailable: false,
        noteKey: "outcomes.equity.note",
    };
}

function getTrajectory(context, completedEntries) {
    const completedCount = completedEntries.length;
    const connected = hasHealthContext(context);
    const baseline = connected ? context.healthAgeDelta : null;
    const counts = completedEntries.reduce((totals, { entry }) => {
        const domain = entry.domain;
        totals[domain] = (totals[domain] ?? 0) + 1;
        return totals;
    }, {});
    const rawShift = REALM_ORDER.reduce(
        (total, realm) =>
            total + (counts[realm] ?? 0) * REALM_WEIGHTS[realm],
        0
    );
    const cappedShift = Math.min(1.5, roundOne(rawShift));
    const shift =
        connected && completedCount >= 3 && cappedShift > 0
            ? -cappedShift
            : 0;
    const clinicalFocus = connected ? context.screeningRisk : "none";

    return {
        hasContext: connected,
        baselineHealthAgeDelta: baseline,
        projectedDeltaShift: shift,
        projectedHealthAgeDelta:
            baseline === null ? null : roundOne(baseline + shift),
        clinicalFocus,
        biomarkerNoteKey: connected
            ? BIOMARKER_KEYS[clinicalFocus] ??
              BIOMARKER_KEYS.none
            : null,
        disclaimerKey: "outcomes.trajectory.disclaimer",
        completionsConsidered: completedCount,
    };
}

function getInclusion(context, options) {
    return {
        locale: options.locale ?? "en",
        accommodations: ACCOMMODATIONS.filter(
            ([flag]) => context.contextFlags?.[flag]
        ).map(([, label]) => label),
        privacyMode: "local-first",
        syncEnabled:
            options.syncEnabled ?? isBackendJourneyEnabled(),
        contextSource: context.source,
    };
}

export function getOutcomeMetrics(
    plan,
    ecosystemContext,
    options = {}
) {
    const todayKey = options.todayKey ?? toDateKey();
    const context = getContext(plan, ecosystemContext);
    const activities = Array.isArray(options.activities)
        ? options.activities
        : [];
    const days = Array.isArray(plan?.days) ? plan.days : [];
    const windowDays = getWindowDays(days, todayKey);
    const windowEntries = getWindowEntries(plan, windowDays);
    const completedEntries = windowEntries.filter(
        ({ entry }) => entry.status === "completed"
    );
    const pausedEntries = windowEntries.filter(
        ({ entry }) => entry.status === "paused"
    );
    const restedEntries = windowEntries.filter(
        ({ entry }) => entry.status === "rested"
    );
    const plannedEntries = windowEntries.filter(
        ({ entry }) => entry.status === "planned"
    );
    const missedEntries = plannedEntries.filter(
        ({ day }) => day.date && day.date < todayKey
    );
    const openEntries = plannedEntries.filter(
        ({ day }) => !day.date || day.date >= todayKey
    );
    const eligibleMoments = Math.max(
        0,
        windowEntries.length - pausedEntries.length - restedEntries.length
    );
    const completionRate = eligibleMoments
        ? Math.round(
              (completedEntries.length / eligibleMoments) * 100
          )
        : 0;
    const activeRealms = REALM_ORDER.filter((realm) =>
        completedEntries.some(({ entry }) => entry.domain === realm)
    );
    const completedMoments = completedEntries.length;
    const retention = getRetention(plan, completedEntries, todayKey);
    const sustainedWindowLabel =
        completedMoments >= 10 && retention.elapsedDays >= 21
            ? "sustained"
            : completedMoments >= 3
              ? "building"
              : "starting";
    const doseSaveTargets = getDoseSaveTargets(plan);
    const doseShrinkSaves = windowEntries.filter(
        ({ key, entry }) =>
            doseSaveTargets.has(key) && entry.status === "completed"
    ).length;
    const bounceBacks = getBounceBacks(plan, completedEntries);
    const safetyPauses = getSafetyPauses(plan, windowEntries);
    const consistency = completionRate / 100;
    const bounceSignal = Math.min(1, bounceBacks / 3);
    const saveSignal = Math.min(1, doseShrinkSaves / 3);
    const resilienceScore = Math.round(
        70 * consistency + 20 * bounceSignal + 10 * saveSignal
    );
    const trajectory = getTrajectory(context, completedEntries);
    const inclusion = getInclusion(context, options);
    const learning = getLearningSummary(plan, {
        lookback: options.learningLookback ?? 3,
    });

    return {
        persistence: {
            resolvedMoments:
                completedMoments +
                pausedEntries.length +
                restedEntries.length,
            completedMoments,
            pausedMoments: pausedEntries.length,
            restedMoments: restedEntries.length,
            missedMoments: missedEntries.length,
            openMoments: openEntries.length,
            eligibleMoments,
            completionRate,
            activeRealms,
            sustainedWindowLabel,
        },
        retention,
        behaviour: getBehaviour(
            windowEntries,
            completedEntries,
            activities
        ),
        resilience: {
            bounceBacks,
            doseShrinkSaves,
            safetyPauses,
            score: resilienceScore,
        },
        trajectory,
        equityLens: getEquityLens(inclusion, trajectory),
        inclusion,
        learning,
    };
}
