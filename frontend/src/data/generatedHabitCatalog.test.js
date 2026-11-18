import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    MOVEMENT_ACTIONS,
    NUTRITION_ACTIONS,
    SLEEP_ACTIONS,
    SMOKING_ACTIONS,
} from "./actions";
import { GENERATED_HABIT_CATALOGS } from "./generatedHabitCatalog";

const DOMAINS = ["movement", "sleep", "nutrition", "smoking"];

const libraryDir = path.resolve("../backend/app/data/habit_library");

describe("generated habit catalog", () => {
    it.each(DOMAINS)("matches the %s backend catalog", (domain) => {
        const source = JSON.parse(
            fs.readFileSync(path.join(libraryDir, `${domain}.json`), "utf8")
        );
        const generated = GENERATED_HABIT_CATALOGS[domain];

        expect(generated.schemaVersion).toBe(source.schema_version);
        expect(generated.catalogVersion).toBe(source.catalog_version);
        expect(generated.reviewedAt).toBe(source.reviewed_at);
        expect(generated.reviewedBy).toBe(source.reviewed_by);
        expect(generated.reviewStatus).toBe(source.review_status);
        expect(generated.expiresAt).toBe(source.expires_at);
        expect(generated.evidence).toEqual(source.evidence);
        expect(generated.boundaries).toEqual(source.boundaries);
        expect(generated.safetyRules).toEqual(source.safety_rules);

        expect(Object.keys(generated.habits).sort()).toEqual(
            source.habits.map((habit) => habit.habit_id).sort()
        );

        for (const habit of source.habits) {
            const entry = generated.habits[habit.habit_id];
            const levels = habit.progression_profiles[0].levels;

            expect(entry.clinicalBasis).toBe(habit.clinical_basis);
            expect(entry.limits).toBe(habit.limits);
            expect(entry.safety).toBe(
                (habit.safety_considerations ?? []).join(" ")
            );
            expect(entry.progressionLevels).toEqual(
                levels.map((level) => ({
                    level: level.level,
                    name: level.name,
                    minutes: Math.round(level.target.value),
                }))
            );
        }
    });

    it("enriches local fallback actions from the generated catalogs", () => {
        const sources = {
            movement: MOVEMENT_ACTIONS,
            sleep: SLEEP_ACTIONS,
            nutrition: NUTRITION_ACTIONS,
            smoking: SMOKING_ACTIONS,
        };

        for (const domain of DOMAINS) {
            const catalog = GENERATED_HABIT_CATALOGS[domain];

            for (const action of sources[domain]) {
                const generated = catalog.habits[action.id];

                expect(generated).toBeTruthy();
                expect(action.clinicalBasis).toBe(generated.clinicalBasis);
                expect(action.limits).toBe(generated.limits);
                expect(action.safety).toBe(generated.safety);
                expect(action.progressionLevels).toEqual(
                    generated.progressionLevels
                );
                expect(action.boundaries).toEqual(catalog.boundaries);
                expect(action.safetyRules).toEqual(catalog.safetyRules);
                expect(action.catalogVersion).toBe(catalog.catalogVersion);
            }
        }
    });
});
