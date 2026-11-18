import { useRef } from "react";

function SwipeChoice({ legend, name, options, value, onChange }) {
    const startRef = useRef(null);
    const currentIndex = options.findIndex((option) => option.value === value);

    const handlePointerDown = (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        startRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event) => {
        const start = startRef.current;
        startRef.current = null;
        if (!start || currentIndex === -1) return;

        const deltaX = event.clientX - start.x;
        const deltaY = event.clientY - start.y;

        if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) {
            return;
        }

        const nextIndex =
            deltaX < 0
                ? Math.min(options.length - 1, currentIndex + 1)
                : Math.max(0, currentIndex - 1);

        if (nextIndex !== currentIndex) {
            onChange(options[nextIndex].value);
        }
    };

    return (
        <fieldset className="check-fieldset">
            <legend>{legend}</legend>
            <div
                className="swipe-choice"
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => {
                    startRef.current = null;
                }}
            >
                {options.map((option) => (
                    <label
                        className={`swipe-choice__card ${value === option.value ? "swipe-choice__card--selected" : ""}`}
                        key={option.value}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
                        />
                        {option.emoji && (
                            <span
                                className="swipe-choice__emoji"
                                aria-hidden="true"
                            >
                                {option.emoji}
                            </span>
                        )}
                        <span>
                            <strong>{option.label}</strong>
                            {option.description && (
                                <span>{option.description}</span>
                            )}
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

export default SwipeChoice;
