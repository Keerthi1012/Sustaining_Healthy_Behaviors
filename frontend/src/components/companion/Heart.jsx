import { useId } from "react";
import "./Heart.css";

function Heart({
    size = 240,
    expression = "welcome",
    className = "",
}) {
    const idPrefix = useId();

    const faceExpressions = {
        welcome: {
            leftEye: "M112 160 C112 147 128 147 130 160 C130 173 112 173 112 160 Z",
            rightEye: "M190 160 C190 147 206 147 208 160 C208 173 190 173 190 160 Z",
            mouth: "M142 192 Q160 210 178 192",
            browLeft: "M110 139 Q121 132 132 138",
            browRight: "M188 138 Q199 132 210 138",
        },
        happy: {
            leftEye: "M112 160 Q121 145 130 160",
            rightEye: "M190 160 Q199 145 208 160",
            mouth: "M136 188 Q160 218 184 188",
            browLeft: "M110 136 Q121 129 132 136",
            browRight: "M188 136 Q199 129 210 136",
        },
        thinking: {
            leftEye: "M112 160 C112 151 128 151 130 160 C130 169 112 169 112 160 Z",
            rightEye: "M190 160 C190 151 206 151 208 160 C208 169 190 169 190 160 Z",
            mouth: "M148 194 Q160 188 172 194",
            browLeft: "M110 136 Q121 130 132 136",
            browRight: "M188 132 Q199 126 210 132",
        },
    };

    const face = faceExpressions[expression] || faceExpressions.welcome;

    return (
        <svg
            className={`heart-companion ${className}`}
            width={size}
            height={size * 1.125}
            viewBox="0 0 320 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={`Heart companion, ${expression} expression`}
        >
            <defs>
                {/* Vibrant, Warm True-Red 3D Body Gradient */}
                <linearGradient
                    id={`${idPrefix}-bodyGrad`}
                    x1="50"
                    y1="50"
                    x2="250"
                    y2="300"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="#FF6B6B" />
                    <stop offset="45%" stopColor="#E63946" />
                    <stop offset="100%" stopColor="#8A1C14" />
                </linearGradient>

                {/* Rich Red Limb Gradient */}
                <linearGradient
                    id={`${idPrefix}-limbGrad`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >
                    <stop offset="0%" stopColor="#C92A2A" />
                    <stop offset="100%" stopColor="#66100A" />
                </linearGradient>

                {/* Soft dimensional highlight overlay with a warm peachy glow */}
                <radialGradient
                    id={`${idPrefix}-highlight`}
                    cx="0"
                    cy="0"
                    r="1"
                    gradientTransform="translate(115 105) rotate(50) scale(120 140)"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="#FFD1D1" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#FFD1D1" stopOpacity="0" />
                </radialGradient>

                {/* Soft ground and depth shadows */}
                <filter
                    id={`${idPrefix}-shadow`}
                    x="20"
                    y="55"
                    width="280"
                    height="280"
                    filterUnits="userSpaceOnUse"
                >
                    <feGaussianBlur stdDeviation="10" />
                </filter>
            </defs>

            {/* Ground shadow */}
            <ellipse
                cx="160"
                cy="337"
                rx="72"
                ry="9"
                fill="#420B08"
                opacity="0.2"
            />

            {/* Arms behind body */}
            <path
                d="M83 207 C65 211 57 226 59 243"
                stroke={`url(#${idPrefix}-limbGrad)`}
                strokeWidth="21"
                strokeLinecap="round"
            />
            <circle cx="59" cy="247" r="12" fill="#A8201A" />

            <g className="heart-arm heart-arm--inner">
                <path
                    d="M237 207 C255 211 263 226 261 243"
                    stroke={`url(#${idPrefix}-limbGrad)`}
                    strokeWidth="21"
                    strokeLinecap="round"
                />
                <circle cx="261" cy="247" r="12" fill="#A8201A" />
            </g>

            {/* Legs & Feet */}
            <path
                d="M133 274 L130 308"
                stroke="#911712"
                strokeWidth="19"
                strokeLinecap="round"
            />
            <path
                d="M187 274 L190 308"
                stroke="#911712"
                strokeWidth="19"
                strokeLinecap="round"
            />
            <ellipse cx="123" cy="314" rx="19" ry="10" fill={`url(#${idPrefix}-limbGrad)`} />
            <ellipse cx="197" cy="314" rx="19" ry="10" fill={`url(#${idPrefix}-limbGrad)`} />

            {/* Ambient shadow behind main body */}
            <path
                d="M160 294 C130 272 62 225 48 166 C34 108 69 70 116 76 C137 78 151 91 160 108 C169 91 183 78 204 76 C251 70 286 108 272 166 C258 225 190 272 160 294Z"
                fill="#590C08"
                opacity="0.35"
                filter={`url(#${idPrefix}-shadow)`}
            />

            {/* Main Vibrant Red Heart Body */}
            <path
                d="M160 294 C130 272 62 225 48 166 C34 108 69 70 116 76 C137 78 151 91 160 108 C169 91 183 78 204 76 C251 70 286 108 272 166 C258 225 190 272 160 294Z"
                fill={`url(#${idPrefix}-bodyGrad)`}
            />

            {/* Surface Shading / Highlight */}
            <path
                d="M160 294 C130 272 62 225 48 166 C34 108 69 70 116 76 C137 78 151 91 160 108 C169 91 183 78 204 76 C251 70 286 108 272 166 C258 225 190 272 160 294Z"
                fill={`url(#${idPrefix}-highlight)`}
            />


            {/* Eyebrows */}
            <path
                d={face.browLeft}
                stroke="#3D0B08"
                strokeWidth="4.5"
                strokeLinecap="round"
            />
            <path
                d={face.browRight}
                stroke="#3D0B08"
                strokeWidth="4.5"
                strokeLinecap="round"
            />

            {/* Expressive Eyes */}
            <path d={face.leftEye} fill="#3D0B08" />
            <path d={face.rightEye} fill="#3D0B08" />

            {/* Soft eye highlights on open-eye expressions */}
            {expression !== "happy" && (
                <>
                    <circle
                        cx="118"
                        cy="155"
                        r="3.2"
                        fill="#FFF4F0"
                        opacity="0.8"
                    />
                    <circle
                        cx="196"
                        cy="155"
                        r="3.2"
                        fill="#FFF4F0"
                        opacity="0.8"
                    />
                </>
            )}

            {/* Mouth */}
            <path
                d={face.mouth}
                stroke="#3D0B08"
                strokeWidth="4.5"
                strokeLinecap="round"
            />

        </svg>
    );
}

export default Heart;