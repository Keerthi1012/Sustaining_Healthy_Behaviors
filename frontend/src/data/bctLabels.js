export const BCT_LABELS = {
    "1.1": "Goal setting",
    "1.2": "Problem solving",
    "1.4": "Action planning",
    "1.5": "Reviewing goals",
    "2.2": "Feedback on behaviour",
    "2.3": "Self-monitoring",
    "4.1": "Instruction",
    "5.1": "Health consequences",
    "7.1": "Prompts and cues",
    "8.1": "Practice and rehearsal",
    "8.2": "Behaviour substitution",
    "8.3": "Habit formation",
    "8.7": "Graded tasks",
    "11.2": "Reducing negative emotions",
    "12.1": "Restructuring the environment",
    "12.3": "Reducing exposure to cues",
    "15.3": "Focus on past success",
};

export const BCT_LABEL_KEYS = {
    "1.1": "bct.1.1",
    "1.2": "bct.1.2",
    "1.4": "bct.1.4",
    "1.5": "bct.1.5",
    "2.2": "bct.2.2",
    "2.3": "bct.2.3",
    "4.1": "bct.4.1",
    "5.1": "bct.5.1",
    "7.1": "bct.7.1",
    "8.1": "bct.8.1",
    "8.2": "bct.8.2",
    "8.3": "bct.8.3",
    "8.7": "bct.8.7",
    "11.2": "bct.11.2",
    "12.1": "bct.12.1",
    "12.3": "bct.12.3",
    "15.3": "bct.15.3",
};

export function getBctLabels(ids = []) {
    return ids.map((id) => BCT_LABELS[id] ?? id);
}

export function getBctLabelKeys(ids = []) {
    return ids.map((id) => BCT_LABEL_KEYS[id] ?? id);
}
