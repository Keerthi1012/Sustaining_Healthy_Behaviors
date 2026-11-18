import { useState } from "react";
import {
  Apple,
  Check,
  ChevronRight,
  Clock,
  Feather,
  Footprints,
  Leaf,
  Moon,
  Settings,
  Sprout,
  Sunrise,
  Wind,
} from "lucide-react";

import CompanionPair from "../components/companion/CompanionPair";
import WorldScene from "./WorldScene";
import "./VisualPrototype.css";

const swatches = [
  { name: "Cream 50", hex: "#FDFBF5", role: "Page surface", value: "var(--cream-50)" },
  { name: "Moss 600", hex: "#4D7054", role: "Primary / movement", value: "var(--moss-600)" },
  { name: "Honey 500", hex: "#C8953F", role: "Accent / nutrition", value: "var(--honey-500)" },
  { name: "Dusk 600", hex: "#6B6590", role: "Sleep realm", value: "var(--dusk-600)" },
  { name: "Sky 600", hex: "#4D838C", role: "Clear Skies realm", value: "var(--sky-600)" },
  { name: "Ink 900", hex: "#1F2A24", role: "Text", value: "var(--ink-900)" },
];

const realms = [
  {
    id: "movement",
    label: "Movement",
    name: "Valley of Vitality",
    icon: Footprints,
    level: 3,
    percent: 62,
  },
  {
    id: "sleep",
    label: "Sleep",
    name: "Oasis of Serenity",
    icon: Moon,
    level: 2,
    percent: 38,
  },
  {
    id: "nutrition",
    label: "Nutrition",
    name: "Garden of Nourishment",
    icon: Apple,
    level: 1,
    percent: 22,
  },
  {
    id: "smoking",
    label: "Clear Skies",
    name: "Clear Skies",
    icon: Wind,
    level: 1,
    percent: 16,
  },
];

const scenarios = {
  active: {
    label: "A steady day",
    heart: "happy",
    mind: "welcome",
    bubble: "You are here. One small walk is all today asks.",
    target: "5 minutes",
    progressLabel: "2 of 5 minutes today",
    percent: 40,
    cta: "I did it",
    returning: false,
    rest: false,
  },
  returning: {
    label: "Returning",
    heart: "welcome",
    mind: "thinking",
    bubble: "It has been a few days. Your world kept a place for you.",
    target: "1 minute",
    progressLabel: "0 of 1 minute today",
    percent: 0,
    cta: "Start with one minute",
    returning: true,
    rest: false,
  },
  rest: {
    label: "Resting",
    heart: "happy",
    mind: "happy",
    bubble: "That is it for today. Rest is part of growing.",
    target: "5 minutes",
    progressLabel: "5 of 5 minutes today",
    percent: 100,
    cta: "Done",
    returning: false,
    rest: true,
  },
};

function RealmChip({ tone, children }) {
  return <span className={`realm-chip realm-chip--${tone}`}>{children}</span>;
}

