import oasisBg from "../../assets/oasis-bg.png";

export default function MeadowScene() {
    return (
        <img
            src={oasisBg}
            alt="Three-stream desert oasis"
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
            }}
        />
    );
}