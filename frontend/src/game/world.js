export const WORLD_REALMS = [
    {
        id: "movement",
        nameKey: "goals.movement.realm",
        labelKey: "world.realm.movement",
        icon: "footprints",
        accent: "moss",
        milestones: [
            { at: 1, layer: "flowers", momentKey: "world.moment.movement.1" },
            { at: 3, layer: "trail", momentKey: "world.moment.movement.3" },
            { at: 5, layer: "butterflies", momentKey: "world.moment.movement.5" },
        ],
    },
    {
        id: "sleep",
        nameKey: "goals.sleep.realm",
        labelKey: "world.realm.sleep",
        icon: "moon",
        accent: "dusk",
        milestones: [
            { at: 1, layer: "lantern", momentKey: "world.moment.sleep.1" },
            { at: 3, layer: "stars", momentKey: "world.moment.sleep.3" },
            { at: 5, layer: "pond", momentKey: "world.moment.sleep.5" },
        ],
    },
    {
        id: "nutrition",
        nameKey: "goals.nutrition.realm",
        labelKey: "world.realm.nutrition",
        icon: "apple",
        accent: "honey",
        milestones: [
            { at: 1, layer: "garden", momentKey: "world.moment.nutrition.1" },
            { at: 3, layer: "berries", momentKey: "world.moment.nutrition.3" },
            { at: 5, layer: "table", momentKey: "world.moment.nutrition.5" },
        ],
    },
    {
        id: "smoking",
        nameKey: "goals.smoking.realm",
        labelKey: "world.realm.smoking",
        icon: "wind",
        accent: "sky",
        milestones: [
            { at: 1, layer: "clear", momentKey: "world.moment.smoking.1" },
            { at: 3, layer: "birds", momentKey: "world.moment.smoking.3" },
            { at: 5, layer: "horizon", momentKey: "world.moment.smoking.5" },
        ],
    },
];

function getAllGrowthEntries(plan) {
    return (plan?.days ?? [])
        .flatMap((day) => [day?.primary, day?.secondary])
        .filter(Boolean);
}

export function getGrowthCompletedEntries(plan) {
    return getAllGrowthEntries(plan).filter(
        (entry) => entry?.status === "completed"
    );
}

export function getGrowthProgress(plan) {
    const entries = getAllGrowthEntries(plan);
    const completed = entries.filter(
        (entry) => entry?.status === "completed"
    ).length;
    const planned = entries.length;
    const percent = planned
        ? Math.min(
              100,
              Math.max(0, Math.round((completed / planned) * 100))
          )
        : 0;

    return { completed, planned, percent };
}

function getRealmCompleted(completedEntries, realmId) {
    return completedEntries.filter(
        (entry) => entry?.domain === realmId
    ).length;
}

export function getWorldGrowth(plan) {
    if (!plan) {
        return {
            total: 0,
            counts: {},
            unlocks: [],
            layers: [],
            next: null,
        };
    }

    const counts = {};
    const unlocks = [];
    const layers = [];
    const completedEntries = getGrowthCompletedEntries(plan);

    for (const realm of WORLD_REALMS) {
        const count = getRealmCompleted(completedEntries, realm.id);
        counts[realm.id] = count;

        for (const milestone of realm.milestones) {
            if (count >= milestone.at) {
                unlocks.push({
                    ...milestone,
                    realmId: realm.id,
                    realmLabelKey: realm.labelKey,
                });
                layers.push(milestone.layer);
            }
        }
    }

    const next = WORLD_REALMS.flatMap((realm) =>
        realm.milestones
            .filter((milestone) => counts[realm.id] < milestone.at)
            .map((milestone) => ({
                ...milestone,
                realmId: realm.id,
                realmLabelKey: realm.labelKey,
                remaining: milestone.at - counts[realm.id],
            }))
    ).sort((a, b) => a.remaining - b.remaining)[0] ?? null;

    const total = Object.values(counts).reduce(
        (sum, value) => sum + value,
        0
    );

    return { total, counts, unlocks, layers, next };
}

export function getRecentWorldMoments(plan, limit = 4) {
    const completed = getGrowthCompletedEntries(plan);

    return [...completed]
        .reverse()
        .slice(0, limit)
        .map((entry) => ({
            id: `${entry.id}-${entry.completedAt ?? ""}`,
            domain: entry.domain,
            title: entry.title,
            completedAt: entry.completedAt ?? null,
        }));
}
