import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import "./Sheet.css";

function Sheet({ title, eyebrow, onClose, children, footer, labelledBy }) {
    const closeRef = useRef(null);
    const titleId = labelledBy ?? `sheet-title-${title.replace(/\s+/g, "-").toLowerCase()}`;

    useEffect(() => {
        closeRef.current?.focus();
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    return (
        <div className="sheet" role="presentation">
            <button
                className="sheet__backdrop"
                type="button"
                aria-label="Close"
                onClick={onClose}
            />
            <section
                className="sheet__panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <header className="sheet__head">
                    <div>
                        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                        <h2 id={titleId}>{title}</h2>
                    </div>
                    <button
                        className="icon-button"
                        type="button"
                        onClick={onClose}
                        ref={closeRef}
                        aria-label="Close"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </header>
                <div className="sheet__body">{children}</div>
                {footer && <footer className="sheet__footer">{footer}</footer>}
            </section>
        </div>
    );
}

export default Sheet;
