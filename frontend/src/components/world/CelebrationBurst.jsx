const DOT_COUNT = 10;

function CelebrationBurst({ quiet = false, variant = 0 }) {
    return (
        <div
            className="celebration-burst"
            data-testid="celebration-burst"
            aria-hidden="true"
        >
            <span className="celebration-burst__ring" />
            {!quiet &&
                Array.from({ length: DOT_COUNT }, (_, index) => (
                    <span
                        key={index}
                        className={`celebration-burst__dot celebration-burst__dot--${index % 3}`}
                        style={{
                            "--angle": `${index * (360 / DOT_COUNT) + variant * 11}deg`,
                            "--delay": `${index * 20 + variant * 15}ms`,
                        }}
                    />
                ))}
        </div>
    );
}

export default CelebrationBurst;
