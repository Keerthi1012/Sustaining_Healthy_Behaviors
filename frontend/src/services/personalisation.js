import { getActionLedger } from "./learning";

const SLOTS = ["primary", "secondary"];
const DEFAULT_MAX_MOVEMENT_DOSE = 10;

function formatDose(entry, dose) {
    if (entry.measure === "duration_minutes") {
        return `${dose} min`;
    }

    if (entry.measure === "routine_completed") {
        return dose >= 5 ? `${dose} min` : "A few minutes";
    }

    return "A short pause";
}

function sampleStandardNormal(random) {
    const first = Math.max(Number.EPSILON, random());
    const second = random();

    return (
        Math.sqrt(-2 * Math.log(first)) *
        Math.cos(2 * Math.PI * second)
    );
}

function sampleGamma(shape, random) {
    if (shape < 1) {
        return (
            sampleGamma(shape + 1, random) *
            Math.pow(Math.max(Number.EPSILON, random()), 1 / shape)
        );
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    for (;;) {
        let normal;
        let value;

        do {
            normal = sampleStandardNormal(random);
            value = 1 + c * normal;
        } while (value <= 0);

        value = value * value * value;

        const uniform = Math.max(Number.EPSILON, random());

        if (
            uniform <
            1 - 0.0331 * normal * normal * normal * normal
        ) {
            return d * value;
        }

        if (
            Math.log(uniform) <
            0.5 * normal * normal +
                d * (1 - value + Math.log(value))
        ) {
            return d * value;
        }
    }
}

export function sampleBeta(alpha, beta, random = Math.random) {
    const first = sampleGamma(Math.max(Number.EPSILON, alpha), random);
    const second = sampleGamma(Math.max(Number.EPSILON, beta), random);

    return first / (first + second);
}

export function getActionPosterior(item) {
    const resolved = Math.max(0, item?.resolved ?? 0);
    const positive =
        Math.max(0, item?.effective ?? 0) +
        Math.max(0, item?.enjoyed ?? 0) * 0.75;
    const safetyPenalty =
        Math.max(0, item?.safetyPauses ?? 0) * 1.5;

    return {
        alpha: 1 + positive,
        beta: 1 + Math.max(0, resolved - positive) + safetyPenalty,
    };
}

function getActionScores(ledger, domain, random) {
    const scores = new Map();

    ledger
        .filter((item) => !domain || item.domain === domain)
        .forEach((item) => {
            const { alpha, beta } = getActionPosterior(item);
            let score = sampleBeta(alpha, beta, random);

            if ((item.notForMe ?? 0) > 0) {
                score *= 0.55;
            }

            if ((item.safetyPauses ?? 0) > 0) {
                score *= 0.2;
            }

            scores.set(item.actionId, score);
        });

    return scores;
}

function getActionScore(entry, scoresByDomain, random) {
    const scores = scoresByDomain.get(entry.domain);

    if (scores?.has(entry.id)) {
        return scores.get(entry.id);
    }

    const score = sampleBeta(1, 1, random);
    scores?.set(entry.id, score);

    return score;
}

function getDoseCeiling(entry, maxMovementDose) {
    if (entry.domain !== "movement") {
        return Infinity;
    }

    const levelMinutes = (entry.progressionLevels ?? [])
        .map((level) => Number(level.minutes))
        .filter(Number.isFinite);

    const backendCeiling = levelMinutes.length
        ? Math.max(...levelMinutes)
        : maxMovementDose;

    return Math.min(maxMovementDose, backendCeiling);
}

function getDoseAdjustment(entry, item, sample, maxMovementDose) {
    if (entry.domain !== "movement") {
        return null;
    }

    const current = Number(entry.dose) || 1;
    const fallback = Number(entry.fallback?.dose) || Math.max(1, Math.floor(current / 2));
    const ceiling = getDoseCeiling(entry, maxMovementDose);
    const safetyPauses = item?.safetyPauses ?? 0;

    if (safetyPauses > 0) {
        const dose = Math.max(1, Math.min(current, fallback, ceiling));

        return dose < current
            ? { dose, reasonCode: "safety_hold" }
            : null;
    }

    const positive = (item?.effective ?? 0) + (item?.enjoyed ?? 0);
    const challenging = item?.challenging ?? 0;
    const notForMe = item?.notForMe ?? 0;

    if (sample >= 0.7 && positive >= 2) {
        const dose = Math.min(current + 1, ceiling);

        if (dose > current) {
            return { dose, reasonCode: "enjoyed_growth" };
        }
    }

    if (
        sample <= 0.3 &&
        (challenging >= 2 || notForMe >= 2)
    ) {
        const dose = Math.max(1, Math.min(fallback, ceiling));

        if (dose < current) {
            return { dose, reasonCode: "gentler_after_feedback" };
        }
    }

    return null;
}

function getTargetDays(plan, sourceIndex) {
    const sourceWeek = Number(plan.days[sourceIndex]?.week);

    if (!Number.isFinite(sourceWeek)) {
        return [];
    }

    return plan.days
        .map((day, index) => ({ day, index }))
        .filter(
            ({ day, index }) =>
                index > sourceIndex &&
                Number(day.week) > sourceWeek
        );
}

function getPrimaryReason(reasons) {
    if (reasons.has("safety_hold")) return "safety_hold";
    if (reasons.has("gentler_after_feedback")) {
        return "gentler_after_feedback";
    }
    if (reasons.has("enjoyed_growth")) return "enjoyed_growth";
    return "weekly_order";
}

export function applyWeeklyPersonalisation(
    plan,
    dayId,
    slot,
    options = {}
) {
    if (!plan?.days || plan.safetyPause) {
        return plan;
    }

    const sourceIndex = plan.days.findIndex((day) => day.id === dayId);

    if (sourceIndex === -1 || !plan.days[sourceIndex]?.[slot]) {
        return plan;
    }

    const targetDays = getTargetDays(plan, sourceIndex);

    if (!targetDays.length) {
        return plan;
    }

    const random = options.random ?? Math.random;
    const maxMovementDose =
        options.maxMovementDose ?? DEFAULT_MAX_MOVEMENT_DOSE;
    const at = options.now ?? new Date().toISOString();
    const ledger = getActionLedger(plan);
    const byAction = new Map(
        ledger.map((item) => [item.actionId, item])
    );
    const domains = new Set(
        targetDays.flatMap(({ day }) =>
            SLOTS.map((targetSlot) => day[targetSlot]?.domain).filter(
                Boolean
            )
        )
    );
    const scoresByDomain = new Map(
        [...domains].map((domain) => [
            domain,
            getActionScores(ledger, domain, random),
        ])
    );
    const prepared = new Map();
    const reasons = new Set();
    let changed = false;

    targetDays.forEach(({ day }) => {
        SLOTS.forEach((targetSlot) => {
            const entry = day[targetSlot];

            if (!entry || entry.status !== "planned") {
                return;
            }

            const item = byAction.get(entry.id);
            const sample = getActionScore(
                entry,
                scoresByDomain,
                random
            );
            const adjustment = getDoseAdjustment(
                entry,
                item,
                sample,
                maxMovementDose
            );

            if (!adjustment) {
                prepared.set(`${day.id}:${targetSlot}`, entry);
                return;
            }

            const plannedDose = Number(entry.plannedDose) || entry.dose;

            prepared.set(`${day.id}:${targetSlot}`, {
                ...entry,
                dose: adjustment.dose,
                plannedDose:
                    adjustment.dose > plannedDose
                        ? adjustment.dose
                        : plannedDose,
                durationLabel: formatDose(entry, adjustment.dose),
                adapted: true,
                personalisation: {
                    type: "weekly",
                    reasonCode: adjustment.reasonCode,
                    updatedAt: at,
                    sampleSize: item?.resolved ?? 0,
                },
            });
            reasons.add(adjustment.reasonCode);
            changed = true;
        });
    });

    SLOTS.forEach((targetSlot) => {
        const groups = new Map();

        targetDays.forEach(({ day }) => {
            const entry = prepared.get(`${day.id}:${targetSlot}`);

            if (!entry || entry.status !== "planned") {
                return;
            }

            const domain = entry.domain ?? "unknown";
            const group = groups.get(domain) ?? [];
            group.push({ day, entry });
            groups.set(domain, group);
        });

        groups.forEach((group) => {
            if (group.length < 2) {
                return;
            }

            const scores = new Map();

            group.forEach(({ entry }) => {
                if (!scores.has(entry.id)) {
                    scores.set(
                        entry.id,
                        getActionScore(
                            entry,
                            scoresByDomain,
                            random
                        )
                    );
                }
            });

            const ordered = [...group].sort(
                (left, right) =>
                    (scores.get(right.entry.id) ?? 0) -
                        (scores.get(left.entry.id) ?? 0) ||
                    String(left.day.date).localeCompare(
                        String(right.day.date)
                    )
            );
            const reordered = ordered.some(
                (item, index) => item.entry !== group[index].entry
            );

            if (!reordered) {
                return;
            }

            group.forEach((target, index) => {
                const source = ordered[index].entry;
                const moved = {
                    ...source,
                    dayIndex:
                        target.day.dayIndex ??
                        Math.max(0, (target.day.dayOfWeek ?? 1) - 1),
                };

                if (!moved.personalisation) {
                    moved.personalisation = {
                        type: "weekly",
                        reasonCode: "weekly_order",
                        updatedAt: at,
                        sampleSize:
                            byAction.get(moved.id)?.resolved ?? 0,
                    };
                }

                prepared.set(
                    `${target.day.id}:${targetSlot}`,
                    moved
                );
            });
            reasons.add("weekly_order");
            changed = true;
        });
    });

    if (!changed) {
        return plan;
    }

    const days = plan.days.map((day) => {
        let nextDay = day;

        SLOTS.forEach((targetSlot) => {
            const nextEntry = prepared.get(
                `${day.id}:${targetSlot}`
            );

            if (!nextEntry || nextEntry === day[targetSlot]) {
                return;
            }

            if (nextDay === day) {
                nextDay = { ...day };
            }

            nextDay[targetSlot] = nextEntry;
        });

        return nextDay;
    });
    const targetWeeks = [
        ...new Set(targetDays.map(({ day }) => day.week)),
    ].sort((left, right) => left - right);

    return {
        ...plan,
        days,
        adaptations: [
            ...(plan.adaptations ?? []),
            {
                type: "personalised_week",
                sourceDayId: dayId,
                sourceSlot: slot,
                targetWeeks,
                reasonCode: getPrimaryReason(reasons),
                updatedAt: at,
            },
        ],
    };
}
