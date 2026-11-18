export const GOALS = [
    {
        id: "movement",
        name: "Move More",
        realm: "Valley of Vitality",
        description: "Build gentle movement into your everyday routine.",
        icon: "footprints",
        available: true,
    },
    {
        id: "sleep",
        name: "Sleep Better",
        realm: "Oasis of Serenity",
        description: "Create calmer evenings and more restful nights.",
        icon: "moon",
        available: true,
    },
    {
        id: "nutrition",
        name: "Eat Healthier",
        realm: "Garden of Nourishment",
        description: "Grow small, sustainable nutrition habits.",
        icon: "apple",
        available: true,
    },
    {
        id: "smoking",
        name: "Clear Skies",
        realm: "Clear Skies",
        description: "Build gentle support for cravings, triggers and smoke-free moments.",
        icon: "wind",
        available: true,
    },
];

export const AVAILABLE_GOALS = GOALS.filter((goal) => goal.available);

export function getGoal(goalId) {
    return GOALS.find((goal) => goal.id === goalId) ?? null;
}

export function getRealmName(goalId) {
    return getGoal(goalId)?.realm ?? "Your world";
}
