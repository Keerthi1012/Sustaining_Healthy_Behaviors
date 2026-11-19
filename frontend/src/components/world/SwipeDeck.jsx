import { useRef, useState } from "react";

import { useI18n } from "../../i18n";

const DRAG_THRESHOLD = 70;

function SwipeDeck({
    items,
    initialIndex = 0,
    legend,
    onChoose,
    chooseLabel,
    passLabel,
    tip,
}) {
    const { t } = useI18n();
    const [index, setIndex] = useState(() =>
        Math.min(
            Math.max(Number(initialIndex) || 0, 0),
            Math.max(items.length - 1, 0)
        )
    );
    const [dragX, setDragX] = useState(0);
    const startRef = useRef(null);
    const dragRef = useRef(0);

    if (!items.length) return null;

    const total = items.length;
    const item = items[index % total];
    const nextItem = items[(index + 1) % total];

    const resetDrag = () => {
        dragRef.current = 0;
        setDragX(0);
    };

    const pass = () => {
        resetDrag();
        setIndex((current) => (current + 1) % total);
    };

    const choose = () => {
        resetDrag();
        onChoose(item.id);
    };

    const handlePointerDown = (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) {
            return;
        }
        startRef.current = event.clientX;
        dragRef.current = 0;
        event.currentTarget.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
        if (startRef.current === null) return;

        const delta = event.clientX - startRef.current;
        dragRef.current = delta;
        setDragX(delta);
    };

    const handlePointerUp = () => {
        if (startRef.current === null) return;

        startRef.current = null;
        const delta = dragRef.current;

        if (delta > DRAG_THRESHOLD) {
            choose();
        } else if (delta < -DRAG_THRESHOLD) {
            pass();
        } else {
            resetDrag();
        }
    };

    const handleKeyDown = (event) => {
        if (event.target !== event.currentTarget) return;

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            pass();
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            choose();
        }
    };

    const rotation = Math.max(-12, Math.min(12, dragX / 16));

    return (
        <div className="swipe-deck">
            <div
                className="swipe-deck__stage"
                role="group"
                aria-label={legend}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={resetDrag}
            >
                <div
                    className="swipe-deck__card swipe-deck__card--next"
                    aria-hidden="true"
                >
                    <span className="swipe-deck__emoji">
                        {nextItem.emoji}
                    </span>
                </div>

                <div
                    className="swipe-deck__card swipe-deck__card--current"
                    style={{
                        transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
                    }}
                >
                    <span
                        className="swipe-deck__emoji"
                        aria-hidden="true"
                    >
                        {item.emoji}
                    </span>
                    <strong>{t(item.labelKey)}</strong>
                    {item.hintKey && (
                        <span className="swipe-deck__hint">
                            {t(item.hintKey)}
                        </span>
                    )}
                    <span className="swipe-deck__position">
                        {t("mood.position", {
                            index: index + 1,
                            total,
                        })}
                    </span>
                </div>
            </div>

            <p className="visually-hidden" aria-live="polite">
                {t("mood.announce", {
                    mood: t(item.labelKey),
                    index: index + 1,
                    total,
                })}
            </p>

            <div className="swipe-deck__actions">
                <button
                    className="btn btn--ghost"
                    type="button"
                    onClick={pass}
                >
                    {passLabel ?? t("mood.pass")}
                </button>
                <button
                    className="btn btn--primary"
                    type="button"
                    onClick={choose}
                >
                    {chooseLabel ?? t("mood.choose")}
                </button>
            </div>

            <p className="swipe-deck__tip">{tip ?? t("mood.swipeHint")}</p>
        </div>
    );
}

export default SwipeDeck;
