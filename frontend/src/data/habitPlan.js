const movementTemplates = (answers) => {
    const availableTime = Number.parseInt(answers.time, 10) || 10;

    const activityLevel = answers.activity || "Mostly sitting";

    const suggestedMinutes =
        activityLevel === "Mostly sitting" ? 5 :
            activityLevel === "A little active" ? 7 :
                activityLevel === "Moderately active" ? 10 : 15;

    const minutes = Math.max(5, Math.min(availableTime, suggestedMinutes));

    return [
        ["Find your starting point", `Take a comfortable ${minutes}-minute walk. Go at your own pace.`, minutes],
        ["Wake up your body", "Try a few gentle stretches or mobility movements.", 5],
        ["A little fresh air", `Take another relaxed ${minutes}-minute walk.`, minutes],
        ["A gentle reset", "Take a short movement break that feels comfortable.", 5],
        ["Make it enjoyable", `Choose a movement you enjoy for ${minutes} minutes.`, minutes],
        ["Move your way", "Try a gentle walk, dancing, cycling or another comfortable activity.", minutes],
        ["Look back and celebrate", "Reflect on which movement felt easiest to fit into your day.", 3],
    ].map(([title, action, duration]) => ({ title, action, duration }));
};

const sleepTemplates = (answers) => {
    const challenge = answers.sleepChallenge;

    const firstAction =
        challenge === "Difficulty falling asleep"
            ? "Create a 10-minute wind-down routine before bed."
            : challenge === "Waking up during the night"
                ? "If you wake up, try a calm, low-stimulation routine rather than checking your phone."
                : challenge === "Irregular sleep schedule"
                    ? "Choose a realistic wake-up time and try to keep it consistent."
                    : challenge === "Not feeling rested"
                        ? "Notice how rested you feel each morning and record it without judgement."
                        : "Give yourself a 10-minute screen-free pause before bedtime.";

    return [
        ["Notice your sleep", "Pay attention to your usual bedtime and wake-up time.", 3],
        ["Try one small change", firstAction, 10],
        ["Make your room restful", "Make one small adjustment to your sleep environment.", 5],
        ["Repeat what helps", "Try the small change that felt most comfortable so far.", 10],
        ["Create a gentle cue", "Choose a calming activity that signals the end of your day.", 10],
        ["Protect your wind-down", "Set aside a little time to slow down before bed.", 10],
        ["Reflect and reset", "Notice what helped and what you would like to try next week.", 3],
    ].map(([title, action, duration]) => ({ title, action, duration }));
};

const nutritionTemplates = (answers) => {
    const focus = answers.nutritionFocus;
    const challenge = answers.nutritionChallenge;

    const focusAction = {
        "Eat more fruits and vegetables": "Add one fruit or vegetable to a meal today.",
        "Drink more water": "Choose one regular moment to drink a glass of water.",
        "Reduce sugary foods and drinks": "Notice one sugary snack or drink choice and consider an alternative you enjoy.",
        "Eat more balanced meals": "Include a source of vegetables, protein and a staple in one meal where practical.",
        "Build regular meal habits": "Choose one meal time that you can make more consistent.",
    };

    const challengeAction = {
        "Busy schedule": "Choose one easy option that needs very little preparation.",
        "Cravings and snacking": "Pause and notice what you feel like eating, without judging yourself.",
        "Meal planning": "Decide on one simple meal or snack in advance.",
        "Eating outside often": "Look for one small addition or swap when ordering a meal.",
        "Not sure where to start": "Make just one small change today. It doesn't need to be perfect.",
    };

    return [
        ["Notice your routine", "Notice one thing about your usual eating or drinking habits.", 3],
        ["Start with your focus", focusAction[focus] || "Make one small, balanced food choice today.", 5],
        ["Make it easier", challengeAction[challenge] || "Choose one practical change that fits your day.", 5],
        ["Repeat your small win", focusAction[focus] || "Repeat the food habit that felt easiest.", 5],
        ["Prepare ahead", "Make one healthy option easier to reach when you need it.", 5],
        ["Try it in real life", "Practise your chosen habit during a normal busy day.", 5],
        ["Reflect and celebrate", "Notice which small food change felt realistic to continue.", 3],
    ].map(([title, action, duration]) => ({ title, action, duration }));
};

const smokingTemplates = (answers) => {
    const readiness = answers.readiness;

    const firstStep =
        readiness === "I'm just exploring"
            ? "Notice when you smoke and what is happening around you. No need to change anything today."
            : readiness === "I'm thinking about quitting"
                ? "Write down one personal reason you might want to quit."
                : readiness === "I'm preparing to quit"
                    ? "Consider choosing a quit date and discussing a plan with a qualified healthcare professional."
                    : "Notice one situation where staying smoke-free felt manageable, and what helped.";

    return [
        ["Understand your pattern", "Notice when and where you use tobacco, without judging yourself.", 3],
        ["Your reason matters", firstStep, 5],
        ["Spot a trigger", "Identify one situation, feeling or routine linked to tobacco use.", 5],
        ["Find your support", "Think of a trusted person or qualified professional who could support you.", 5],
        ["Explore support options", "Look into a recognised tobacco-cessation service or speak with a healthcare professional.", 10],
        ["Prepare for a difficult moment", "Choose a safe alternative activity or supportive person to turn to when an urge appears.", 5],
        ["Reflect without judgement", "Notice what you learned this week and decide what support you want next.", 5],
    ].map(([title, action, duration]) => ({ title, action, duration }));
};

const goalConfig = {
    movement: {
        name: "Valley of Vitality",
        build: movementTemplates,
    },
    sleep: {
        name: "Oasis of Serenity",
        build: sleepTemplates,
    },
    nutrition: {
        name: "Garden of Nourishment",
        build: nutritionTemplates,
    },
    smoking: {
        name: "Clear Skies Kingdom",
        build: smokingTemplates,
    },
};

export function generateHabitPlan(profile) {
    if (!profile?.goalId || !goalConfig[profile.goalId]) {
        throw new Error("A valid health goal is required to create a plan.");
    }

    const config = goalConfig[profile.goalId];
    const answers = profile.answers || {};
    const tasks = config.build(answers);

    return {
        goalId: profile.goalId,
        goalName: profile.goalName,
        realmName: config.name,
        durationDays: 7,
        title: "Your first 7-day adventure",
        description: "Small steps, repeated at your own pace.",
        tasks: tasks.map((task, index) => ({
            id: `${profile.goalId}-day-${index + 1}`,
            day: index + 1,
            ...task,
            completed: false,
        })),
    };
}