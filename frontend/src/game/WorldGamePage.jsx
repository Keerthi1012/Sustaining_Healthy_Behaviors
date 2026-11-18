import { useEffect } from "react";
import {
    Apple,
    ArrowLeft,
    Compass,
    Footprints,
    Moon,
    Sprout,
    Wind,
} from "lucide-react";

import UserMenu from "../components/ui/UserMenu";
import LanguageSwitch from "../components/ui/LanguageSwitch";
import VillageScene from "./VillageScene";
import OutcomesPanel from "./OutcomesPanel";
import { useI18n } from "../i18n";
import { getPlannedEntries } from "../services/planEngine";
import { loadEcosystemContext } from "../services/ecosystemStore";
import { getOutcomeMetrics } from "../services/outcomeMetrics";
import { getWorldGrowth, WORLD_REALMS } from "./world";
import { getVillageStorageKey, getLegacyVillageStorageKey } from "./storage";
import "./AdventurePage.css";
import "./WorldGamePage.css";

const REALM_ICONS = {
    footprints: Footprints,
    moon: Moon,
    apple: Apple,
    wind: Wind,
};

function WorldGamePage({ journey, user, onExit, onLogout }) {
    const { t, locale } = useI18n();
    const plan = journey?.plan ?? null;
    const planId = plan?.id ?? "journey";
    const growth = getWorldGrowth(plan);
    const plannedEntries = plan ? getPlannedEntries(plan) : [];
    const completedPercent = plannedEntries.length
        ? Math.round((growth.total / plannedEntries.length) * 100)
        : 0;
    const storedContext = user?.user_id
        ? loadEcosystemContext(user.user_id)
        : null;
    const outcomeMetrics = getOutcomeMetrics(plan, storedContext, {
        locale,
    });

    useEffect(() => {
        try {
            window.localStorage.removeItem(getVillageStorageKey(planId));
            window.localStorage.removeItem(getLegacyVillageStorageKey(planId));
        } catch {
            // Storage reset is best effort.
        }
    }, [planId]);

    const recentUnlocks = [...growth.unlocks].reverse().slice(0, 4);

    return (
        <main className="village-page world-game">
            <a className="skip-link" href="#world-realms">
                {t("world.game.realms")}
            </a>

            <header className="village-topbar">
                <button
                    className="back-button village-back"
                    type="button"
                    onClick={onExit}
                    aria-label={t("world.game.back")}
                >
                    <ArrowLeft
                        className="icon-directional"
                        size={16}
                        aria-hidden="true"
                    />
                    <span className="village-back__label">
                        {t("world.game.back")}
                    </span>
                </button>

                <div className="village-brand">
                    <span className="village-brand__mark" aria-hidden="true">
                        <Sprout size={18} />
                    </span>
                    <span className="village-brand__text">
                        <span className="village-brand__eyebrow">
                            {t("brand.name")}
                        </span>
                        <strong>{t("world.game.title")}</strong>
                    </span>
                </div>

                <div className="village-topbar__end">
                    <LanguageSwitch />
                    <UserMenu user={user} onLogout={onLogout} />
                </div>
            </header>

            <section className="village-intro" aria-labelledby="world-title">
                <p className="eyebrow">{t("welcome.navTagline")}</p>
                <h1 id="world-title">{t("world.game.title")}</h1>
                <p className="village-intro__lead">{t("world.game.lead")}</p>
            </section>

            <section className="world-growth" aria-labelledby="world-growth-title">
                <div className="world-growth__head">
                    <div>
                        <p className="eyebrow">{t("world.game.level")}</p>
                        <h2 id="world-growth-title">
                            {t("world.game.steps", { count: growth.total })}
                        </h2>
                    </div>
                    <span className="world-growth__count">
                        {t("world.game.stepsCount", {
                            completed: growth.total,
                            total: plannedEntries.length,
                        })}
                    </span>
                </div>

                <span
                    className="village-progress__track world-growth__track"
                    role="progressbar"
                    aria-label={t("world.game.level")}
                    aria-valuemin={0}
                    aria-valuemax={plannedEntries.length || 1}
                    aria-valuenow={growth.total}
                >
                    <span style={{ width: `${completedPercent}%` }} />
                </span>

                <p className="world-growth__next">
                    {growth.next
                        ? growth.next.remaining > 1
                            ? t("world.game.nextRemaining", {
                                  remaining: growth.next.remaining,
                                  realm: t(growth.next.realmLabelKey),
                              })
                            : t("world.game.next", {
                                  realm: t(growth.next.realmLabelKey),
                              })
                        : t("world.game.complete")}
                </p>
            </section>

            <OutcomesPanel metrics={outcomeMetrics} />

            <div className="village-layout">
                <section
                    className="village-map-card"
                    aria-labelledby="world-map-title"
                >
                    <header className="village-map-card__head">
                        <div>
                            <p className="eyebrow">{t("world.game.title")}</p>
                            <h2 id="world-map-title">{t("world.game.title")}</h2>
                        </div>
                        <span className="village-map-card__note">
                            {t("world.game.steps", { count: growth.total })}
                        </span>
                    </header>

                    <div className="village-map">
                        <VillageScene
                            lanternLit={growth.layers.includes("lantern")}
                            layers={growth.layers}
                        />
                    </div>
                </section>

                <aside className="village-side" aria-label={t("world.game.realms")}>
                    <section
                        className="village-card"
                        id="world-realms"
                        aria-labelledby="world-realms-title"
                    >
                        <header className="village-card__head">
                            <span className="village-card__icon" aria-hidden="true">
                                <Compass size={18} />
                            </span>
                            <div>
                                <p className="eyebrow">
                                    {t("world.game.realms")}
                                </p>
                                <h2 id="world-realms-title">
                                    {t("world.game.realms")}
                                </h2>
                            </div>
                        </header>

                        <ul className="realm-list world-realm-list">
                            {WORLD_REALMS.map((realm) => {
                                const Icon = REALM_ICONS[realm.icon] ?? Footprints;
                                const count = growth.counts[realm.id] ?? 0;

                                return (
                                    <li
                                        className={`realm-row realm-row--${realm.id} ${count ? "" : "realm-row--quiet"}`}
                                        key={realm.id}
                                    >
                                        <span
                                            className="realm-row__icon"
                                            aria-hidden="true"
                                        >
                                            <Icon size={17} />
                                        </span>
                                        <span className="realm-row__text">
                                            <strong>
                                                {t(realm.labelKey)}
                                            </strong>
                                            <span>{t(realm.nameKey)}</span>
                                        </span>
                                        <span className="realm-row__level">
                                            {count
                                                ? t("world.game.steps", {
                                                      count,
                                                  })
                                                : t("world.game.notActive")}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    <section
                        className="village-card"
                        aria-labelledby="world-recent-title"
                    >
                        <header className="village-card__head">
                            <span className="village-card__icon" aria-hidden="true">
                                <Sprout size={18} />
                            </span>
                            <div>
                                <p className="eyebrow">
                                    {t("world.game.recent")}
                                </p>
                                <h2 id="world-recent-title">
                                    {t("world.game.recent")}
                                </h2>
                            </div>
                        </header>

                        {recentUnlocks.length ? (
                            <ul className="village-log">
                                {recentUnlocks.map((unlock) => (
                                    <li key={`${unlock.realmId}-${unlock.layer}`}>
                                        <span
                                            className={`village-log__dot village-log__dot--${unlock.layer}`}
                                            aria-hidden="true"
                                        />
                                        <span>{t(unlock.momentKey)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="village-card__copy">
                                {t("world.game.empty")}
                            </p>
                        )}
                    </section>
                </aside>
            </div>

            <footer className="village-footer">
                <p>{t("welcome.footer")}</p>
            </footer>
        </main>
    );
}

export default WorldGamePage;
