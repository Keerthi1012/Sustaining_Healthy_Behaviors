
import { useId } from "react";
import "./Mind.css";

function Mind({
    size = 240,
    expression = "welcome",
    className = "",
}) {
    const id = useId().replace(/:/g, "");

    const expressions = {
        welcome: {
            mouth: "M145 229 Q160 244 175 229",
            browLeft: "M112 183 Q124 176 136 182",
            browRight: "M184 182 Q196 176 208 183",
            eyes: "open",
        },
        happy: {
            mouth: "M140 225 Q160 251 180 225",
            browLeft: "M112 181 Q124 174 136 181",
            browRight: "M184 181 Q196 174 208 181",
            eyes: "closed",
        },
        thinking: {
            mouth: "M150 232 Q160 226 170 232",
            browLeft: "M112 181 Q124 175 136 181",
            browRight: "M184 176 Q196 170 208 176",
            eyes: "thinking",
        },
    };

    const face = expressions[expression] || expressions.welcome;

    // Original scalloped brain silhouette.
    const brainShape = `
        M160 91
        C148 72 127 66 111 78
        C93 66 71 77 68 96
        C47 98 36 119 45 138
        C28 153 32 177 49 190
        C34 208 43 232 63 239
        C63 261 84 274 104 264
        C119 280 143 278 158 261
        C173 278 197 280 212 264
        C232 274 253 261 257 239
        C277 232 286 208 271 190
        C288 177 292 153 275 138
        C284 119 273 98 252 96
        C249 77 227 66 209 78
        C193 66 172 72 160 91
        Z
    `;

    return (
        <svg
            className={`mind-companion ${className}`}
            width={size}
            height={size * 1.125}
            viewBox="0 0 320 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={`Mind companion, ${expression} expression`}
        >
            <defs>
                {/* Warm pink brain tissue */}
                <linearGradient
                    id={`${id}-brain`}
                    x1="65"
                    y1="75"
                    x2="255"
                    y2="275"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0" stopColor="#FFB5C5" />
                    <stop offset="0.48" stopColor="#F18EAA" />
                    <stop offset="1" stopColor="#D85F87" />
                </linearGradient>

                {/* Raised fold highlights */}
                <linearGradient
                    id={`${id}-fold`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >
                    <stop offset="0" stopColor="#FFD2DA" />
                    <stop offset="1" stopColor="#F6A7BB" />
                </linearGradient>

                {/* Limbs */}
                <linearGradient
                    id={`${id}-limb`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >
                    <stop offset="0" stopColor="#E98AA5" />
                    <stop offset="1" stopColor="#B94F75" />
                </linearGradient>

                <filter
                    id={`${id}-shadow`}
                    x="20"
                    y="55"
                    width="280"
                    height="285"
                    filterUnits="userSpaceOnUse"
                >
                    <feGaussianBlur stdDeviation="8" />
                </filter>

                <clipPath id={`${id}-brainClip`}>
                    <path d={brainShape} />
                </clipPath>
            </defs>

            {/* Ground shadow */}
            <ellipse
                cx="160"
                cy="337"
                rx="72"
                ry="9"
                fill="#70404F"
                opacity="0.15"
            />

            {/* Arms behind the brain */}
            <g className="mind-arm mind-arm--inner">
                <path
                    d="M67 216 C48 218 43 236 49 251"
                    stroke={`url(#${id}-limb)`}
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                <circle cx="49" cy="253" r="7" fill="#B94F75" />
            </g>

            <path
                d="M253 216 C272 218 277 236 271 251"
                stroke={`url(#${id}-limb)`}
                strokeWidth="12"
                strokeLinecap="round"
            />
            <circle cx="271" cy="253" r="7" fill="#B94F75" />

            {/* Brainstem */}
            <path
                d="M148 251 C147 265 150 279 156 289 Q160 294 164 289 C170 279 173 265 172 251"
                fill={`url(#${id}-limb)`}
            />

            {/* Legs */}
            <path
                d="M128 271 L124 308"
                stroke="#87435B"
                strokeWidth="11"
                strokeLinecap="round"
            />
            <path
                d="M192 271 L196 308"
                stroke="#87435B"
                strokeWidth="11"
                strokeLinecap="round"
            />

            {/* Feet */}
            <ellipse cx="119" cy="312" rx="15" ry="8" fill="#87435B" />
            <ellipse cx="201" cy="312" rx="15" ry="8" fill="#87435B" />

            {/* Soft body shadow */}
            <path
                d={brainShape}
                transform="translate(0 5)"
                fill="#713B50"
                opacity="0.28"
                filter={`url(#${id}-shadow)`}
            />

            {/* Main brain */}
            <path
                d={brainShape}
                fill={`url(#${id}-brain)`}
            />

            {/* Brain folds */}
            <g clipPath={`url(#${id}-brainClip)`}>
                {/* Darker recessed grooves */}
                <g
                    fill="none"
                    stroke="#D65F86"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.25"
                >
                    {/* Upper left folds */}
                    <path d="M69 111 C85 94 108 101 111 119 C114 132 101 140 87 138" />
                    <path d="M116 83 C104 101 117 116 133 119 C145 122 150 135 141 147" />
                    <path d="M78 151 C94 139 112 146 114 162 C116 176 101 185 86 181" />
                    <path d="M119 143 C133 132 149 141 150 157" />

                    {/* Upper right folds */}
                    <path d="M251 111 C235 94 212 101 209 119 C206 132 219 140 233 138" />
                    <path d="M204 83 C216 101 203 116 187 119 C175 122 170 135 179 147" />
                    <path d="M242 151 C226 139 208 146 206 162 C204 176 219 185 234 181" />
                    <path d="M201 143 C187 132 171 141 170 157" />

                    {/* Side and lower folds */}
                    <path d="M48 187 C64 170 84 179 85 197 C86 210 73 217 62 212" />
                    <path d="M272 187 C256 170 236 179 235 197 C234 210 247 217 258 212" />
                    <path d="M91 220 C106 201 126 211 127 229 C128 240 119 247 108 247" />
                    <path d="M229 220 C214 201 194 211 193 229 C192 240 201 247 212 247" />
                </g>

                {/* Lighter raised fold surfaces */}
                <g
                    fill="none"
                    stroke={`url(#${id}-fold)`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.55"
                >
                    <path d="M71 108 C87 94 104 103 107 117" />
                    <path d="M119 86 C109 101 121 111 133 115" />
                    <path d="M80 149 C95 140 108 147 110 160" />
                    <path d="M249 108 C233 94 216 103 213 117" />
                    <path d="M201 86 C211 101 199 111 187 115" />
                    <path d="M240 149 C225 140 212 147 210 160" />
                    <path d="M51 186 C65 174 79 182 81 194" />
                    <path d="M269 186 C255 174 241 182 239 194" />
                    <path d="M94 219 C107 207 121 214 123 227" />
                    <path d="M226 219 C213 207 199 214 197 227" />
                </g>
            </g>

            {/* Central fissure between hemispheres */}
            <path
                d="M160 94 C153 111 164 127 159 143 C157 151 160 158 160 165"
                stroke="#C94F78"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                opacity="0.4"
            />


            {/* Eyebrows */}
            <path
                d={face.browLeft}
                stroke="#713C50"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d={face.browRight}
                stroke="#713C50"
                strokeWidth="3.5"
                strokeLinecap="round"
            />

            {/* Eyes */}
            {face.eyes === "closed" ? (
                <>
                    <path
                        d="M111 197 Q124 185 137 197"
                        stroke="#4D2938"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                    <path
                        d="M183 197 Q196 185 209 197"
                        stroke="#4D2938"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                </>
            ) : (
                <>
                    <circle cx="124" cy="198" r="15" fill="#FFF9F5" />
                    <circle cx="196" cy="198" r="15" fill="#FFF9F5" />

                    <circle
                        cx={face.eyes === "thinking" ? "128" : "125"}
                        cy="199"
                        r="9"
                        fill="#512C3B"
                    />
                    <circle
                        cx={face.eyes === "thinking" ? "200" : "197"}
                        cy="199"
                        r="9"
                        fill="#512C3B"
                    />

                    <circle cx="121" cy="194" r="4" fill="white" />
                    <circle cx="193" cy="194" r="4" fill="white" />
                </>
            )}

            {/* Smile */}
            <path
                d={face.mouth}
                stroke="#542A3A"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    );
}

export default Mind;
