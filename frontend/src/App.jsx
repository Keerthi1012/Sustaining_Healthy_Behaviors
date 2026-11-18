import { useCallback, useEffect, useRef, useState } from "react";
import WelcomePage from "./components/WelcomePage";
import GoalSelectionPage from "./components/GoalSelectionPage";
import PersonalisationPage from "./components/PersonalisationPage";
import AuthPage from "./components/auth/AuthPage";
import WorldPage from "./components/world/WorldPage";
import WorldGamePage from "./game/WorldGamePage";
import { useI18n } from "./i18n";
import { buildPlanAsync } from "./services/planEngine";
import { buildScheduleFromProfile } from "./services/realmSchedule";
import {
    clearJourney,
    loadJourney,
    loadOrMigrateJourney,
    saveJourney,
} from "./services/planStore";
import {
    loadEcosystemContext,
    resetEcosystemContext,
    saveEcosystemContext,
} from "./services/ecosystemStore";
import {
    clearSession,
    loadSession,
    saveSession,
} from "./services/authStore";
import { getCurrentUser, logoutAccount } from "./services/authApi";
import { isBackendJourneyEnabled } from "./services/config";
import {
    completeCurrentJourney,
    deleteCurrentJourney,
    getCurrentJourney,
    putCurrentJourney,
} from "./services/journeyApi";
import {
    clearOutbox,
    clearSyncState,
    createIdempotencyKey,
    loadOutbox,
    loadSyncState,
    queuePendingCommand,
    removePendingCommand,
    saveSyncState,
    syncJourneyOnLogin,
} from "./services/journeySync";

function getBootstrapState() {
    const session = loadSession();
    const journey = session
        ? loadJourney(session.user.user_id)
        : null;

    return {
        session,
        journey,
        currentPage: journey?.plan ? "world" : "welcome",
        authChecking: Boolean(session),
    };
}

