import {
    ArrowRight,
    Leaf,
    RefreshCw,
    ShieldCheck,
    Sprout,
} from "lucide-react";
import CompanionPair from "./companion/CompanionPair";
import WorldScene from "./world/WorldScene";
import LanguageSwitch from "./ui/LanguageSwitch";
import { useI18n } from "../i18n";
import "./WelcomePage.css";

const principles = [
    {
        icon: Leaf,
        titleKey: "welcome.smallSteps.title",
        textKey: "welcome.smallSteps.text",
    },
    {
        icon: RefreshCw,
        titleKey: "welcome.adaptation.title",
        textKey: "welcome.adaptation.text",
    },
    {
        icon: ShieldCheck,
        titleKey: "welcome.noPunishment.title",
        textKey: "welcome.noPunishment.text",
    },
];

function WelcomePage({ onBegin }) {
    const { t } = useI18n();

    return (
        <main className="welcome-page">
            <nav className="welcome-nav">
                <div className="brand">
                    <span className="brand__icon" aria-hidden="true">
                        <Sprout size={20} />
                    </span>
                    <span>Sproutly</span>
                </div>
                <div className="welcome-nav__end">
                    <span className="nav-tagline">
                        {t("welcome.navTagline")}
                    </span>
                    <LanguageSwitch />
                </div>
            </nav>

            <section className="welcome-hero">
                <div className="hero-content">
                    <p className="eyebrow">{t("welcome.eyebrow")}</p>
                    <h1>
                        {t("welcome.titleLine1")}{" "}
                        <br />
                        <span>{t("welcome.titleLine2")}</span>
                    </h1>

                    <p className="hero-description">
                        {t("welcome.description")}
                    </p>

                    <button className="begin-button" type="button" onClick={onBegin}>
                        {t("welcome.begin")}
                        <ArrowRight
                            className="icon-directional"
                            size={19}
                            aria-hidden="true"
                        />
                    </button>

                    <p className="reassurance">
                        {t("welcome.reassurance")}
                    </p>
                </div>

                <div className="hero-art">
                    <WorldScene growth={0.45} />
                    <div className="hero-art__shade" aria-hidden="true" />
                    <CompanionPair
                        heartSize={164}
                        mindSize={164}
                        heartExpression="happy"
                        mindExpression="welcome"
                        className="companion-pair--floating"
                    />
                </div>
            </section>

            <section
                className="welcome-principles"
                aria-label={t("welcome.principlesLabel")}
            >
                {principles.map((item) => {
                    const Icon = item.icon;
                    return (
                        <article className="principle" key={item.titleKey}>
                            <span className="principle__icon" aria-hidden="true">
                                <Icon size={18} />
                            </span>
                            <div>
                                <h2>{t(item.titleKey)}</h2>
                                <p>{t(item.textKey)}</p>
                            </div>
                        </article>
                    );
                })}
            </section>

            <footer className="welcome-footer">
                <p>{t("welcome.footer")}</p>
            </footer>
        </main>
    );
}

export default WelcomePage;
