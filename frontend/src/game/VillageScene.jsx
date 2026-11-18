function PixelTree({ x, y, scale = 1, dark = false }) {
    const canopy = dark ? "#3f6247" : "#4e7351";
    const middle = dark ? "#4d7153" : "#5f845a";
    const light = dark ? "#5c805e" : "#729466";

    return (
        <g transform={`translate(${x} ${y}) scale(${scale})`}>
            <rect
                x="-20"
                y="0"
                width="40"
                height="6"
                fill="#3f583c"
                opacity="0.25"
            />
            <rect x="-4" y="-14" width="8" height="20" fill="#684a34" />
            <rect x="-6" y="-18" width="12" height="6" fill="#795a40" />
            <rect x="-20" y="-34" width="40" height="16" fill={canopy} />
            <rect x="-28" y="-48" width="56" height="14" fill={canopy} />
            <rect x="-20" y="-60" width="40" height="12" fill={middle} />
            <rect x="-12" y="-68" width="24" height="8" fill={middle} />
            <rect x="-24" y="-42" width="12" height="8" fill={light} />
            <rect x="4" y="-58" width="10" height="6" fill={light} />
        </g>
    );
}

function Cottage({ x, y, scale = 1, chimney = false }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${scale})`}>
            <rect
                x="-46"
                y="44"
                width="92"
                height="6"
                fill="#42583d"
                opacity="0.22"
            />
            <rect x="-40" y="-4" width="80" height="50" fill="#e9d7b5" />
            <rect x="-40" y="38" width="80" height="8" fill="#cab58e" />
            <rect x="-40" y="-4" width="6" height="50" fill="#d8c39d" />
            <rect x="34" y="-4" width="6" height="50" fill="#d8c39d" />
            <rect x="-50" y="-14" width="100" height="12" fill="#805840" />
            <rect x="-40" y="-22" width="80" height="10" fill="#8e6248" />
            <rect x="-28" y="-30" width="56" height="10" fill="#805840" />
            <rect x="-16" y="-38" width="32" height="10" fill="#8e6248" />
            <rect x="-6" y="12" width="18" height="32" fill="#654733" />
            <rect x="0" y="17" width="5" height="5" fill="#d4b378" />
            <rect x="-34" y="8" width="14" height="14" fill="#e3b96d" />
            <rect x="22" y="8" width="14" height="14" fill="#e3b96d" />
            <rect x="-32" y="10" width="10" height="10" fill="#ffe6a9" />
            <rect x="24" y="10" width="10" height="10" fill="#ffe6a9" />
            {chimney && (
                <g>
                    <rect x="18" y="-48" width="10" height="14" fill="#79543d" />
                    <rect x="16" y="-52" width="14" height="6" fill="#684a38" />
                </g>
            )}
        </g>
    );
}

function Well({ x, y }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x="-26"
                y="20"
                width="52"
                height="6"
                fill="#40553c"
                opacity="0.2"
            />
            <rect x="-23" y="-6" width="46" height="24" fill="#9b9a8b" />
            <rect x="-17" y="0" width="34" height="12" fill="#638b85" />
            <rect x="-14" y="2" width="20" height="4" fill="#9bc1b5" />
            <rect x="-26" y="-26" width="6" height="26" fill="#705239" />
            <rect x="20" y="-26" width="6" height="26" fill="#705239" />
            <rect x="-30" y="-32" width="60" height="8" fill="#8b6044" />
            <rect x="-4" y="-26" width="8" height="14" fill="#d3bc91" />
        </g>
    );
}

function BerryBush({ x, y, scale = 1 }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${scale})`}>
            <rect
                x="-20"
                y="4"
                width="40"
                height="5"
                fill="#40553c"
                opacity="0.2"
            />
            <rect x="-16" y="-12" width="32" height="20" fill="#4c7049" />
            <rect x="-9" y="-19" width="18" height="9" fill="#5b7e54" />
            <rect x="-20" y="-7" width="7" height="11" fill="#557950" />
            <rect x="13" y="-7" width="7" height="11" fill="#557950" />
            <rect x="-11" y="-5" width="4" height="4" fill="#b65b52" />
            <rect x="4" y="-9" width="4" height="4" fill="#c86559" />
            <rect x="-1" y="2" width="4" height="4" fill="#a94f49" />
        </g>
    );
}

