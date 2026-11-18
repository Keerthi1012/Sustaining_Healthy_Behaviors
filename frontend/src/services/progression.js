const REQUIRED_DIFFICULTIES = ["easy", "comfortable"];

const DIFFICULTY_ALIASES = {
    too_much: "uncomfortable",
};

export function normalizeDifficulty(value) {
    const difficulty = value ?? "difficult";
    return DIFFICULTY_ALIASES[difficulty] ?? difficulty;
}

export function normalizeProgressionFeedback(history = []) {
    return history.map((item) => ({
        completed: Boolean(item.completed),
        difficulty: normalizeDifficulty(item.difficulty),
        safety_signal: item.safety_signal ?? item.safety ?? "none",
        recorded_at:
            item.recorded_at ?? item.recordedAt ?? new Date(0).toISOString(),
    }));
}

function targetDecision({
    action,
    reasonCode,
    reason,
    currentLevel,
    recommendedLevel,
    currentMinutes,
    recommendedMinutes,
}) {
    return {
        action,
        reason_code: reasonCode,
        reason,
        current_level: currentLevel,
        recommended_level: recommendedLevel,
        current_target: currentMinutes,
        recommended_target: recommendedMinutes,
    };
}

export function evaluateProgressionMirror({
    currentLevel,
    levels = [],
    policy = {},
    feedbackHistory = [],
}) {
    const sorted = [...levels].sort((left, right) => left.level - right.level);
    const current =
        sorted.find((level) => level.level === currentLevel) ?? sorted[0];
    const currentMinutes = current?.minutes ?? 0;
    const currentLevelValue = current?.level ?? currentLevel;

    const maintain = (reasonCode, reason) =>
        targetDecision({
            action: "maintain",
            reasonCode,
            reason,
            currentLevel: currentLevelValue,
            recommendedLevel: currentLevelValue,
            currentMinutes,
            recommendedMinutes: currentMinutes,
        });

    if (!current) {
        return maintain("no_levels", "No progression levels are available.");
    }

    if (policy?.enabled === false || policy?.paused) {
        return maintain(
            "progression_disabled",
            "Progression is disabled or paused."
        );
    }

    const nextLevel = sorted.find(
        (level) => level.level > currentLevelValue
    );

    if (!nextLevel) {
        return maintain(
            "highest_level",
            "The user is already at the highest level."
        );
    }

    const recent = normalizeProgressionFeedback(feedbackHistory)
        .sort((left, right) =>
            String(right.recorded_at).localeCompare(String(left.recorded_at))
        )
        .slice(0, policy?.lookback_sessions ?? 5);

    if (recent.some((item) => item.safety_signal !== "none")) {
        return targetDecision({
            action: "safety_pause",
            reasonCode: "safety_concern",
            reason:
                "A safety concern was reported. Pause the activity and review before resuming.",
            currentLevel: currentLevelValue,
            recommendedLevel: currentLevelValue,
            currentMinutes,
            recommendedMinutes: currentMinutes,
        });
    }

    if (recent[0]?.difficulty === "uncomfortable") {
        const previousLevel = [...sorted]
            .reverse()
            .find((level) => level.level < currentLevelValue);

        if (!previousLevel) {
            return maintain(
                "lowest_level",
                "Already at the lowest level. Reassess the activity before continuing."
            );
        }

        return targetDecision({
            action: "decrease",
            reasonCode: "uncomfortable",
            reason:
                "User reported uncomfortable difficulty. Returning to an easier level.",
            currentLevel: currentLevelValue,
            recommendedLevel: previousLevel.level,
            currentMinutes,
            recommendedMinutes: previousLevel.minutes,
        });
    }

    const required = policy?.required_feedback ?? REQUIRED_DIFFICULTIES;
    const successfulSessions = recent.filter(
        (item) =>
            item.completed && required.includes(item.difficulty)
    ).length;

    if (successfulSessions < (policy?.min_successful_sessions ?? 2)) {
        return maintain(
            "insufficient_sessions",
            "Not enough successful sessions to progress."
        );
    }

    return targetDecision({
        action: "increase",
        reasonCode: "criteria_met",
        reason: "The user met the progression criteria.",
        currentLevel: currentLevelValue,
        recommendedLevel: nextLevel.level,
        currentMinutes,
        recommendedMinutes: nextLevel.minutes,
    });
}
