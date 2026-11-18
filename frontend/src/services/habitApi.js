import { request } from "./apiClient";
import { normalizeProgressionFeedback } from "./progression";

const DOMAIN_SAFETY = {
    movement:
        "If you feel chest pain, dizziness, faintness or unusual shortness of breath, stop and seek medical advice.",
    sleep:
        "If you snore heavily, wake gasping, or feel very sleepy during the day, consider speaking with a healthcare professional.",
    nutrition:
        "If you have a medical diet, food allergy or a history of disordered eating, follow guidance from your clinician or dietitian.",
    smoking:
        "This is not a substitute for medical care. Combining counselling with approved cessation medication is most effective.",
};

const GENERAL_LIMITS = "General wellbeing support, not medical advice.";

const WHY_PRIORITY = ["8.7", "8.3", "1.4"];

function pickWhy(habit) {
    const mappings = habit.bct_mappings ?? [];
    const preferred = WHY_PRIORITY.map((id) =>
        mappings.find((mapping) => mapping.bct_id === id)
    ).find(Boolean);

    return preferred?.implementation ?? habit.description;
}

export function mapHabitToAction(habit, catalog = null) {
    const profile = habit.progression_profiles?.[0];
    const levels = [...(profile?.levels ?? [])].sort(
        (left, right) => left.level - right.level
    );
    const starting =
        levels.find((level) => level.level === profile?.starting_level) ??
        levels[0];
    const baseDose = Math.max(1, Math.round(starting?.target?.value ?? 5));

    return {
        id: habit.habit_id,
        habitId: habit.habit_id,
        domain: habit.domain,
        source: "backend",
        title: habit.title,
        text: habit.description,
        why: pickWhy(habit),
        limits: habit.limits ?? GENERAL_LIMITS,
        anchor: "A time that fits your day",
        fallbackTitle: "A shorter version",
        fallbackText:
            "Take the shortest comfortable version. Even a couple of minutes counts.",
        fallbackDose: Math.max(1, Math.round(baseDose / 2)),
        baseDose,
        bctIds: (habit.bct_mappings ?? []).map((mapping) => mapping.bct_id),
        comB: habit.com_b_components ?? [],
        safety: (habit.safety_considerations ?? []).join(" ") ||
            DOMAIN_SAFETY[habit.domain] ||
            DOMAIN_SAFETY.movement,
        boundaries: catalog?.boundaries ?? null,
        safetyRules: catalog?.safety_rules ?? null,
        catalogVersion: catalog?.catalog_version ?? null,
        catalogReviewedAt: catalog?.reviewed_at ?? null,
        measure: profile?.metric ?? "duration_minutes",
        progressionLevels: levels.map((level) => ({
            level: level.level,
            name: level.name,
            minutes: Math.round(level.target.value),
        })),
        progressionPolicy: habit.progression ?? {},
        clinicalBasis: habit.clinical_basis ?? "",
    };
}

export async function fetchHabitsForGoal(
    goalId,
    { token, signal } = {}
) {
    const catalog = await request(`/api/habits/${goalId}`, {
        token,
        signal,
    });
    const habits = catalog?.habits ?? [];

    return habits
        .filter((habit) => habit.active !== false)
        .map((habit) => mapHabitToAction(habit, catalog));
}

export function fetchMovementActions({ token, signal } = {}) {
    return fetchHabitsForGoal("movement", { token, signal });
}

export async function evaluateHabitProgression(
    goalId,
    {
        habitId,
        currentLevel,
        progressionPaused = false,
        feedbackHistory = [],
        token,
        signal,
    } = {}
) {
    return request(`/api/habits/${goalId}/progression`, {
        method: "POST",
        token,
        signal,
        body: JSON.stringify({
            habit_id: habitId ?? null,
            current_level: currentLevel,
            progression_paused: progressionPaused,
            feedback_history:
                normalizeProgressionFeedback(feedbackHistory),
        }),
    });
}

export function fetchMovementProgression({
    habitId,
    currentLevel,
    progressionPaused = false,
    feedbackHistory = [],
    token,
    signal,
} = {}) {
    return evaluateHabitProgression("movement", {
        habitId,
        currentLevel,
        progressionPaused,
        feedbackHistory,
        token,
        signal,
    });
}
