import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DOMAINS = ["movement", "sleep", "nutrition", "smoking"];

const libraryDir = fileURLToPath(
    new URL("../../backend/app/data/habit_library", import.meta.url)
);
const outputPath = fileURLToPath(
    new URL("../src/data/generatedHabitCatalog.js", import.meta.url)
);
const checkOnly = process.argv.includes("--check");

function buildCatalog(domain) {
    const catalogPath = path.join(libraryDir, `${domain}.json`);

    if (!fs.existsSync(catalogPath)) {
        throw new Error(`Catalog not found: ${catalogPath}`);
    }

    const data = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    const habits = {};

    for (const habit of data.habits) {
        const profile = habit.progression_profiles?.[0];
        const levels = [...(profile?.levels ?? [])]
            .sort((left, right) => left.level - right.level)
            .map((level) => ({
                level: level.level,
                name: level.name,
                minutes: Math.round(level.target.value),
            }));

        habits[habit.habit_id] = {
            clinicalBasis: habit.clinical_basis ?? "",
            limits: habit.limits ?? "",
            safety: (habit.safety_considerations ?? []).join(" "),
            progressionLevels: levels,
            progressionPolicy: habit.progression ?? {},
            measure: profile?.metric ?? "duration_minutes",
        };
    }

    return {
        schemaVersion: data.schema_version,
        catalogVersion: data.catalog_version,
        reviewedAt: data.reviewed_at,
        reviewedBy: data.reviewed_by,
        reviewStatus: data.review_status,
        expiresAt: data.expires_at,
        evidence: data.evidence,
        boundaries: data.boundaries,
        safetyRules: data.safety_rules,
        habits,
    };
}

const catalogs = {};

for (const domain of DOMAINS) {
    catalogs[domain] = buildCatalog(domain);
}

const content = `// Generated from backend/app/data/habit_library by
// scripts/generateHabitCatalog.mjs. Do not edit manually.

export const GENERATED_HABIT_CATALOGS = ${JSON.stringify(catalogs, null, 4)};

export function getGeneratedCatalog(domain) {
    return GENERATED_HABIT_CATALOGS[domain] ?? null;
}

export function getGeneratedHabit(domain, habitId) {
    return GENERATED_HABIT_CATALOGS[domain]?.habits?.[habitId] ?? null;
}
`;

if (checkOnly) {
    const current = fs.existsSync(outputPath)
        ? fs.readFileSync(outputPath, "utf8")
        : "";

    if (current !== content) {
        console.error(
            "generatedHabitCatalog.js is out of date. Run npm run generate:catalog."
        );
        process.exitCode = 1;
    }
} else {
    fs.writeFileSync(outputPath, content, "utf8");
    console.log(`Wrote ${path.basename(outputPath)} from 4 catalogs.`);
}
