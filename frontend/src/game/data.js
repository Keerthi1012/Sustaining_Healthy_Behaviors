export const VILLAGE_VERSION = 2;
export const VILLAGE_STORAGE_PREFIX = "sproutly.village.v2";
export const LEGACY_VILLAGE_STORAGE_PREFIX = "sproutly.village.v1";

export const RESOURCE_KEYS = ["wood", "stone", "food"];

export const RESOURCES = {
    wood: {
        label: "Wood",
        description: "Dry branches for repairs and warm little fires.",
    },
    stone: {
        label: "Stone",
        description: "Smooth stones for paths, walls and steady foundations.",
    },
    food: {
        label: "Food",
        description: "Berries and gathered greens for the village table.",
    },
};

export const WELCOME_TABLE = {
    wood: 6,
    stone: 4,
    food: 4,
};

export const LOCATIONS = [
    {
        id: "whisperwood",
        name: "Whisperwood",
        resource: "wood",
        x: "16%",
        y: "45%",
        description:
            "An old grove at the edge of the village. Fallen branches make good kindling and honest repairs.",
    },
    {
        id: "stonebank",
        name: "Stonebank",
        resource: "stone",
        x: "78%",
        y: "39%",
        description:
            "A shallow bank where smooth stones gather after rain. The village always has a use for them.",
    },
    {
        id: "berry-meadow",
        name: "Berry Meadow",
        resource: "food",
        x: "35%",
        y: "76%",
        description:
            "Long grass and low bushes, warm with berries in the afternoon. There is enough to share.",
    },
];

export function getLocation(locationId) {
    return LOCATIONS.find((location) => location.id === locationId) ?? null;
}

export const DOMAIN_REWARD_RESOURCE = {
    movement: "wood",
    sleep: "food",
    nutrition: "food",
    smoking: "stone",
};

export const DEFAULT_REWARD_RESOURCE = "stone";

export const SLOT_REWARD_AMOUNT = {
    primary: 2,
    secondary: 1,
};

export const SECONDARY_REWARD_BONUS = {
    stone: 1,
};

export function getRewardResource(entry) {
    return DOMAIN_REWARD_RESOURCE[entry?.domain] ?? DEFAULT_REWARD_RESOURCE;
}

export function getActivityReward(entry, slot) {
    const amount = SLOT_REWARD_AMOUNT[slot] ?? 1;
    const reward = { [getRewardResource(entry)]: amount };

    if (slot === "secondary") {
        for (const [resource, bonus] of Object.entries(SECONDARY_REWARD_BONUS)) {
            reward[resource] = (reward[resource] ?? 0) + bonus;
        }
    }

    return reward;
}
