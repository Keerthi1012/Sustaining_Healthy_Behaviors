export const ONBOARDING_BY_GOAL = {
    movement: {
        titleKey: "onboarding.movement.title",
        descriptionKey: "onboarding.movement.description",
        questions: [
            {
                id: "activity",
                labelKey: "onboarding.movement.activity.label",
                options: [
                    {
                        value: "Mostly sitting",
                        labelKey: "onboarding.movement.activity.mostlySitting",
                    },
                    {
                        value: "A little active",
                        labelKey: "onboarding.movement.activity.littleActive",
                    },
                    {
                        value: "Moderately active",
                        labelKey: "onboarding.movement.activity.moderatelyActive",
                    },
                    {
                        value: "Very active",
                        labelKey: "onboarding.movement.activity.veryActive",
                    },
                ],
            },
            {
                id: "time",
                labelKey: "onboarding.movement.time.label",
                optional: true,
                options: [
                    {
                        value: "5 minutes",
                        labelKey: "onboarding.movement.time.5",
                    },
                    {
                        value: "10 minutes",
                        labelKey: "onboarding.movement.time.10",
                    },
                    {
                        value: "20 minutes",
                        labelKey: "onboarding.movement.time.20",
                    },
                    {
                        value: "30 minutes",
                        labelKey: "onboarding.movement.time.30",
                    },
                ],
            },
            {
                id: "comfortableTime",
                labelKey: "onboarding.movement.comfortableTime.label",
                optional: true,
                options: [
                    {
                        value: "2 minutes",
                        labelKey:
                            "onboarding.movement.comfortableTime.2",
                    },
                    {
                        value: "5 minutes",
                        labelKey:
                            "onboarding.movement.comfortableTime.5",
                    },
                    {
                        value: "10 minutes",
                        labelKey:
                            "onboarding.movement.comfortableTime.10",
                    },
                    {
                        value: "15 minutes",
                        labelKey:
                            "onboarding.movement.comfortableTime.15",
                    },
                ],
            },
            {
                id: "barrier",
                labelKey: "onboarding.movement.barrier.label",
                options: [
                    {
                        value: "Not enough time",
                        labelKey: "onboarding.movement.barrier.time",
                    },
                    {
                        value: "Low energy",
                        labelKey: "onboarding.movement.barrier.energy",
                    },
                    {
                        value: "Hot weather",
                        labelKey: "onboarding.movement.barrier.hotWeather",
                    },
                    {
                        value: "I lose motivation",
                        labelKey: "onboarding.movement.barrier.motivation",
                    },
                    {
                        value: "Discomfort or pain",
                        labelKey: "onboarding.movement.barrier.pain",
                    },
                    {
                        value: "Family or work demands",
                        labelKey: "onboarding.movement.barrier.demands",
                    },
                ],
            },
            {
                id: "context",
                labelKey: "onboarding.movement.context.label",
                optional: true,
                options: [
                    {
                        value: "General wellness",
                        labelKey: "onboarding.movement.context.general",
                    },
                    {
                        value: "Age 65+ / balance focus",
                        labelKey: "onboarding.movement.context.balance",
                    },
                    {
                        value: "Managing blood sugar or heart health",
                        labelKey: "onboarding.movement.context.health",
                    },
                    {
                        value: "Long desk hours",
                        labelKey: "onboarding.movement.context.desk",
                    },
                ],
            },
            {
                id: "preferredTime",
                labelKey: "onboarding.movement.preferredTime.label",
                helperKey: "onboarding.movement.preferredTime.helper",
                defaultValue: "evening",
                options: [
                    {
                        value: "morning",
                        labelKey:
                            "onboarding.movement.preferredTime.morning",
                    },
                    {
                        value: "midday",
                        labelKey:
                            "onboarding.movement.preferredTime.midday",
                    },
                    {
                        value: "evening",
                        labelKey:
                            "onboarding.movement.preferredTime.evening",
                    },
                    {
                        value: "anytime",
                        labelKey:
                            "onboarding.movement.preferredTime.anytime",
                    },
                ],
            },
        ],
    },
    sleep: {
        titleKey: "onboarding.sleep.title",
        descriptionKey: "onboarding.sleep.description",
        questions: [
            {
                id: "sleepHours",
                labelKey: "onboarding.sleep.hours.label",
                options: [
                    {
                        value: "Less than 5 hours",
                        labelKey: "onboarding.sleep.hours.lt5",
                    },
                    {
                        value: "5-6 hours",
                        labelKey: "onboarding.sleep.hours.5to6",
                    },
                    {
                        value: "6-7 hours",
                        labelKey: "onboarding.sleep.hours.6to7",
                    },
                    {
                        value: "7-9 hours",
                        labelKey: "onboarding.sleep.hours.7to9",
                    },
                    {
                        value: "More than 9 hours",
                        labelKey: "onboarding.sleep.hours.gt9",
                    },
                ],
            },
            {
                id: "sleepChallenge",
                labelKey: "onboarding.sleep.challenge.label",
                options: [
                    {
                        value: "Difficulty falling asleep",
                        labelKey: "onboarding.sleep.challenge.fallingAsleep",
                    },
                    {
                        value: "Waking up during the night",
                        labelKey: "onboarding.sleep.challenge.waking",
                    },
                    {
                        value: "Irregular sleep schedule",
                        labelKey: "onboarding.sleep.challenge.irregular",
                    },
                    {
                        value: "Not feeling rested",
                        labelKey: "onboarding.sleep.challenge.notRested",
                    },
                    {
                        value: "Too much screen time",
                        labelKey: "onboarding.sleep.challenge.screens",
                    },
                ],
            },
            {
                id: "barrier",
                labelKey: "onboarding.sleep.barrier.label",
                options: [
                    {
                        value: "Late screen time",
                        labelKey: "onboarding.sleep.barrier.screens",
                    },
                    {
                        value: "Racing thoughts",
                        labelKey: "onboarding.sleep.barrier.thoughts",
                    },
                    {
                        value: "Irregular routine",
                        labelKey: "onboarding.sleep.barrier.irregular",
                    },
                    {
                        value: "Work or family demands",
                        labelKey: "onboarding.sleep.barrier.demands",
                    },
                    {
                        value: "My sleep environment",
                        labelKey: "onboarding.sleep.barrier.environment",
                    },
                    {
                        value: "Not sure",
                        labelKey: "onboarding.sleep.barrier.unsure",
                    },
                ],
            },
            {
                id: "windDownTime",
                type: "time",
                labelKey: "onboarding.sleep.windDown.label",
                helperKey: "onboarding.sleep.windDown.helper",
                defaultValue: "22:30",
            },
        ],
    },
    nutrition: {
        titleKey: "onboarding.nutrition.title",
        descriptionKey: "onboarding.nutrition.description",
        questions: [
            {
                id: "nutritionFocus",
                labelKey: "onboarding.nutrition.focus.label",
                options: [
                    {
                        value: "More vegetables",
                        labelKey: "onboarding.nutrition.focus.vegetables",
                    },
                    {
                        value: "More balanced meals",
                        labelKey: "onboarding.nutrition.focus.balanced",
                    },
                    {
                        value: "Steadier energy",
                        labelKey: "onboarding.nutrition.focus.energy",
                    },
                    {
                        value: "More water",
                        labelKey: "onboarding.nutrition.focus.water",
                    },
                    {
                        value: "Calmer meals",
                        labelKey: "onboarding.nutrition.focus.calmer",
                    },
                ],
            },
            {
                id: "mealPattern",
                labelKey: "onboarding.nutrition.meal.label",
                options: [
                    {
                        value: "Breakfast",
                        labelKey: "onboarding.nutrition.meal.breakfast",
                    },
                    {
                        value: "Lunch",
                        labelKey: "onboarding.nutrition.meal.lunch",
                    },
                    {
                        value: "Dinner",
                        labelKey: "onboarding.nutrition.meal.dinner",
                    },
                    {
                        value: "Snacks",
                        labelKey: "onboarding.nutrition.meal.snacks",
                    },
                    {
                        value: "It changes day to day",
                        labelKey: "onboarding.nutrition.meal.variable",
                    },
                ],
            },
            {
                id: "barrier",
                labelKey: "onboarding.nutrition.barrier.label",
                options: [
                    {
                        value: "Not enough time",
                        labelKey: "onboarding.nutrition.barrier.time",
                    },
                    {
                        value: "Cost or food access",
                        labelKey: "onboarding.nutrition.barrier.cost",
                    },
                    {
                        value: "Cravings or habits",
                        labelKey: "onboarding.nutrition.barrier.cravings",
                    },
                    {
                        value: "Family or work demands",
                        labelKey: "onboarding.nutrition.barrier.demands",
                    },
                    {
                        value: "Not sure where to start",
                        labelKey: "onboarding.nutrition.barrier.unsure",
                    },
                    {
                        value: "A medical diet I follow",
                        labelKey: "onboarding.nutrition.barrier.medical",
                    },
                ],
            },
            {
                id: "preferredTime",
                labelKey: "onboarding.nutrition.preferredTime.label",
                helperKey: "onboarding.nutrition.preferredTime.helper",
                defaultValue: "midday",
                options: [
                    {
                        value: "morning",
                        labelKey:
                            "onboarding.nutrition.preferredTime.morning",
                    },
                    {
                        value: "midday",
                        labelKey:
                            "onboarding.nutrition.preferredTime.midday",
                    },
                    {
                        value: "evening",
                        labelKey:
                            "onboarding.nutrition.preferredTime.evening",
                    },
                    {
                        value: "anytime",
                        labelKey:
                            "onboarding.nutrition.preferredTime.anytime",
                    },
                ],
            },
        ],
    },
    smoking: {
        titleKey: "onboarding.smoking.title",
        descriptionKey: "onboarding.smoking.description",
        questions: [
            {
                id: "productType",
                labelKey: "onboarding.smoking.product.label",
                options: [
                    {
                        value: "Cigarettes",
                        labelKey: "onboarding.smoking.product.cigarettes",
                    },
                    {
                        value: "Vape",
                        labelKey: "onboarding.smoking.product.vape",
                    },
                    {
                        value: "Shisha",
                        labelKey: "onboarding.smoking.product.shisha",
                    },
                    {
                        value: "More than one",
                        labelKey: "onboarding.smoking.product.multiple",
                    },
                ],
            },
            {
                id: "smokingTrigger",
                labelKey: "onboarding.smoking.trigger.label",
                options: [
                    {
                        value: "Stress",
                        labelKey: "onboarding.smoking.trigger.stress",
                    },
                    {
                        value: "Routine moments",
                        labelKey: "onboarding.smoking.trigger.routine",
                    },
                    {
                        value: "Social situations",
                        labelKey: "onboarding.smoking.trigger.social",
                    },
                    {
                        value: "After meals",
                        labelKey: "onboarding.smoking.trigger.meals",
                    },
                    {
                        value: "I am not sure yet",
                        labelKey: "onboarding.smoking.trigger.unsure",
                    },
                ],
            },
            {
                id: "readiness",
                labelKey: "onboarding.smoking.readiness.label",
                options: [
                    {
                        value: "Just curious",
                        labelKey: "onboarding.smoking.readiness.curious",
                    },
                    {
                        value: "Thinking about cutting down",
                        labelKey: "onboarding.smoking.readiness.cuttingDown",
                    },
                    {
                        value: "Ready to try quitting",
                        labelKey: "onboarding.smoking.readiness.quitting",
                    },
                    {
                        value: "Already quitting",
                        labelKey: "onboarding.smoking.readiness.alreadyQuitting",
                    },
                ],
            },
            {
                id: "preferredTime",
                labelKey: "onboarding.smoking.preferredTime.label",
                helperKey: "onboarding.smoking.preferredTime.helper",
                defaultValue: "evening",
                options: [
                    {
                        value: "morning",
                        labelKey:
                            "onboarding.smoking.preferredTime.morning",
                    },
                    {
                        value: "midday",
                        labelKey:
                            "onboarding.smoking.preferredTime.midday",
                    },
                    {
                        value: "evening",
                        labelKey:
                            "onboarding.smoking.preferredTime.evening",
                    },
                    {
                        value: "anytime",
                        labelKey:
                            "onboarding.smoking.preferredTime.anytime",
                    },
                ],
            },
        ],
    },
};

export function getOnboardingConfig(goalId) {
    return ONBOARDING_BY_GOAL[goalId] ?? null;
}