function App() {
    const { t } = useI18n();
    const [bootstrap] = useState(getBootstrapState);
    const [session, setSession] = useState(bootstrap.session);
    const [journey, setJourney] = useState(bootstrap.journey);
    const [currentPage, setCurrentPage] = useState(bootstrap.currentPage);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [authChecking, setAuthChecking] = useState(bootstrap.authChecking);
    const [syncNotice, setSyncNotice] = useState("");
    const syncRef = useRef({
        revision: bootstrap.session
            ? loadSyncState(bootstrap.session.user.user_id).revision
            : 0,
        dirty: false,
        queue: Promise.resolve(),
        changeVersion: 0,
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentPage, authChecking]);

    useEffect(() => {
        if (!syncNotice) return undefined;

        const timeout = window.setTimeout(
            () => setSyncNotice(""),
            6500
        );
        return () => window.clearTimeout(timeout);
    }, [syncNotice]);

    const uploadJourney = useCallback(
        async (activeSession, nextJourney) => {
            const token = activeSession?.token;
            const userId = activeSession?.user?.user_id;

            if (
                !isBackendJourneyEnabled() ||
                !token ||
                !userId ||
                !nextJourney
            ) {
                return null;
            }

            if (loadOutbox(userId).length) {
                syncRef.current.dirty = true;
                saveSyncState(userId, {
                    revision: syncRef.current.revision,
                    dirty: true,
                });
                return null;
            }

            const version = ++syncRef.current.changeVersion;

            try {
                const result = await putCurrentJourney(
                    token,
                    nextJourney,
                    syncRef.current.revision
                );
                const isCurrent =
                    version === syncRef.current.changeVersion;

                syncRef.current.revision = result.revision;
                syncRef.current.dirty = !isCurrent;
                saveSyncState(userId, {
                    revision: result.revision,
                    dirty: !isCurrent,
                });

                if (isCurrent) {
                    saveJourney(userId, result.journey);
                    setJourney(result.journey);
                }

                return result;
            } catch (error) {
                if (error?.status === 409) {
                    try {
                        const latest = await getCurrentJourney(token);
                        if (latest) {
                            syncRef.current.revision =
                                latest.revision;

                            if (
                                version ===
                                syncRef.current.changeVersion
                            ) {
                                syncRef.current.dirty = false;
                                saveSyncState(userId, {
                                    revision: latest.revision,
                                    dirty: false,
                                });
                                saveJourney(
                                    userId,
                                    latest.journey
                                );
                                setJourney(latest.journey);
                            } else {
                                syncRef.current.dirty = true;
                                saveSyncState(userId, {
                                    revision: latest.revision,
                                    dirty: true,
                                });
                            }

                            setSyncNotice(t("sync.conflictRefreshed"));
                        }
                    } catch {
                        // Keep the local journey and retry later.
                    }

                    return null;
                }

                syncRef.current.dirty = true;
                saveSyncState(userId, {
                    revision: syncRef.current.revision,
                    dirty: true,
                });
                setSyncNotice(t("sync.savedLocal"));
                return null;
            }
        },
        [t]
    );

    const enqueueUpload = useCallback(
        (activeSession, nextJourney) => {
            const userId = activeSession?.user?.user_id;
            if (!userId) return;

            syncRef.current.dirty = true;
            saveSyncState(userId, {
                revision: syncRef.current.revision,
                dirty: true,
            });
            syncRef.current.queue = syncRef.current.queue
                .then(() =>
                    uploadJourney(activeSession, nextJourney)
                )
                .catch(() => {});
        },
        [uploadJourney]
    );

    const flushPendingSync = useCallback(
        async (activeSession) => {
            const token = activeSession?.token;
            const userId = activeSession?.user?.user_id;

            if (
                !isBackendJourneyEnabled() ||
                !token ||
                !userId
            ) {
                return;
            }

            let commands = loadOutbox(userId);

            for (const command of commands) {
                try {
                    if (command.type === "reset") {
                        await deleteCurrentJourney(token);
                        removePendingCommand(
                            userId,
                            command.idempotencyKey
                        );
                        continue;
                    }

                    if (command.type !== "complete") {
                        removePendingCommand(
                            userId,
                            command.idempotencyKey
                        );
                        continue;
                    }

                    const result = await completeCurrentJourney({
                        token,
                        dayId: command.payload.dayId,
                        slot: command.payload.slot,
                        feedback: command.payload.feedback,
                        expectedRevision:
                            syncRef.current.revision,
                        idempotencyKey: command.idempotencyKey,
                    });

                    syncRef.current.revision = result.revision;
                    syncRef.current.dirty = false;
                    saveSyncState(userId, {
                        revision: result.revision,
                        dirty: false,
                    });
                    saveJourney(userId, result.journey);
                    setJourney(result.journey);
                    removePendingCommand(
                        userId,
                        command.idempotencyKey
                    );
                } catch (error) {
                    if (error?.status === 409) {
                        try {
                            const latest =
                                await getCurrentJourney(token);
                            if (latest) {
                                syncRef.current.revision =
                                    latest.revision;
                                saveJourney(
                                    userId,
                                    latest.journey
                                );
                                setJourney(latest.journey);
                                saveSyncState(userId, {
                                    revision: latest.revision,
                                    dirty: false,
                                });
                            }
                        } catch {
                            syncRef.current.dirty = true;
                        }

                        clearOutbox(userId);
                        setSyncNotice(t("sync.offlinePartial"));
                        return;
                    }

                    if (error?.status && error.status < 500) {
                        removePendingCommand(
                            userId,
                            command.idempotencyKey
                        );
                        setSyncNotice(t("sync.offlineOne"));
                        continue;
                    }

                    syncRef.current.dirty = true;
                    saveSyncState(userId, {
                        revision: syncRef.current.revision,
                        dirty: true,
                    });
                    return;
                }
            }

            commands = loadOutbox(userId);
            if (
                !commands.length &&
                syncRef.current.dirty
            ) {
                const local = loadJourney(userId);
                if (local) {
                    await uploadJourney(activeSession, local);
                }
            }
        },
        [uploadJourney, t]
    );

    const applySyncedJourney = useCallback(
        (activeSession, synced) => {
            const userId = activeSession?.user?.user_id;
            if (!userId) return;

            if (synced?.journey) {
                saveJourney(userId, synced.journey);
            }

            const stored = loadSyncState(userId);
            syncRef.current.revision = synced?.revision ?? 0;
            syncRef.current.dirty = stored.dirty;
            syncRef.current.changeVersion = 0;

            setJourney(synced?.journey ?? null);
            setCurrentPage(
                synced?.journey?.plan ? "world" : "welcome"
            );

            if (synced?.status === "conflict") {
                setSyncNotice(t("sync.conflictOtherDevice"));
            } else if (synced?.status === "offline") {
                setSyncNotice(t("sync.offline"));
            }
        },
        [t]
    );

    const runCompletion = useCallback(
        async (activeSession, command) => {
            const token = activeSession?.token;
            const userId = activeSession?.user?.user_id;

            if (
                !isBackendJourneyEnabled() ||
                !token ||
                !userId
            ) {
                return null;
            }

            let expectedRevision = syncRef.current.revision;

            const send = () =>
                completeCurrentJourney({
                    token,
                    dayId: command.dayId,
                    slot: command.slot,
                    feedback: command.feedback,
                    expectedRevision,
                    idempotencyKey: command.idempotencyKey,
                });

            try {
                let result;

                try {
                    result = await send();
                } catch (error) {
                    if (error?.status !== 409) {
                        throw error;
                    }

                    const latest =
                        await getCurrentJourney(token);
                    if (!latest) {
                        throw error;
                    }

                    syncRef.current.revision =
                        latest.revision;
                    expectedRevision = latest.revision;
                    saveJourney(userId, latest.journey);
                    setJourney(latest.journey);
                    result = await send();
                }

                syncRef.current.revision = result.revision;
                syncRef.current.dirty = false;
                saveSyncState(userId, {
                    revision: result.revision,
                    dirty: false,
                });
                saveJourney(userId, result.journey);
                setJourney(result.journey);
                return result;
            } catch (error) {
                if (error?.status === 409) {
                    setSyncNotice(t("sync.stepUpdated"));
                    return null;
                }

                if (error?.status && error.status < 500) {
                    setSyncNotice(t("sync.stepFailed"));
                    return null;
                }

                queuePendingCommand(userId, {
                    type: "complete",
                    idempotencyKey: command.idempotencyKey,
                    payload: {
                        dayId: command.dayId,
                        slot: command.slot,
                        feedback: command.feedback,
                    },
                    createdAt: new Date().toISOString(),
                });
                syncRef.current.dirty = true;
                saveSyncState(userId, {
                    revision: syncRef.current.revision,
                    dirty: true,
                });
                setSyncNotice(t("sync.savedLocalFinish"));
                return null;
            }
        },
        [t]
    );

    useEffect(() => {
        const token = bootstrap.session?.token;

        if (!token) {
            return undefined;
        }

        let active = true;

        (async () => {
            try {
                const user = await getCurrentUser(token);
                if (!active) return;

                const nextSession = {
                    ...bootstrap.session,
                    user,
                };
                const localJourney = loadOrMigrateJourney(
                    user.user_id
                );

                saveSession(nextSession);
                setSession(nextSession);

                const synced = await syncJourneyOnLogin({
                    token: nextSession.token,
                    userId: user.user_id,
                    localJourney,
                });
                if (!active) return;

                applySyncedJourney(nextSession, synced);
                setAuthChecking(false);
                await flushPendingSync(nextSession);
            } catch (error) {
                if (!active) return;

                if (error?.status === 401) {
                    clearSession();
                    setSession(null);
                    setJourney(null);
                    setSelectedGoal(null);
                    setCurrentPage("welcome");
                }

                setAuthChecking(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [
        bootstrap,
        applySyncedJourney,
        flushPendingSync,
    ]);

    useEffect(() => {
        if (
            !session?.token ||
            !isBackendJourneyEnabled()
        ) {
            return undefined;
        }

        const flush = () => {
            flushPendingSync(session);
        };
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                flush();
            }
        };

        window.addEventListener("online", flush);
        document.addEventListener(
            "visibilitychange",
            handleVisibility
        );

        return () => {
            window.removeEventListener("online", flush);
            document.removeEventListener(
                "visibilitychange",
                handleVisibility
            );
        };
    }, [session, flushPendingSync]);

    const handleAuthenticated = async (authResponse) => {
        const nextSession = {
            token: authResponse.token,
            user: authResponse.user,
        };
        const localJourney = loadOrMigrateJourney(
            nextSession.user.user_id
        );

        saveSession(nextSession);
        setSession(nextSession);
        setJourney(localJourney);
        setSelectedGoal(null);
        setCurrentPage(
            localJourney?.plan ? "world" : "welcome"
        );
        setAuthChecking(true);

        try {
            const synced = await syncJourneyOnLogin({
                token: nextSession.token,
                userId: nextSession.user.user_id,
                localJourney,
            });
            applySyncedJourney(nextSession, synced);
            setAuthChecking(false);
            await flushPendingSync(nextSession);
        } catch {
            setAuthChecking(false);
            setSyncNotice(t("sync.serviceUnavailable"));
        }
    };

    const handleLogout = () => {
        const token = session?.token;

        syncRef.current.changeVersion += 1;
        clearSession();
        setSession(null);
        setJourney(null);
        setSelectedGoal(null);
        setCurrentPage("welcome");

        if (token) {
            logoutAccount(token).catch(() => {});
        }
    };

    const handleBegin = () => {
        setCurrentPage("goals");
    };

    const handleBack = () => {
        setCurrentPage("welcome");
    };

    const handleGoalContinue = (goal) => {
        setSelectedGoal(goal);
        setCurrentPage("personalisation");
    };

    const handleJourneyChange = useCallback(
        (nextJourney, options = {}) => {
            if (!session) return;

            const userId = session.user.user_id;

            setJourney(nextJourney);
            saveJourney(userId, nextJourney);

            if (!isBackendJourneyEnabled()) {
                return;
            }

            if (options.fromServer) {
                syncRef.current.revision =
                    options.revision ??
                    syncRef.current.revision;
                syncRef.current.dirty = false;
                saveSyncState(userId, {
                    revision: syncRef.current.revision,
                    dirty: false,
                });
                return;
            }

            syncRef.current.dirty = true;
            saveSyncState(userId, {
                revision: syncRef.current.revision,
                dirty: true,
            });

            if (!options.skipSync) {
                enqueueUpload(session, nextJourney);
            }
        },
        [session, enqueueUpload]
    );

    const handleCompleteJourney = useCallback(
        (command) => {
            if (!session) {
                return Promise.resolve(null);
            }

            const task = syncRef.current.queue.then(() =>
                runCompletion(session, command)
            );
            syncRef.current.queue = task.catch(() => {});
            return task;
        },
        [session, runCompletion]
    );

    const handlePersonalisationComplete = async (
        profile,
        ecosystemContext
    ) => {
        if (!session) return;

        const userId = session.user.user_id;
        const savedContext = saveEcosystemContext(
            userId,
            ecosystemContext
        );
        const plan = await buildPlanAsync(profile, undefined, {
            token: session.token,
            ecosystemContext: savedContext,
        });
        const schedule = buildScheduleFromProfile(profile, {
            shiftWorker: savedContext.contextFlags.shiftWorker,
        });
        const nextJourney = {
            profile,
            plan,
            preferences: {
                showReturnCard: true,
                quietWorld: false,
                soundEnabled: true,
                schedule,
                nudges: {
                    enabled: true,
                    channel: "in_app",
                },
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        handleJourneyChange(nextJourney);
        setCurrentPage("world");
    };

    const handleReset = () => {
        if (!session) return;

        const userId = session.user.user_id;
        const token = session.token;

        clearJourney(userId);
        clearSyncState(userId);
        clearOutbox(userId);
        resetEcosystemContext(userId);
        syncRef.current.changeVersion += 1;
        syncRef.current.revision = 0;
        syncRef.current.dirty = false;
        setJourney(null);
        setSelectedGoal(null);
        setCurrentPage("welcome");

        if (!isBackendJourneyEnabled()) {
            return;
        }

        const idempotencyKey = createIdempotencyKey();
        queuePendingCommand(userId, {
            type: "reset",
            idempotencyKey,
            createdAt: new Date().toISOString(),
        });

        syncRef.current.queue = syncRef.current.queue
            .then(async () => {
                try {
                    await deleteCurrentJourney(token);
                    removePendingCommand(userId, idempotencyKey);
                    saveSyncState(userId, {
                        revision: 0,
                        dirty: false,
                    });
                } catch {
                    // The reset stays queued for the next sync.
                }
            })
            .catch(() => {});
    };

    if (authChecking) {
        return <AuthPage checking />;
    }

    if (!session) {
        return <AuthPage onAuthenticated={handleAuthenticated} />;
    }

    return (
        <>
            {currentPage === "welcome" && (
                <WelcomePage onBegin={handleBegin} />
            )}

            {currentPage === "goals" && (
                <GoalSelectionPage
                    onContinue={handleGoalContinue}
                    onBack={handleBack}
                />
            )}

            {currentPage === "personalisation" && (
                <PersonalisationPage
                    goal={selectedGoal}
                    onBack={() => setCurrentPage("goals")}
                    onComplete={handlePersonalisationComplete}
                    initialEcosystemContext={
                        session
                            ? loadEcosystemContext(session.user.user_id)
                            : undefined
                    }
                />
            )}

            {currentPage === "world" && journey?.plan && (
                <WorldPage
                    journey={journey}
                    user={session.user}
                    token={session.token}
                    onJourneyChange={handleJourneyChange}
                    onCompleteJourney={handleCompleteJourney}
                    syncNotice={syncNotice}
                    onReset={handleReset}
                    onLogout={handleLogout}
                    onOpenAdventure={() => setCurrentPage("adventure")}
                />
            )}

            {currentPage === "adventure" && journey?.plan && (
                <WorldGamePage
                    journey={journey}
                    user={session.user}
                    onExit={() => setCurrentPage("world")}
                    onLogout={handleLogout}
                />
            )}
        </>
    );
}

export default App;
