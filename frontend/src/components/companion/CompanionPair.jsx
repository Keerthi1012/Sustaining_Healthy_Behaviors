import Heart from "./Heart";
import Mind from "./Mind";
import "./CompanionPair.css";

function CompanionPair({
    heartSize = 180,
    mindSize = 180,
    heartExpression = "welcome",
    mindExpression = "welcome",
    className = "",
    holdingHands = true,
}) {
    const pairSize = Math.min(heartSize, mindSize);

    return (
        <div
            className={`companion-pair ${holdingHands ? "companion-pair--holding" : ""} ${className}`.trim()}
            role="img"
            aria-label="Heart and Mind, your companions"
            style={{ "--pair-size": `${pairSize}px` }}
        >
            <span className="companion-pair__character" aria-hidden="true">
                <Heart
                    size={heartSize}
                    expression={heartExpression}
                    className="companion-character companion-heart"
                />
            </span>

            <span className="companion-pair__character" aria-hidden="true">
                <Mind
                    size={mindSize}
                    expression={mindExpression}
                    className="companion-character companion-mind"
                />
            </span>

            {holdingHands && (
                <span className="companion-hands" aria-hidden="true">
                    <span className="companion-hands__heart" />
                    <span className="companion-hands__mind" />
                </span>
            )}
        </div>
    );
}

export default CompanionPair;
