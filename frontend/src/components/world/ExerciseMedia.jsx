import {
    Activity,
    AlarmClock,
    BedDouble,
    Beef,
    Brain,
    ClipboardList,
    Coffee,
    Droplets,
    EyeOff,
    Footprints,
    GlassWater,
    Moon,
    Music,
    NotebookPen,
    Repeat,
    RotateCcw,
    Route,
    Salad,
    Search,
    Sun,
    Sunrise,
    Timer,
    UtensilsCrossed,
    Wind,
} from "lucide-react";

import { getExerciseMedia } from "../../content/exercises";
import { useI18n } from "../../i18n";
import "./ExerciseMedia.css";

const ICONS = {
    Activity,
    AlarmClock,
    BedDouble,
    Beef,
    Brain,
    ClipboardList,
    Coffee,
    Droplets,
    EyeOff,
    Footprints,
    GlassWater,
    Moon,
    Music,
    NotebookPen,
    Repeat,
    RotateCcw,
    Route,
    Salad,
    Search,
    Sun,
    Sunrise,
    Timer,
    UtensilsCrossed,
    Wind,
};

function ExerciseMedia({ entry, variant = "card", className = "" }) {
    const { locale } = useI18n();
    const media = getExerciseMedia(entry);
    const Icon = ICONS[media.icon] ?? Footprints;
    const alt = locale === "ar" ? media.altAr : media.alt;

    return (
        <figure
            className={`exercise-media exercise-media--${variant} exercise-media--${media.accent} ${className}`.trim()}
        >
            <div
                className="exercise-media__scene"
                role="img"
                aria-label={alt}
            >
                {media.src ? (
                    <img
                        className="exercise-media__image"
                        src={media.src}
                        alt={alt}
                        decoding="async"
                    />
                ) : (
                    <>
                        <span className="exercise-media__sky" aria-hidden="true" />
                        <span className="exercise-media__glow" aria-hidden="true" />
                        <span className="exercise-media__hill" aria-hidden="true" />
                        <span className="exercise-media__ground" aria-hidden="true" />
                        <span className="exercise-media__icon" aria-hidden="true">
                            <Icon strokeWidth={1.8} />
                        </span>
                    </>
                )}
            </div>
        </figure>
    );
}

export default ExerciseMedia;