function Flower({ x, y, color }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x="-1" y="-7" width="2" height="7" fill="#5f7e54" />
            <rect x="-4" y="-10" width="3" height="3" fill={color} />
            <rect x="1" y="-10" width="3" height="3" fill={color} />
            <rect x="-1" y="-13" width="3" height="3" fill={color} />
            <rect x="-4" y="-6" width="3" height="3" fill={color} />
            <rect x="1" y="-6" width="3" height="3" fill={color} />
            <rect x="-1" y="-9" width="3" height="3" fill="#f4dc91" />
        </g>
    );
}

function VillageScene({ lanternLit = false, layers = [] }) {
    const has = (layer) => layers.includes(layer);

    return (
        <svg
            className="village-scene"
            viewBox="0 0 960 540"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            focusable="false"
            shapeRendering="crispEdges"
        >
            <rect width="960" height="540" fill="#7c9b6c" />
            <rect width="960" height="188" fill="#c2d4c5" />
            <rect width="960" height="72" fill="#b7ccbe" />
            <rect y="72" width="960" height="60" fill="#cbdccb" />
            <rect y="132" width="960" height="56" fill="#d8e3cf" />

            <g fill="#f2d491">
                <rect x="740" y="44" width="56" height="8" />
                <rect x="732" y="52" width="72" height="8" />
                <rect x="724" y="60" width="88" height="40" />
                <rect x="732" y="100" width="72" height="8" />
                <rect x="740" y="108" width="56" height="8" />
            </g>
            <rect x="748" y="68" width="40" height="24" fill="#ffe6a9" />

            <g fill="#eef4e9" opacity="0.66">
                <rect x="150" y="58" width="72" height="9" />
                <rect x="140" y="67" width="92" height="9" />
                <rect x="158" y="76" width="56" height="7" />
                <rect x="466" y="42" width="58" height="7" />
                <rect x="458" y="49" width="74" height="8" />
                <rect x="474" y="57" width="44" height="6" />
            </g>

            <path
                d="M0 188 L0 160 L64 160 L64 148 L128 148 L128 132 L192 132 L192 148 L272 148 L272 160 L376 160 L376 172 L480 172 L480 156 L560 156 L560 144 L648 144 L648 160 L736 160 L736 148 L824 148 L824 160 L900 160 L900 148 L960 148 L960 188 Z"
                fill="#a8bd9b"
            />
            <path
                d="M0 202 L0 178 L88 178 L88 170 L177 170 L177 178 L270 178 L270 188 L370 188 L370 180 L464 180 L464 190 L570 190 L570 178 L682 178 L682 188 L780 188 L780 178 L866 178 L866 188 L960 188 L960 202 Z"
                fill="#91ab83"
            />

            <g fill="#75946a">
                <rect x="44" y="176" width="18" height="24" />
                <rect x="72" y="184" width="12" height="16" />
                <rect x="842" y="178" width="16" height="22" />
                <rect x="870" y="186" width="12" height="14" />
                <rect x="902" y="178" width="18" height="22" />
            </g>

            <rect y="188" width="960" height="352" fill="#7d9c6d" />
            <rect y="188" width="960" height="22" fill="#93ad7f" />

            <g fill="#d5bf94">
                <path d="M448 540 L512 540 L506 492 L524 446 L550 414 L546 392 L498 386 L470 420 L448 468 L430 510 Z" />
                <path d="M474 386 L392 354 L300 334 L212 326 L204 344 L288 352 L390 376 L476 406 Z" />
                <path d="M486 376 L602 338 L702 312 L834 298 L836 316 L710 333 L608 362 L496 402 Z" />
                <path d="M442 478 L372 462 L286 476 L260 498 L274 514 L340 494 L416 504 Z" />
            </g>

            <g fill="#bfa779" opacity="0.7">
                <rect x="456" y="510" width="28" height="6" />
                <rect x="478" y="468" width="24" height="5" />
                <rect x="502" y="428" width="20" height="5" />
                <rect x="390" y="380" width="22" height="5" />
                <rect x="318" y="356" width="20" height="5" />
                <rect x="612" y="346" width="22" height="5" />
                <rect x="708" y="326" width="20" height="5" />
                <rect x="364" y="480" width="20" height="5" />
            </g>

            <g transform="translate(470 344)">
                <rect x="-60" y="-24" width="120" height="48" fill="#cdbb96" />
                <rect x="-52" y="-30" width="104" height="6" fill="#dccaa6" />
                <rect x="-52" y="24" width="104" height="6" fill="#b7a47f" />
                <rect x="-44" y="-18" width="16" height="8" fill="#b7a47f" />
                <rect x="30" y="8" width="16" height="8" fill="#b7a47f" />
            </g>

            <g fill="#8eb4ae">
                <rect x="862" y="294" width="30" height="138" />
                <rect x="892" y="278" width="40" height="166" />
                <rect x="932" y="306" width="28" height="126" />
            </g>
            <g fill="#b5d1c8">
                <rect x="868" y="322" width="16" height="5" />
                <rect x="900" y="302" width="22" height="5" />
                <rect x="936" y="336" width="14" height="5" />
                <rect x="902" y="388" width="20" height="5" />
                <rect x="870" y="406" width="12" height="5" />
            </g>

            <g transform="translate(792 356)">
                <rect x="-48" y="16" width="96" height="20" fill="#7a7d70" />
                <rect x="-58" y="6" width="116" height="10" fill="#85887b" />
                <rect x="-38" y="-8" width="70" height="30" fill="#a2a294" />
                <rect x="-24" y="-28" width="44" height="24" fill="#b4b3a2" />
                <rect x="-16" y="-38" width="26" height="12" fill="#c0beaa" />
                <rect x="18" y="-2" width="28" height="22" fill="#919487" />
                <rect x="-44" y="2" width="14" height="16" fill="#97998b" />
                <rect x="-18" y="-30" width="10" height="6" fill="#d0cdb9" />
                <rect x="2" y="-10" width="12" height="6" fill="#bebcaa" />
                <rect x="-52" y="34" width="104" height="6" fill="#656b61" />
            </g>

            <g transform="translate(338 444)">
                <rect x="-92" y="-24" width="184" height="64" fill="#8da874" />
                <path
                    d="M-92 -24 L-72 -40 L-30 -36 L-6 -50 L38 -42 L64 -54 L92 -38 L92 40 L-92 40 Z"
                    fill="#8da874"
                />
                <rect x="-82" y="12" width="164" height="6" fill="#6f8e5f" opacity="0.55" />
                <rect x="-70" y="-26" width="22" height="4" fill="#a5ba87" />
                <rect x="28" y="-38" width="20" height="4" fill="#a5ba87" />
            </g>

            <Flower x={284} y={444} color="#f1d69b" />
            <Flower x={302} y={466} color="#dfc5e1" />
            <Flower x={326} y={438} color="#f1d69b" />
            <Flower x={356} y={470} color="#f0b09f" />
            <Flower x={386} y={450} color="#dfc5e1" />
            <Flower x={264} y={486} color="#f1d69b" />
            <Flower x={414} y={486} color="#f1d69b" />
            <BerryBush x={356} y={462} />
            <BerryBush x={304} y={496} scale={0.82} />
            <BerryBush x={412} y={510} scale={0.72} />

            <Cottage x={430} y={298} scale={1.04} chimney />
            <Cottage x={550} y={330} scale={0.82} />
            <Well x={498} y={390} />

            <g transform="translate(610 360)">
                <rect x="-3" y="-42" width="6" height="44" fill="#5f4632" />
                <rect x="-12" y="-60" width="24" height="5" fill="#694935" />
                <rect x="-10" y="-55" width="20" height="15" fill="#a97544" />
                <rect x="-6" y="-52" width="12" height="9" fill="#ffe4a3" />
                {lanternLit && (
                    <g fill="#ffdfa0" opacity="0.24">
                        <rect x="-32" y="-78" width="64" height="44" />
                        <rect x="-44" y="-66" width="88" height="20" />
                        <rect x="-24" y="-88" width="48" height="10" />
                    </g>
                )}
            </g>

            <g fill="#d1ba90">
                <rect x="606" y="318" width="5" height="18" />
                <rect x="622" y="318" width="5" height="18" />
                <rect x="640" y="318" width="5" height="18" />
                <rect x="656" y="318" width="5" height="18" />
                <rect x="604" y="324" width="60" height="5" />
                <rect x="604" y="334" width="60" height="5" />
            </g>

            <PixelTree x={140} y={390} scale={1.28} dark />
            <PixelTree x={212} y={352} scale={0.98} />
            <PixelTree x={88} y={452} scale={1.1} dark />
            <PixelTree x={184} y={474} scale={0.9} />
            <PixelTree x={250} y={408} scale={0.72} dark />
            <PixelTree x={306} y={366} scale={0.62} />

            <Flower x={112} y={492} color="#f1d69b" />
            <Flower x={156} y={512} color="#dfc5e1" />
            <Flower x={242} y={496} color="#f1d69b" />
            <Flower x={276} y={426} color="#f0b09f" />
            <Flower x={700} y={452} color="#f1d69b" />
            <Flower x={728} y={476} color="#dfc5e1" />
            <Flower x={648} y={508} color="#f1d69b" />
            <Flower x={864} y={486} color="#dfc5e1" />

            <g fill="#6f8e5f" opacity="0.55">
                <rect x="584" y="472" width="18" height="4" />
                <rect x="594" y="464" width="12" height="4" />
                <rect x="666" y="444" width="20" height="4" />
                <rect x="682" y="452" width="14" height="4" />
                <rect x="788" y="486" width="18" height="4" />
                <rect x="806" y="478" width="12" height="4" />
                <rect x="460" y="510" width="18" height="4" />
            </g>

            {has("clear") && (
                <rect
                    y="0"
                    width="960"
                    height="188"
                    fill="#e7f3f6"
                    opacity="0.32"
                />
            )}

            {has("horizon") && (
                <g fill="#cfe6ec" opacity="0.7">
                    <rect y="150" width="960" height="6" />
                    <rect y="164" width="960" height="4" />
                </g>
            )}

            {has("stars") && (
                <g fill="#fdfbf5">
                    <rect x="120" y="34" width="4" height="4" />
                    <rect x="210" y="58" width="3" height="3" />
                    <rect x="300" y="28" width="4" height="4" />
                    <rect x="520" y="40" width="3" height="3" />
                    <rect x="640" y="24" width="4" height="4" />
                    <rect x="860" y="52" width="3" height="3" />
                </g>
            )}

            {has("birds") && (
                <g fill="#4e5f54" opacity="0.75">
                    <path d="M600 96 l10 -7 l10 7 l-4 1 l-6 -4 l-6 4 z" />
                    <path d="M648 82 l8 -6 l8 6 l-3 1 l-5 -3 l-5 3 z" />
                    <path d="M700 104 l7 -5 l7 5 l-3 1 l-4 -3 l-4 3 z" />
                </g>
            )}

            {has("trail") && (
                <path
                    d="M300 512 L360 470 L430 452 L500 432 L560 396 L600 360"
                    fill="none"
                    stroke="#d5bf94"
                    strokeWidth="10"
                    strokeLinecap="round"
                    opacity="0.75"
                />
            )}

            {has("pond") && (
                <g>
                    <rect
                        x="700"
                        y="430"
                        width="150"
                        height="52"
                        rx="26"
                        fill="#9fc3c8"
                        opacity="0.85"
                    />
                    <rect
                        x="724"
                        y="446"
                        width="70"
                        height="6"
                        rx="3"
                        fill="#cfe6ea"
                        opacity="0.8"
                    />
                </g>
            )}

            {has("garden") && (
                <g>
                    <rect x="596" y="470" width="120" height="46" fill="#6f8e5f" />
                    <rect x="596" y="470" width="120" height="6" fill="#8da874" />
                    <rect x="612" y="486" width="10" height="22" fill="#4e7351" />
                    <rect x="640" y="486" width="10" height="22" fill="#4e7351" />
                    <rect x="668" y="486" width="10" height="22" fill="#4e7351" />
                    <rect x="696" y="486" width="10" height="22" fill="#4e7351" />
                </g>
            )}

            {has("berries") && (
                <>
                    <BerryBush x={620} y={492} scale={0.8} />
                    <BerryBush x={700} y={498} scale={0.7} />
                </>
            )}

            {has("table") && (
                <g transform="translate(560 512)">
                    <rect x="-46" y="-10" width="92" height="10" fill="#a97544" />
                    <rect x="-38" y="0" width="8" height="20" fill="#8a5c20" />
                    <rect x="30" y="0" width="8" height="20" fill="#8a5c20" />
                </g>
            )}

            {has("flowers") && (
                <>
                    <Flower x={470} y={520} color="#f0b09f" />
                    <Flower x={520} y={500} color="#f1d69b" />
                    <Flower x={560} y={524} color="#dfc5e1" />
                </>
            )}

            {has("butterflies") && (
                <g fill="#e7c98f">
                    <path d="M420 400 l7 -6 l7 6 l-7 3 z" />
                    <path d="M470 380 l6 -5 l6 5 l-6 3 z" />
                    <path d="M380 430 l6 -5 l6 5 l-6 3 z" />
                </g>
            )}
        </svg>
    );
}

export default VillageScene;