function Progress({ percent, tone = "movement", label }) {
  return (
    <div className="progress">
      <div className="progress__meta">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div
        className={`progress__track progress__track--${tone}`}
        role="progressbar"
        aria-label={label}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={percent}
      >
        <span className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function WelcomeBack() {
  return (
    <article className="welcome-back">
      <span className="welcome-back__icon" aria-hidden="true">
        <Sunrise size={20} />
      </span>
      <div>
        <p className="eyebrow">WELCOME BACK</p>
        <h3>Your world kept a place for you.</h3>
        <p>
          Nothing is lost. Start with one gentle minute, or simply look
          around.
        </p>
      </div>
    </article>
  );
}

function MicroHabit({ scenario }) {
  return (
    <article className="card micro-habit">
      <header className="micro-habit__head">
        <RealmChip tone="movement">Movement</RealmChip>
        <span className="micro-habit__time">
          <Clock size={14} aria-hidden="true" /> {scenario.target}
        </span>
      </header>

      <h3 className="micro-habit__title">
        {scenario.rest ? "Today's walk is complete" : "A short walk"}
      </h3>
      <p className="micro-habit__text">
        {scenario.rest
          ? "You gave your body a little movement. That is enough for one day."
          : "Take a comfortable walk at your own pace. The path counts, even when it is short."}
      </p>

      <Progress
        percent={scenario.percent}
        label={scenario.progressLabel}
        tone="movement"
      />

      {scenario.rest ? (
        <p className="micro-habit__rest">
          Rest is part of growing. See you tomorrow.
        </p>
      ) : (
        <div className="micro-habit__actions">
          <button className="btn btn--primary" type="button">
            <Check size={17} aria-hidden="true" />
            {scenario.cta}
          </button>
          <button className="btn btn--ghost" type="button">
            Something smaller
          </button>
        </div>
      )}
    </article>
  );
}

function QuestCard() {
  return (
    <article className="card quest-card">
      <span className="quest-card__icon" aria-hidden="true">
        <Feather size={18} />
      </span>
      <div className="quest-card__text">
        <p className="eyebrow">OPTIONAL QUEST</p>
        <h3>Notice one good thing</h3>
        <p>
          As you walk, notice one thing that feels good. There is nothing to
          write down.
        </p>
      </div>
      <button
        className="icon-button icon-button--soft"
        type="button"
        aria-label="Mark quest complete"
      >
        <Check size={17} aria-hidden="true" />
      </button>
    </article>
  );
}

function RealmPanel() {
  return (
    <section className="card realm-panel">
      <header className="card__head">
        <div>
          <p className="eyebrow">YOUR REALMS</p>
          <h3>Growing, gently</h3>
        </div>
        <ChevronRight size={18} className="text-soft" aria-hidden="true" />
      </header>

      <ul className="realm-list">
        {realms.map((realm) => {
          const Icon = realm.icon;

          return (
            <li className={`realm-row realm-row--${realm.id}`} key={realm.id}>
              <span className="realm-row__icon" aria-hidden="true">
                <Icon size={17} />
              </span>
              <span className="realm-row__text">
                <strong>{realm.label}</strong>
                <span>{realm.name}</span>
              </span>
              <span className="realm-row__level">Lv {realm.level}</span>
              <span className="realm-row__bar" aria-hidden="true">
                <span style={{ width: `${realm.percent}%` }} />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function GrowthFeed() {
  return (
    <section className="card growth-card">
      <p className="eyebrow">WHAT GREW</p>
      <h3>A little more alive</h3>
      <ul className="growth-list">
        <li>
          <span className="growth-list__dot growth-list__dot--moss" />
          A new wildflower opened beside the path.
        </li>
        <li>
          <span className="growth-list__dot growth-list__dot--honey" />
          Heart found a sunny spot to rest.
        </li>
        <li>
          <span className="growth-list__dot growth-list__dot--sky" />
          The valley path feels a little clearer.
        </li>
      </ul>
      <p className="growth-card__note">Small actions, quietly reflected.</p>
    </section>
  );
}

function VisualPrototype() {
  const requestedState = new URLSearchParams(window.location.search).get(
    "state"
  );
  const [scenarioId, setScenarioId] = useState(
    scenarios[requestedState] ? requestedState : "active"
  );
  const scenario = scenarios[scenarioId];

  return (
    <main className="prototype">
      <a className="skip-link" href="#prototype-world">
        Skip to world prototype
      </a>

      <header className="proto-intro">
        <p className="eyebrow">VISUAL DIRECTION PROPOSAL · DRAFT</p>
        <h1 className="text-display">A living world that grows as you grow.</h1>
        <p className="proto-intro__lead">
          A warm, restrained direction for Habit-RPG: editorial typography,
          moss and parchment surfaces, and one shared world stage. Heart and
          Mind keep their approved artwork and expressions.
        </p>
        <p className="proto-intro__note">
          Prototype only. No onboarding screens or backend behaviour are
          changed. Prototype artwork is an original draft, not final brand
          artwork.
        </p>
      </header>

      <section className="proto-block" aria-labelledby="palette-heading">
        <div className="proto-block__head">
          <h2 id="palette-heading">Palette</h2>
          <p>
            Warm neutrals carry the interface. Realm colours stay muted and are
            used for identity, not decoration.
          </p>
        </div>

        <div className="swatch-grid">
          {swatches.map((swatch) => (
            <article className="swatch" key={swatch.name}>
              <span
                className="swatch__chip"
                style={{ background: swatch.value }}
                aria-hidden="true"
              />
              <div className="swatch__meta">
                <strong>{swatch.name}</strong>
                <span>{swatch.role}</span>
                <code>{swatch.hex}</code>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="proto-block" aria-labelledby="type-heading">
        <div className="proto-block__head">
          <h2 id="type-heading">Typography</h2>
          <p>
            A system serif for warmth and editorial hierarchy; a humanist system
            sans for readable body copy and controls.
          </p>
        </div>

        <div className="type-specimen">
          <span className="eyebrow">EYEBROW · 11PX · 0.16EM</span>
          <p className="type-specimen__display">Small steps, quietly kept.</p>
          <h3>The valley grows a little each day.</h3>
          <p className="type-specimen__body">
            Body copy stays calm and generously spaced. Paragraphs run to a
            comfortable measure, with muted ink on parchment rather than pure
            black on pure white.
          </p>
          <p className="type-specimen__meta">
            Display serif · Body sans · 16px base · 1.65 line height
          </p>
        </div>
      </section>

      <section className="proto-block" aria-labelledby="world-heading">
        <div className="proto-block__head proto-block__head--row">
          <div>
            <h2 id="world-heading">World screen</h2>
            <p>
              The world is the home experience. Quests stay secondary and quiet.
            </p>
          </div>

          <div className="scenario-tabs" role="group" aria-label="World state">
            {Object.entries(scenarios).map(([id, item]) => (
              <button
                className={`scenario-tab ${
                  scenarioId === id ? "scenario-tab--active" : ""
                }`}
                key={id}
                type="button"
                aria-pressed={scenarioId === id}
                onClick={() => setScenarioId(id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="world-preview" id="prototype-world">
          <div className="world-topbar">
            <div className="brand-mark">
              <span className="brand-mark__icon" aria-hidden="true">
                <Sprout size={17} />
              </span>
              <span>Your world</span>
            </div>

            <div className="world-topbar__meta">
              <RealmChip tone="movement">Valley of Vitality</RealmChip>
              <button
                className="icon-button"
                type="button"
                aria-label="Open settings"
              >
                <Settings size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="world-stage">
            <WorldScene />
            <div className="world-stage__vignette" aria-hidden="true" />

            <div className="world-stage__caption">
              <span className="eyebrow">YOUR WORLD</span>
              <h2>Valley of Vitality</h2>
              <p>Movement · growing gently</p>
            </div>

            <div className="companion-stage">
              <div className="companion-bubble" role="status" aria-live="polite">
                {scenario.bubble}
              </div>
              <div className="companion-stage__ground" aria-hidden="true" />
              <CompanionPair
                heartSize={150}
                mindSize={150}
                heartExpression={scenario.heart}
                mindExpression={scenario.mind}
                className="companion-stage__pair"
              />
            </div>
          </div>

          <div className="world-body">
            <section className="today" aria-label="Today">
              {scenario.returning && <WelcomeBack />}
              <MicroHabit scenario={scenario} />
              <QuestCard />
            </section>

            <aside className="world-side" aria-label="Realm progress">
              <RealmPanel />
              <GrowthFeed />
            </aside>
          </div>
        </div>
      </section>

      <section className="proto-block" aria-labelledby="components-heading">
        <div className="proto-block__head">
          <h2 id="components-heading">Component conventions</h2>
          <p>
            Plain CSS with shared tokens and colocated component styles. Classes
            follow a block__element--modifier convention.
          </p>
        </div>

        <div className="convention-grid">
          <article className="convention">
            <p className="eyebrow">BUTTONS</p>
            <div className="row">
              <button className="btn btn--primary" type="button">
                Primary
              </button>
              <button className="btn btn--secondary" type="button">
                Secondary
              </button>
              <button className="btn btn--ghost" type="button">
                Ghost
              </button>
            </div>
            <div className="row">
              <button
                className="icon-button icon-button--soft"
                type="button"
                aria-label="Example icon action"
              >
                <Leaf size={17} aria-hidden="true" />
              </button>
              <button className="btn btn--primary" type="button" disabled>
                Disabled
              </button>
            </div>
          </article>

          <article className="convention">
            <p className="eyebrow">REALM CHIPS</p>
            <div className="row row--wrap">
              <RealmChip tone="movement">Movement</RealmChip>
              <RealmChip tone="sleep">Sleep</RealmChip>
              <RealmChip tone="nutrition">Nutrition</RealmChip>
              <RealmChip tone="smoking">Clear Skies</RealmChip>
            </div>
          </article>

          <article className="convention">
            <p className="eyebrow">PROGRESS</p>
            <Progress percent={62} label="Valley growth" tone="movement" />
            <Progress percent={38} label="Oasis growth" tone="sleep" />
          </article>

          <article className="convention">
            <p className="eyebrow">OPTION CARDS</p>
            <div className="option-stack">
              <label className="option-card option-card--selected">
                <input type="radio" name="proto-option" defaultChecked />
                <span>
                  <strong>10 minutes</strong>
                  <span>Feels comfortable</span>
                </span>
              </label>
              <label className="option-card">
                <input type="radio" name="proto-option" />
                <span>
                  <strong>5 minutes</strong>
                  <span>Something smaller</span>
                </span>
              </label>
            </div>
          </article>
        </div>
      </section>

      <footer className="proto-footer">
        <p>
          Proposed conventions: tokens in <code>styles/tokens.css</code>, base
          resets in <code>styles/base.css</code>, colocated component CSS, and
          primitives under <code>components/ui</code> in the next phase.
        </p>
      </footer>
    </main>
  );
}

export default VisualPrototype;
