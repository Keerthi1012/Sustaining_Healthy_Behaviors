
function Momo({ size = 500, mood = "happy", className = "" }) {
    return (
        <img
            src="/images/momo.png"
            alt={`Momo the capybara, ${mood}`}
            className={`momo-character ${className}`}
            style={{
                width: size,
                height: "auto",
            }}
        />
    );
}

export default Momo;
