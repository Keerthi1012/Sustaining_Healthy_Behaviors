import { useEffect, useRef, useState } from "react";

import {
    getDemoDateKey,
    getNow,
    subscribeDemoClock,
} from "../services/demoClock";
import { getNudgeDecision } from "../services/nudgeEngine";
import {
    loadNudgeState,
    recordNudgeSent,
    snoozeNudges,
} from "../services/nudgeState";
import { toDateKey } from "../utils/date";

export const NUDGE_TICK_MS = 30000;
export const NUDGE_SNOOZE_MINUTES = 90;

function isNudgeMomentActionable(plan, nudge) {
    const moment = nudge?.moment;
    const day = plan?.days?.find((item) => item.id === moment?.dayId);
    const entry = moment?.slot ? day?.[moment.slot] : null;

    return Boolean(
        entry &&
            entry.status === "planned" &&
            (!moment.date || day.date === moment.date)
    );
}

export function useNudgeScheduler({
    userId,
    plan,
    schedule,
    enabled,
}) {
    const [activeNudge, setActiveNudge] = useState(null);
    const seenRef = useRef(null);

    useEffect(() => {
        if (!enabled || !plan || !userId) {
            return undefined;
        }

        let cancelled = false;

        const evaluate = () => {
            if (cancelled) return;

            const now = getNow();
            const dateKey = getDemoDateKey();
            const state = loadNudgeState(userId, now);
            const decision = getNudgeDecision({
                now,
                schedule,
                plan,
                enabled: true,
                lastSentAtByDomain: state.lastSentAtByDomain,
                sentCountToday: state.count,
                snoozedUntil: state.snoozedUntil,
                dateKey,
            });

            if (
                !decision.show ||
                !isNudgeMomentActionable(plan, decision)
            ) {
                seenRef.current = null;
                setActiveNudge(null);
                return;
            }

            const key = [
                toDateKey(now),
                decision.domain,
                decision.moment.dayId,
                decision.moment.slot,
                decision.window.start,
            ].join(":");

            if (seenRef.current === key) return;

            seenRef.current = key;
            recordNudgeSent(userId, decision.domain, now);
            setActiveNudge(decision);
        };

        evaluate();

        const interval = window.setInterval(evaluate, NUDGE_TICK_MS);
        const handleFocus = () => evaluate();
        const unsubscribe = subscribeDemoClock(() => {
            seenRef.current = null;
            setActiveNudge(null);
            evaluate();
        });

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleFocus);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
            unsubscribe();
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener(
                "visibilitychange",
                handleFocus
            );
        };
    }, [userId, plan, schedule, enabled]);

    const dismiss = () => {
        setActiveNudge(null);
    };

    const snooze = () => {
        if (userId) {
            snoozeNudges(userId, NUDGE_SNOOZE_MINUTES, getNow());
        }

        seenRef.current = null;
        setActiveNudge(null);
    };

    return {
        nudge:
            enabled && plan && userId ? activeNudge : null,
        dismiss,
        snooze,
    };
}
