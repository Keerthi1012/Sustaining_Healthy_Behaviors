// Generated from backend/app/data/habit_library by
// scripts/generateHabitCatalog.mjs. Do not edit manually.

export const GENERATED_HABIT_CATALOGS = {
    "movement": {
        "schemaVersion": "1.0.0",
        "catalogVersion": "1.0.0",
        "reviewedAt": "2026-11-14",
        "reviewedBy": "Habit-RPG content team",
        "reviewStatus": "internal_review",
        "expiresAt": "2027-11-14",
        "evidence": [
            {
                "id": "who-2020",
                "source": "WHO Guidelines on Physical Activity and Sedentary Behaviour",
                "year": 2020,
                "claim": "All moderate activity counts; the former 10-minute bout rule was removed."
            },
            {
                "id": "cdc-activity",
                "source": "CDC Physical Activity Basics",
                "year": 2023,
                "claim": "Brief bouts of activity can interrupt sitting and support health."
            },
            {
                "id": "acsm-fitt",
                "source": "ACSM FITT-VP framework",
                "year": 2018,
                "claim": "Frequency, intensity, time, type and progression should be individualised."
            },
            {
                "id": "ada-sitting",
                "source": "ADA Standards of Care in Diabetes",
                "year": 2019,
                "claim": "Short post-meal movement can help interrupt prolonged sitting."
            }
        ],
        "boundaries": {
            "not_for": [
                "Diagnosis, treatment or rehabilitation of a medical condition.",
                "Replacing prescribed exercise, physiotherapy or cardiac rehabilitation."
            ],
            "seek_help_if": [
                "Chest pain, faintness, dizziness or unusual shortness of breath during activity.",
                "New or worsening joint pain, or symptoms that do not settle with rest."
            ],
            "population_exclusions": [
                "Follow clinician advice if you have been told to restrict activity.",
                "Use clinician-led programmes for cardiac, lung or musculoskeletal rehabilitation."
            ]
        },
        "safetyRules": {
            "screening": [
                "Ask whether a clinician has advised limiting physical activity.",
                "Ask about chest pain, dizziness or unusual breathlessness during everyday movement."
            ],
            "signals": [
                {
                    "code": "pain",
                    "label": "Pain",
                    "guidance": "Pause the activity, choose a gentler option and seek advice if the pain persists."
                },
                {
                    "code": "concerning_symptom",
                    "label": "Concerning symptom",
                    "guidance": "Stop the activity and seek medical advice for chest pain, faintness, dizziness or unusual breathlessness."
                }
            ]
        },
        "habits": {
            "movement-walk-5": {
                "clinicalBasis": "WHO (2020) removed the 10-minute minimum bout for adults, so brief walks count toward weekly activity. ADA and Sports Medicine guidance supports short post-meal walks to interrupt sitting. Start short and build gradually.",
                "limits": "General wellbeing support, not medical advice.",
                "safety": "Adapt the walk to the user's physical ability and health context. Allow a shorter or easier alternative. Do not recommend progression when the user reports pain, discomfort or concerning symptoms.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 5
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 7
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 10
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 15
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "movement-mobility-3": {
                "clinicalBasis": "CDC recommends multicomponent balance and strength work for older adults. ACSM FITT-VP supports short, frequent mobility bouts with gradual progression. Stop if movement causes pain or dizziness.",
                "limits": "Choose movements that feel comfortable. Stop if anything hurts.",
                "safety": "Keep movements slow and within a comfortable range. Use a chair or wall for support if balance is a concern. Stop and seek advice if movement causes pain, dizziness or unusual shortness of breath.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 3
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 5
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 7
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 10
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "movement-longer-way": {
                "clinicalBasis": "WHO (2020) counts all purposeful movement toward activity targets. CDC notes that replacing sitting with brief activity has immediate benefits. ACSM advises gradual increases in duration.",
                "limits": "This is a nudge, not a target. Your usual route is still a valid choice.",
                "safety": "Choose routes that feel safe and comfortable. Adapt the extra distance to the user's physical ability. Do not recommend progression when the user reports pain, discomfort or concerning symptoms.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 5
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 7
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 10
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 15
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "movement-fresh-air": {
                "clinicalBasis": "WHO (2020) recommends regular moderate activity, indoors or outdoors. ACSM FITT-VP supports gradual duration progression within personal tolerance. In heat, choose a cooler time and hydrate.",
                "limits": "In hot weather, choose shade, a cooler time or an indoor route.",
                "safety": "In hot weather, choose a cooler time and keep water nearby. Use sun protection and a safe route. Stop and seek advice if the user feels faint, dizzy or unusually breathless.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 7
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 10
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 12
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 15
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "movement-rhythm": {
                "clinicalBasis": "ACSM FITT-VP individualises frequency, intensity, time, type and progression. CDC highlights enjoyable, repeatable activity for adherence. Keep the effort comfortable and stop if symptoms appear.",
                "limits": "Keep the movement comfortable and safe for the space around you.",
                "safety": "Keep the pace comfortable and avoid sudden strenuous movement. Choose a clear space and supportive footwear. Stop and seek advice if the user feels pain, dizzy or unusually breathless.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 4
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 6
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 8
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 10
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "movement-reset": {
                "clinicalBasis": "ADA and Sports Medicine guidance supports short movement breaks to interrupt prolonged sitting, including brief post-meal walks. WHO (2020) confirms very short bouts count toward activity.",
                "limits": "If you have pain or a health condition, choose a comfortable alternative.",
                "safety": "Keep the break gentle, especially after long periods of sitting. Rise slowly if the user feels light-headed. Stop and seek advice if movement causes pain, dizziness or unusual shortness of breath.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 3
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 5
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 7
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 10
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "movement-reflect": {
                "clinicalBasis": "WHO (2020) and ACSM behaviour-change guidance support self-monitoring, review and gradual progression. Reflection helps sustain activity without pressure. This is not a substitute for medical advice.",
                "limits": "There is no perfect answer. The easiest option is useful information.",
                "safety": "Reflection should feel optional and pressure-free. Choose movements that match the user's ability and health context. This is wellbeing support, not medical advice.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 2
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 3
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 5
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 8
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            }
        }
    },
    "sleep": {
        "schemaVersion": "1.0.0",
        "catalogVersion": "1.0.0",
        "reviewedAt": "2026-11-14",
        "reviewedBy": "Habit-RPG content team",
        "reviewStatus": "internal_review",
        "expiresAt": "2027-11-14",
        "evidence": [
            {
                "id": "aasm-cbti-2021",
                "source": "AASM behavioural treatment of insomnia (CBT-I)",
                "year": 2021,
                "claim": "A consistent wake time, stimulus control and wind-down routines are core behavioural anchors."
            },
            {
                "id": "cdc-sleep",
                "source": "CDC Sleep and Sleep Disorders",
                "year": 2022,
                "claim": "Regular sleep habits and a restful environment support sleep health."
            },
            {
                "id": "aasm-sleep-hygiene",
                "source": "AASM sleep hygiene guidance",
                "year": 2021,
                "claim": "A dark, quiet, cool room and limited late caffeine support sleep."
            }
        ],
        "boundaries": {
            "not_for": [
                "Diagnosing or treating insomnia, sleep apnoea or another sleep disorder.",
                "Replacing clinician-led cognitive behavioural therapy for insomnia."
            ],
            "seek_help_if": [
                "Loud snoring, gasping or pauses in breathing during sleep.",
                "Severe daytime sleepiness, or falling asleep while driving or working.",
                "Insomnia that persists for several weeks or significantly affects daily life."
            ],
            "population_exclusions": [
                "Night-shift and rotating-shift workers may need personalised sleep timing advice.",
                "Follow clinical advice for sleep problems during pregnancy or with a chronic illness."
            ]
        },
        "safetyRules": {
            "screening": [
                "Ask about loud snoring, gasping, breathing pauses or severe daytime sleepiness.",
                "Ask whether sleep problems have lasted several weeks or affect safety during the day."
            ],
            "signals": [
                {
                    "code": "concerning_symptom",
                    "label": "Concerning sleep symptom",
                    "guidance": "Pause the sleep step and encourage a clinical review for breathing pauses, severe sleepiness or persistent insomnia."
                },
                {
                    "code": "distress",
                    "label": "Night-time distress",
                    "guidance": "Keep the step optional and encourage support from a qualified professional if worry or low mood is overwhelming."
                }
            ]
        },
        "habits": {
            "sleep-wake-time": {
                "clinicalBasis": "AASM CBT-I guidance treats a consistent wake time as a core circadian anchor, and CDC sleep guidance links regular sleep habits with better health. Keeping one wake time is a behavioural anchor, not a cure. (AASM 2021; CDC Sleep and Sleep Disorders)",
                "limits": "General wellbeing support, not treatment for insomnia or sleep apnoea. If sleep problems persist or you snore heavily, gasp, or feel very sleepy by day, speak with a clinician.",
                "safety": "Keep the wake time realistic rather than rigid. Allow a gentler version after a poor night. Do not present a fixed wake time as treatment for insomnia or sleep apnoea.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 2
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 3
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 5
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 7
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "sleep-wind-down": {
                "clinicalBasis": "AASM CBT-I includes stimulus control and a consistent pre-sleep routine. A short, screen-free wind-down helps cue the body for sleep, and CDC sleep guidance supports regular evening habits. (AASM 2021; CDC)",
                "limits": "General wellbeing support, not treatment for insomnia. If winding down does not help over weeks, or sleepiness affects safety, seek clinical advice.",
                "safety": "Start with three minutes if ten feels like too much. Keep the routine calming rather than demanding. Do not use the routine to delay needed medical or mental health care.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 10
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 12
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 15
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 20
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "sleep-worry-dump": {
                "clinicalBasis": "AASM CBT-I uses cognitive techniques such as constructive worry and thought records to reduce bedtime rumination. Writing worries down and parking them is a light, self-help version of that approach. (AASM 2021)",
                "limits": "This is a light reflection, not a substitute for mental health support. If worry or low mood is persistent, speak with a qualified professional.",
                "safety": "Keep the reflection brief and non-judgemental. Offer a spoken alternative for anyone who cannot write. Signpost professional support if worries feel unmanageable.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 3
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 5
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 7
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 10
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "sleep-room": {
                "clinicalBasis": "AASM and CDC sleep hygiene guidance supports a dark, quiet, comfortably cool bedroom. One small environmental change is enough; sleep hygiene alone does not treat chronic insomnia. (AASM 2021; CDC)",
                "limits": "General sleep-environment guidance, not medical advice. Persistent insomnia, loud snoring or breathing pauses need clinical assessment.",
                "safety": "Choose one change that is realistic for the person's home. Avoid suggestions that require buying equipment. Sleep hygiene alone does not treat chronic insomnia.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 2
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 3
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 5
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 7
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "sleep-caffeine": {
                "clinicalBasis": "AASM and CDC sleep hygiene guidance suggests limiting caffeine late in the day because it can delay sleep. A personal cutoff is a plan, not a rule; individual sensitivity varies. (AASM 2021; CDC)",
                "limits": "General guidance only. Follow advice from your healthcare professional, especially during pregnancy or with a heart condition.",
                "safety": "Caffeine sensitivity varies; avoid a rigid rule. Do not advise abrupt caffeine withdrawal for heavy users. Follow clinician advice during pregnancy or with heart conditions.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 1
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 2
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 3
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 5
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "sleep-morning-light": {
                "clinicalBasis": "Morning daylight helps anchor the circadian rhythm. AASM CBT-I principles and CDC sleep guidance support regular light exposure and a steady morning routine. Brief exposure is enough. (AASM 2021; CDC)",
                "limits": "General wellbeing support. Never look directly at the sun. Follow clinician advice if you have light sensitivity or a photosensitive condition.",
                "safety": "Avoid staring directly at the sun. Use a shaded outdoor space or bright window instead. Follow advice if light sensitivity or a skin condition is present.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 5
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 7
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 10
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 15
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "sleep-notice": {
                "clinicalBasis": "AASM CBT-I uses sleep diaries to reveal patterns without judgement. A simple note is self-monitoring, not a diagnosis. Persistent insomnia or breathing pauses need clinical review. (AASM 2021)",
                "limits": "A note is not a diagnosis. Share ongoing sleep concerns, loud snoring or daytime sleepiness with a qualified professional.",
                "safety": "Keep the note simple and free of pressure. Do not interpret the note as a diagnosis. Share ongoing sleep concerns with a qualified professional.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 2
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 3
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 5
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 7
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            }
        }
    },
    "nutrition": {
        "schemaVersion": "1.0.0",
        "catalogVersion": "1.0.0",
        "reviewedAt": "2026-11-14",
        "reviewedBy": "Habit-RPG content team",
        "reviewStatus": "internal_review",
        "expiresAt": "2027-11-14",
        "evidence": [
            {
                "id": "who-healthy-diet-2020",
                "source": "WHO healthy diet guidance",
                "year": 2020,
                "claim": "Vegetables, fruit, pulses and whole grains form the basis of a healthy diet."
            },
            {
                "id": "ada-nutrition-2019",
                "source": "ADA nutrition therapy guidance",
                "year": 2019,
                "claim": "Meal pattern and vegetable-first approaches can support glucose management."
            },
            {
                "id": "cdc-healthy-eating",
                "source": "CDC healthy eating guidance",
                "year": 2023,
                "claim": "Slow eating and water as the default drink support balanced eating."
            },
            {
                "id": "who-sugar-2015",
                "source": "WHO sugar intake guidance",
                "year": 2015,
                "claim": "Limiting free sugars and sugary drinks supports a healthier diet."
            }
        ],
        "boundaries": {
            "not_for": [
                "Medical nutrition therapy, diagnosis or treatment of a health condition.",
                "Prescribing weight loss, supplements or an eating plan for a medical condition.",
                "Treating disordered eating or body-image concerns."
            ],
            "seek_help_if": [
                "A food allergy or intolerance causes a reaction.",
                "Eating, body image or weight concerns feel distressing or out of control.",
                "You have diabetes, kidney disease or another condition needing individual nutrition advice."
            ],
            "population_exclusions": [
                "Follow a clinician-prescribed diet exactly as advised.",
                "Adapt texture, cultural and allergy needs with a dietitian where needed."
            ]
        },
        "safetyRules": {
            "screening": [
                "Ask about food allergies, medically restricted diets and disordered eating history.",
                "Ask whether a clinician or dietitian has given individual nutrition advice."
            ],
            "signals": [
                {
                    "code": "concerning_symptom",
                    "label": "Food-related concern",
                    "guidance": "Pause the nutrition step and seek advice for allergic reactions, distress around eating or a medical diet conflict."
                },
                {
                    "code": "distress",
                    "label": "Eating distress",
                    "guidance": "Keep the step optional and encourage support from a qualified professional if meals or body image feel distressing."
                }
            ]
        },
        "habits": {
            "nutrition-veggie-first": {
                "clinicalBasis": "WHO healthy-diet guidance recommends eating vegetables and fruit daily. ADA nutrition guidance notes that starting meals with non-starchy vegetables can support blood-glucose management. This is a gentle sequence, not a prescription. (WHO 2020; ADA 2019)",
                "limits": "General nutrition education, not medical nutrition therapy. If you have diabetes, kidney disease, food allergies or a history of disordered eating, follow your clinician's advice.",
                "safety": "Respect allergies, intolerances and cultural food preferences. Offer frozen, canned or pre-prepared vegetables as valid options. Do not frame foods as good or bad.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 2
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 3
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 5
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 7
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "nutrition-water-anchor": {
                "clinicalBasis": "CDC and WHO guidance supports water as the default drink and limiting sugary drinks. Anchoring water to an existing routine makes the choice easier; fluid needs vary with health conditions. (CDC; WHO 2015)",
                "limits": "General guidance, not a fluid prescription. Follow medical advice if you have heart, kidney or fluid-restriction needs.",
                "safety": "Fluid needs vary with health conditions and medication. Do not encourage excessive water intake. Follow clinician advice for heart, kidney or fluid-restriction conditions.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 1
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 2
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 3
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 5
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "nutrition-half-plate": {
                "clinicalBasis": "WHO healthy-diet guidance describes balanced meals rich in vegetables and fruit, with whole grains and pulses. ADA materials use plate methods for portion awareness. Follow personalised advice if you have diabetes or kidney disease. (WHO 2020; ADA)",
                "limits": "General nutrition education, not medical nutrition therapy. Plate guidance may not fit diabetes, kidney disease or culturally specific meals; adapt with a professional.",
                "safety": "Plate proportions are a guide, not a strict rule. Adapt for cultural meals, allergies and medical diets. Avoid calorie counting or restrictive framing.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 5
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 7
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 10
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 15
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "nutrition-protein-pair": {
                "clinicalBasis": "ADA nutrition guidance encourages including protein with meals to support satiety and glucose stability; WHO highlights pulses, fish, eggs and lean meats within a balanced diet. Portion and type should fit medical advice. (ADA; WHO 2020)",
                "limits": "General nutrition education. If you have kidney disease, a medically restricted diet or food allergies, follow your clinician's or dietitian's advice.",
                "safety": "Respect allergies and dietary preferences. Offer plant and animal protein options equally. Follow renal or medical diet advice where protein is restricted.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 2
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 3
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 5
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 7
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "nutrition-mindful-pause": {
                "clinicalBasis": "CDC healthy-eating guidance and ADA diabetes self-management support slow, mindful eating to notice fullness. A brief pause is a self-help cue, not a treatment for disordered eating. (CDC; ADA)",
                "limits": "General wellbeing support, not treatment for disordered eating. If meals or body image feel distressing, speak with a qualified professional.",
                "safety": "Keep the pause brief and optional. Do not use mindful eating to restrict food or delay needed care. Signpost support if eating feels distressing.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 1
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 2
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 3
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 5
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            }
        }
    },
    "smoking": {
        "schemaVersion": "1.0.0",
        "catalogVersion": "1.0.0",
        "reviewedAt": "2026-11-14",
        "reviewedBy": "Habit-RPG content team",
        "reviewStatus": "internal_review",
        "expiresAt": "2027-11-14",
        "evidence": [
            {
                "id": "who-2024",
                "source": "WHO tobacco cessation guidance",
                "year": 2024,
                "claim": "Behavioural support plus approved medication improves cessation success."
            },
            {
                "id": "usphs-2008",
                "source": "USPHS clinical practice guideline",
                "year": 2008,
                "claim": "Identify triggers and rehearse coping responses alongside counselling."
            },
            {
                "id": "cdc-cravings",
                "source": "CDC smoking cessation resources",
                "year": 2023,
                "claim": "Cravings are time-limited and can be interrupted with coping actions."
            }
        ],
        "boundaries": {
            "not_for": [
                "Prescribing or managing cessation medication.",
                "Replacing a cessation service, counsellor or clinician.",
                "Managing severe withdrawal or acute medical symptoms on its own."
            ],
            "seek_help_if": [
                "Chest pain, severe breathlessness or fainting.",
                "Withdrawal symptoms feel unmanageable, or low mood is overwhelming.",
                "You are pregnant, or managing heart or lung disease."
            ],
            "population_exclusions": [
                "Follow clinical advice if you need supervised cessation medication.",
                "Use a specialist cessation service for high dependence or complex medical needs."
            ]
        },
        "safetyRules": {
            "screening": [
                "Ask about pregnancy, heart or lung disease and current cessation medication.",
                "Ask whether withdrawal symptoms or low mood feel unmanageable."
            ],
            "signals": [
                {
                    "code": "concerning_symptom",
                    "label": "Concerning symptom",
                    "guidance": "Pause the step and seek medical advice for chest pain, severe breathlessness or fainting."
                },
                {
                    "code": "withdrawal_distress",
                    "label": "Withdrawal distress",
                    "guidance": "Encourage contact with a cessation service or clinician and keep the next step small."
                }
            ]
        },
        "habits": {
            "smoking-delay-5": {
                "clinicalBasis": "WHO 2024 tobacco-cessation guidance and USPHS treat urge surfing and delaying the next cigarette as practical behavioural supports alongside pharmacotherapy and counselling. A five-minute delay is a coping step, not a substitute for cessation treatment. (WHO 2024; USPHS 2008)",
                "limits": "General cessation support, not medical treatment. Combining counselling with approved cessation medication is most effective. Seek clinical advice if you are pregnant or have heart or lung disease.",
                "safety": "Never suggest cutting down instead of seeking evidence-based cessation care. Avoid blame or moralising language. Signpost professional cessation support and approved medication.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 5
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 7
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 10
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 15
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "smoking-water-breath": {
                "clinicalBasis": "CDC describes cravings as time-limited urges that peak and pass; slow breathing and drinking water can interrupt the cue-response. USPHS guidelines recommend combining behavioural coping with evidence-based cessation support. (CDC; USPHS 2008)",
                "limits": "General cessation support, not medical treatment. Cravings that feel unmanageable or come with chest pain need clinical advice.",
                "safety": "Keep breathing slow and comfortable, never forced. Do not use water intake to replace medical care. Signpost cessation services rather than implying willpower is enough.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 2
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 3
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 5
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 7
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "smoking-trigger-swap": {
                "clinicalBasis": "USPHS and WHO guidance recommend identifying triggers and rehearsing alternative behaviours. Swapping one routine cue is a behavioural substitution; pairing it with counselling or medication improves success. (USPHS 2008; WHO 2024)",
                "limits": "General cessation support, not medical treatment. A trigger swap works best alongside counselling and approved cessation medication.",
                "safety": "Avoid encouraging smoking as a coping tool. Keep replacement actions realistic and low cost. Signpost cessation services and approved medication.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 3
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 5
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 7
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 10
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "smoking-clear-cue": {
                "clinicalBasis": "USPHS clinical guidance supports removing smoking cues from the environment and planning around high-risk situations. Changing one cue is a small environmental step, not a guarantee. (USPHS 2008)",
                "limits": "General cessation support. Removing cues helps but does not replace counselling or approved medication, especially with heavy dependence.",
                "safety": "Choose one change that does not create conflict with others at home. Do not imply that environment change alone is treatment. Signpost professional support.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 2
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 3
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 5
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 7
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            },
            "smoking-notice-trigger": {
                "clinicalBasis": "CDC craving science and USPHS guidance encourage self-monitoring of triggers without self-blame. Noticing a pattern helps choose a coping response; persistent cravings may need clinical support. (CDC; USPHS 2008)",
                "limits": "General cessation support, not treatment. If cravings or withdrawal feel overwhelming, contact a cessation service or clinician.",
                "safety": "Keep the note brief and non-judgemental. Do not frame a slip as failure. Offer professional support if urges feel overwhelming.",
                "progressionLevels": [
                    {
                        "level": 1,
                        "name": "Getting started",
                        "minutes": 1
                    },
                    {
                        "level": 2,
                        "name": "Building consistency",
                        "minutes": 2
                    },
                    {
                        "level": 3,
                        "name": "Growing stronger",
                        "minutes": 3
                    },
                    {
                        "level": 4,
                        "name": "Making it a routine",
                        "minutes": 5
                    }
                ],
                "progressionPolicy": {
                    "enabled": true,
                    "strategy": "feedback_gated",
                    "lookback_sessions": 5,
                    "min_successful_sessions": 2,
                    "required_feedback": [
                        "easy",
                        "comfortable"
                    ]
                },
                "measure": "duration_minutes"
            }
        }
    }
};

export function getGeneratedCatalog(domain) {
    return GENERATED_HABIT_CATALOGS[domain] ?? null;
}

export function getGeneratedHabit(domain, habitId) {
    return GENERATED_HABIT_CATALOGS[domain]?.habits?.[habitId] ?? null;
}
