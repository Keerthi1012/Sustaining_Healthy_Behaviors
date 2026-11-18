
function Pip({ mood = "happy", size = 300 }) {
    const sleepy = mood === "sleepy";
    const excited = mood === "excited";

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 360 400"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Pip, your friendly fox companion"
        >
            <defs>
                <linearGradient id="fur" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFD19A" />
                    <stop offset="48%" stopColor="#F6A45D" />
                    <stop offset="100%" stopColor="#D87538" />
                </linearGradient>

                <linearGradient id="furLight" x1="0" y1="0" x2="0.8" y2="1">
                    <stop offset="0%" stopColor="#FFDDB5" />
                    <stop offset="100%" stopColor="#EF9851" />
                </linearGradient>

                <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFF9EB" />
                    <stop offset="100%" stopColor="#F5DCC0" />
                </linearGradient>

                <linearGradient id="scarf" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#A9D68E" />
                    <stop offset="100%" stopColor="#548C59" />
                </linearGradient>

                <radialGradient id="eye" cx="35%" cy="25%">
                    <stop offset="0%" stopColor="#76503D" />
                    <stop offset="100%" stopColor="#38231E" />
                </radialGradient>

                <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="5" />
                </filter>
            </defs>

            {/* Ground shadow */}
            <ellipse cx="180" cy="370" rx="100" ry="12"
                fill="#806344" opacity=".16" filter="url(#softShadow)" />

            {/* Big fluffy tail */}
            <path
                d="M231 285
           C278 264 320 279 323 318
           C326 355 288 365 257 342
           C241 331 230 310 218 301Z"
                fill="url(#fur)"
                stroke="#B96738"
                strokeWidth="4"
            />
            <path
                d="M272 338
           C291 354 314 340 316 318
           C320 347 294 361 269 349Z"
                fill="url(#cream)"
            />
            <path
                d="M253 293 Q290 278 308 301"
                fill="none"
                stroke="#FFD4A0"
                strokeWidth="6"
                strokeLinecap="round"
                opacity=".7"
            />

            {/* Body */}
            <ellipse cx="180" cy="307" rx="72" ry="73" fill="url(#fur)" />
            <ellipse cx="180" cy="317" rx="43" ry="51" fill="url(#cream)" />

            {/* Little feet */}
            <ellipse cx="140" cy="362" rx="35" ry="17" fill="#D87A42" />
            <ellipse cx="220" cy="362" rx="35" ry="17" fill="#D87A42" />
            <path d="M119 361 Q137 371 153 363 M199 363 Q217 371 235 361"
                stroke="#F5B37A" strokeWidth="3" fill="none" />


            {/* Left arm */}
            <g>
                <path
                    d="M118 292 Q91 301 103 335 Q111 349 129 337 L143 310Z"
                    fill="url(#furLight)"
                    stroke="#C87841"
                    strokeWidth="3"
                />
                <ellipse cx="113" cy="337" rx="12" ry="9" fill="#FFD5A9" />
            </g>

            {/* Right waving arm */}
            <g className="pip-wave-arm">
                <path
                    d="M238 292 Q263 275 279 246 Q287 230 300 239
       Q311 249 298 264 L260 310Z"
                    fill="url(#furLight)"
                    stroke="#C87841"
                    strokeWidth="3"
                />
                <ellipse cx="300" cy="244" rx="13" ry="12" fill="#F9B36F" />
                <path
                    d="M292 244 Q300 250 307 243"
                    fill="none"
                    stroke="#FFD6A8"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            </g>


            {/* Ears */}
            <path
                d="M83 153 L66 30 Q64 13 79 26 L145 94Z"
                fill="url(#fur)"
                stroke="#B96738"
                strokeWidth="5"
                strokeLinejoin="round"
            />
            <path
                d="M277 153 L294 30 Q296 13 281 26 L215 94Z"
                fill="url(#fur)"
                stroke="#B96738"
                strokeWidth="5"
                strokeLinejoin="round"
            />
            <path d="M91 107 L79 46 L125 99Z" fill="#E99391" />
            <path d="M269 107 L281 46 L235 99Z" fill="#E99391" />
            <path d="M93 85 L85 52" stroke="#FFD5A9" strokeWidth="5"
                strokeLinecap="round" />
            <path d="M267 85 L275 52" stroke="#FFD5A9" strokeWidth="5"
                strokeLinecap="round" />

            {/* Head silhouette */}

            {/* Soft forehead fur highlights */}
            <path
                d="M104 108 Q119 91 137 101"
                fill="none"
                stroke="#FFD7AA"
                strokeWidth="5"
                strokeLinecap="round"
                opacity=".7"
            />
            <path
                d="M221 108 Q239 91 252 108"
                fill="none"
                stroke="#FFD7AA"
                strokeWidth="5"
                strokeLinecap="round"
                opacity=".7"
            />

            {/* Soft cheek fur */}
            <path
                d="M76 194 Q87 181 98 189"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
                opacity=".7"
            />
            <path
                d="M262 194 Q273 181 284 189"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
                opacity=".7"
            />

            <path
                d="M180 79
           C221 55 279 85 295 131
           C315 185 293 256 248 279
           C230 291 202 298 180 298
           C158 298 130 291 112 279
           C67 256 45 185 65 131
           C81 85 139 55 180 79Z"
                fill="url(#fur)"
                stroke="#B96738"
                strokeWidth="5"
            />

            {/* Forehead fur tufts */}
            <path
                d="M139 81 Q151 59 165 77 Q176 52 187 77 Q203 57 215 83"
                fill="url(#furLight)"
                stroke="#B96738"
                strokeWidth="3"
            />

            {/* Face fluff */}
            <path
                d="M77 190 Q88 169 108 181 Q112 164 129 174
           Q144 161 158 177 L180 202
           L202 177 Q216 161 231 174
           Q248 164 252 181 Q272 169 283 190
           Q276 234 237 250
           Q180 278 123 250 Q84 234 77 190Z"
                fill="url(#cream)"
            />

            {/* Eyes */}
            {sleepy ? (
                <>
                    <path d="M113 169 Q133 182 151 169"
                        stroke="#57382E" strokeWidth="8" fill="none" strokeLinecap="round" />
                    <path d="M209 169 Q227 182 247 169"
                        stroke="#57382E" strokeWidth="8" fill="none" strokeLinecap="round" />
                </>
            ) : (
                <>
                    <ellipse cx="132" cy="170" rx="19" ry="25" fill="url(#eye)" />
                    <ellipse cx="228" cy="170" rx="19" ry="25" fill="url(#eye)" />
                    <ellipse cx="125" cy="160" rx="7" ry="9" fill="white" />
                    <ellipse cx="221" cy="160" rx="7" ry="9" fill="white" />
                    <circle cx="140" cy="180" r="3.5" fill="#D9A17D" />
                    <circle cx="236" cy="180" r="3.5" fill="#D9A17D" />
                </>
            )}

            {/* Eyebrows */}
            {!sleepy && (
                <>
                    <path d="M110 134 Q130 119 150 135"
                        stroke="#B96C42" strokeWidth="5" fill="none" strokeLinecap="round" />
                    <path d="M210 135 Q230 119 250 134"
                        stroke="#B96C42" strokeWidth="5" fill="none" strokeLinecap="round" />
                </>
            )}

            {/* Muzzle */}
            <ellipse cx="180" cy="216" rx="48" ry="35" fill="#FFF9EF" />
            <ellipse cx="158" cy="215" rx="24" ry="19" fill="#FFF4E4" />
            <ellipse cx="202" cy="215" rx="24" ry="19" fill="#FFF4E4" />

            {/* Nose */}
            <path d="M168 199 Q180 188 192 199 Q190 211 180 212 Q170 211 168 199Z"
                fill="#78483D" />
            <ellipse cx="176" cy="197" rx="4" ry="2.5" fill="#E9B6A0" />

            {/* Smile */}
            <path
                d={sleepy
                    ? "M170 227 Q180 231 190 227"
                    : excited
                        ? "M160 226 Q180 257 200 226"
                        : "M165 226 Q180 244 195 226"}
                fill={excited ? "#A94F48" : "none"}
                stroke="#78483D"
                strokeWidth="4"
                strokeLinecap="round"
            />

            {/* Cheeks */}
            <ellipse cx="101" cy="214" rx="17" ry="9" fill="#F39B9B" opacity=".65" />
            <ellipse cx="259" cy="214" rx="17" ry="9" fill="#F39B9B" opacity=".65" />

            {/* Scarf */}
            <path
                d="M108 267 Q180 291 252 267 L240 294
           Q180 319 120 294Z"
                fill="url(#scarf)"
                stroke="#4C7D4A"
                strokeWidth="4"
            />
            <path
                d="M230 283 L284 323 L263 352 L218 300Z"
                fill="#83B875"
                stroke="#4C7D4A"
                strokeWidth="4"
                strokeLinejoin="round"
            />
            <path d="M128 279 Q180 296 232 279"
                fill="none" stroke="#C5E4A8" strokeWidth="4"
                strokeLinecap="round" />

            {/* Tiny leaf on scarf */}
            <path d="M178 278 Q162 257 184 250 Q201 265 178 278Z"
                fill="#B8D98D" stroke="#4C7D4A" strokeWidth="2" />
            <path d="M178 277 L183 258"
                stroke="#4C7D4A" strokeWidth="2" fill="none" />

            {/* Sparkles */}
            <path d="M35 119 L41 135 L57 141 L41 147 L35 163 L29 147 L13 141 L29 135Z"
                fill="#F3C75E" />
            <path d="M320 102 L324 113 L335 117 L324 121 L320 132 L316 121 L305 117 L316 113Z"
                fill="#F3C75E" />
        </svg>
    );
}

export default Pip;
