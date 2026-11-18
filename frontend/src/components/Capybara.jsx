
function Capybara({ mood = "happy", size = 300 }) {
    const excited = mood === "excited" || mood === "cheering";
    const sleepy = mood === "sleepy";
    const thinking = mood === "thinking";

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 320 340"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={`Momo the capybara, ${mood}`}
        >
            <defs>
                <linearGradient id="momoFur" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#C98D5C" />
                    <stop offset="100%" stopColor="#965C38" />
                </linearGradient>

                <linearGradient id="momoCream" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFF0D5" />
                    <stop offset="100%" stopColor="#EACDA5" />
                </linearGradient>

                <linearGradient id="momoScarf" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#76A99A" />
                    <stop offset="100%" stopColor="#477E70" />
                </linearGradient>

                <radialGradient id="momoEye">
                    <stop offset="0%" stopColor="#513323" />
                    <stop offset="100%" stopColor="#20150F" />
                </radialGradient>

                <filter id="momoShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow
                        dx="0"
                        dy="5"
                        stdDeviation="5"
                        floodColor="#68462E"
                        floodOpacity="0.17"
                    />
                </filter>
            </defs>

            {/* Ground shadow */}
            <ellipse cx="160" cy="315" rx="88" ry="13" fill="#9D947A" opacity="0.2" />

            {/* Feet */}
            <ellipse cx="112" cy="290" rx="25" ry="16" fill="#98613D" />
            <ellipse cx="208" cy="290" rx="25" ry="16" fill="#98613D" />

            {/* Body */}
            <g filter="url(#momoShadow)">
                <ellipse cx="160" cy="237" rx="91" ry="76" fill="url(#momoFur)" />
                <ellipse cx="160" cy="251" rx="51" ry="49" fill="url(#momoCream)" />
            </g>

            {/* Little paws */}
            <ellipse cx="77" cy="237" rx="18" ry="28" fill="#A96D46" transform="rotate(24 77 237)" />
            <ellipse cx="243" cy="237" rx="18" ry="28" fill="#A96D46" transform="rotate(-24 243 237)" />

            {/* Ears */}
            <ellipse cx="91" cy="77" rx="19" ry="23" fill="#A96B43" transform="rotate(-25 91 77)" />
            <ellipse cx="229" cy="77" rx="19" ry="23" fill="#A96B43" transform="rotate(25 229 77)" />
            <ellipse cx="93" cy="79" rx="10" ry="13" fill="#E8B69A" transform="rotate(-25 93 79)" />
            <ellipse cx="227" cy="79" rx="10" ry="13" fill="#E8B69A" transform="rotate(25 227 79)" />

            {/* Head */}
            <g filter="url(#momoShadow)">
                <ellipse cx="160" cy="139" rx="91" ry="89" fill="url(#momoFur)" />
            </g>

            {/* Forehead highlight */}
            <ellipse cx="132" cy="81" rx="34" ry="13" fill="#E7B17D" opacity="0.25" />

            {/* Leaf sprout */}
            <path d="M160 54 Q151 31 130 35 Q133 57 160 58" fill="#7FA77A" />
            <path d="M160 54 Q169 27 190 33 Q188 54 160 58" fill="#91B985" />
            <path d="M158 59 Q157 46 160 37" stroke="#527E57" strokeWidth="2.5" fill="none" />

            {/* Eyebrows */}
            {sleepy ? (
                <>
                    <path d="M112 119 Q130 112 145 120" stroke="#70442E" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M175 120 Q190 112 207 119" stroke="#70442E" strokeWidth="4" strokeLinecap="round" fill="none" />
                </>
            ) : (
                <>
                    <path d="M113 111 Q130 101 145 111" stroke="#70442E" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M175 111 Q190 101 207 111" stroke="#70442E" strokeWidth="4" strokeLinecap="round" fill="none" />
                </>
            )}

            {/* Eyes */}
            {sleepy ? (
                <>
                    <path d="M113 137 Q130 150 146 137" stroke="#3B291F" strokeWidth="5" strokeLinecap="round" fill="none" />
                    <path d="M174 137 Q190 150 207 137" stroke="#3B291F" strokeWidth="5" strokeLinecap="round" fill="none" />
                </>
            ) : (
                <>
                    <ellipse cx="130" cy="139" rx={excited ? 13 : 11} ry={excited ? 17 : 14} fill="url(#momoEye)" />
                    <ellipse cx="190" cy="139" rx={excited ? 13 : 11} ry={excited ? 17 : 14} fill="url(#momoEye)" />
                    <circle cx={thinking ? 134 : 126} cy="133" r="4.5" fill="white" />
                    <circle cx={thinking ? 194 : 186} cy="133" r="4.5" fill="white" />
                    <circle cx="135" cy="145" r="2" fill="white" opacity="0.7" />
                    <circle cx="195" cy="145" r="2" fill="white" opacity="0.7" />
                </>
            )}

            {/* Muzzle */}
            <ellipse cx="160" cy="177" rx="47" ry="34" fill="url(#momoCream)" />

            {/* Nose */}
            <ellipse cx="160" cy="164" rx="13" ry="9" fill="#493026" />
            <ellipse cx="156" cy="161" rx="4" ry="2.5" fill="#98705C" opacity="0.8" />

            {/* Mouth and teeth */}
            {excited ? (
                <>
                    <path d="M145 184 Q160 207 175 184 Q160 195 145 184" fill="#5A302B" />
                    <path d="M150 184 L160 184 L160 194 L150 192 Z" fill="white" />
                    <path d="M160 184 L170 184 L170 192 L160 194 Z" fill="white" />
                    <ellipse cx="160" cy="199" rx="7" ry="4" fill="#D98285" />
                </>
            ) : sleepy ? (
                <path d="M150 185 Q160 190 170 185" stroke="#70442E" strokeWidth="3" strokeLinecap="round" fill="none" />
            ) : (
                <>
                    <path d="M160 172 L160 185 Q150 198 140 187" stroke="#70442E" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d="M160 185 Q170 198 180 187" stroke="#70442E" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <rect x="148" y="184" width="11" height="12" rx="3" fill="white" />
                    <rect x="161" y="184" width="11" height="12" rx="3" fill="white" />
                </>
            )}

            {/* Blushing cheeks */}
            <ellipse cx="99" cy="174" rx="15" ry="8" fill="#E99587" opacity="0.42" />
            <ellipse cx="221" cy="174" rx="15" ry="8" fill="#E99587" opacity="0.42" />

            {/* Scarf */}
            <path d="M86 218 Q160 246 234 218 L229 242 Q160 268 91 242 Z" fill="url(#momoScarf)" />
            <path d="M198 238 Q220 235 228 248 L214 283 Q202 276 190 268 Z" fill="#568F80" />
            <path d="M110 231 Q160 249 210 231" stroke="#A8D0B9" strokeWidth="3" opacity="0.55" fill="none" />

            {/* Small scarf detail */}
            <path d="M210 252 L218 259 L209 265" stroke="#B8D9C5" strokeWidth="2" fill="none" />

            {/* Thinking symbol */}
            {thinking && (
                <g fill="#D5A75C">
                    <circle cx="246" cy="93" r="5" />
                    <circle cx="260" cy="78" r="7" />
                    <path d="M269 51 Q280 38 290 51 Q299 65 280 71 Q268 75 269 51" />
                </g>
            )}

            {/* Sleepy Zs */}
            {sleepy && (
                <g fill="#8B9D9A" fontSize="19" fontWeight="bold">
                    <text x="230" y="72">z</text>
                    <text x="246" y="56" fontSize="14">z</text>
                </g>
            )}
        </svg>
    );
}

export default Capybara;
