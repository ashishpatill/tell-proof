/**
 * Procedural SVG keyframes for pointer-driven character + companion.
 * 16 circular look-around poses for Reed; 12 for Pip the fox.
 * Start angle aligned so frame 0 ≈ looking toward the headline.
 */

export const REED_FRAME_COUNT = 16;
export const PIP_FRAME_COUNT = 12;
export const EXPLODE_FRAME_COUNT = 24;

function reedPose(frame: number): string {
  const t = (frame / REED_FRAME_COUNT) * Math.PI * 2;
  // Head leans toward pointer direction; body stays anchored (hand on type).
  const headX = Math.cos(t) * 10;
  const headY = Math.sin(t) * 6;
  const pupilX = Math.cos(t) * 3.2;
  const pupilY = Math.sin(t) * 2.4;
  const armLift = Math.sin(t) * 3;
  const legKick = Math.max(0, Math.sin(t + 0.4)) * 8;
  const smile = 0.35 + Math.cos(t) * 0.15;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 0 184 280" fill="none" aria-hidden="true" overflow="visible">
  <!-- grounded stance -->
  <path d="M72 248 L68 278" stroke="#141414" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M92 248 L96 ${278 - legKick}" stroke="#141414" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M62 278 L78 278" stroke="#141414" stroke-width="3" stroke-linecap="round"/>
  <path d="M88 ${278 - legKick} L104 ${278 - legKick}" stroke="#141414" stroke-width="3" stroke-linecap="round"/>
  <!-- torso -->
  <path d="M82 118 C70 132 66 170 68 210 C70 232 74 248 82 248 C90 248 94 232 96 210 C98 170 94 132 82 118Z" fill="#f7f7f4" stroke="#141414" stroke-width="3"/>
  <path d="M70 148 H94" stroke="#141414" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
  <!-- lean arm resting on type — extends past left of viewBox into the headline -->
  <path d="M68 148 C40 142 10 ${136 + armLift} -18 ${130 + armLift * 0.4}" stroke="#141414" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="-20" cy="${128 + armLift * 0.4}" r="5.5" fill="#f7f7f4" stroke="#141414" stroke-width="2.6"/>
  <!-- free arm -->
  <path d="M96 152 C112 160 118 ${176 + armLift} 110 ${198 + armLift * 0.4}" stroke="#141414" stroke-width="3.2" stroke-linecap="round"/>
  <!-- neck -->
  <path d="M82 118 L${82 + headX * 0.2} ${102 + headY * 0.15}" stroke="#141414" stroke-width="3" stroke-linecap="round"/>
  <!-- head -->
  <g transform="translate(${headX}, ${headY})">
    <circle cx="82" cy="72" r="34" fill="#f7f7f4" stroke="#141414" stroke-width="3.2"/>
    <!-- hair tuft -->
    <path d="M78 40 C80 28 88 26 92 34" stroke="#141414" stroke-width="3" stroke-linecap="round" fill="none"/>
    <!-- glasses -->
    <circle cx="70" cy="74" r="11" fill="none" stroke="#141414" stroke-width="2.8"/>
    <circle cx="94" cy="74" r="11" fill="none" stroke="#141414" stroke-width="2.8"/>
    <path d="M81 74 H83" stroke="#141414" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M59 74 H54" stroke="#141414" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M105 74 H110" stroke="#141414" stroke-width="2.4" stroke-linecap="round"/>
    <!-- pupils track pointer -->
    <circle cx="${70 + pupilX}" cy="${74 + pupilY}" r="3.2" fill="#141414"/>
    <circle cx="${94 + pupilX}" cy="${74 + pupilY}" r="3.2" fill="#141414"/>
    <!-- smile -->
    <path d="M74 ${90 + smile} Q82 ${94 + smile * 4} 90 ${90 + smile}" stroke="#141414" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;
}

function pipPose(frame: number): string {
  const t = (frame / PIP_FRAME_COUNT) * Math.PI * 2;
  const headX = Math.cos(t) * 8;
  const headY = Math.sin(t) * 5;
  const earTip = Math.sin(t) * 4;
  const pupilX = Math.cos(t) * 2.8;
  const pupilY = Math.sin(t) * 2.2;
  const tailSwing = Math.sin(t) * 14;
  const lean = Math.cos(t) * 3;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 200" fill="none" aria-hidden="true">
  <!-- tail -->
  <path d="M138 118 C${152 + tailSwing} ${100 - earTip} ${168 + tailSwing * 0.5} ${110 + earTip} ${158 + tailSwing * 0.3} ${128}"
    stroke="#c45a12" stroke-width="10" stroke-linecap="round" fill="none"/>
  <path d="M138 118 C${152 + tailSwing} ${100 - earTip} ${168 + tailSwing * 0.5} ${110 + earTip} ${158 + tailSwing * 0.3} ${128}"
    stroke="#f0a24a" stroke-width="5" stroke-linecap="round" fill="none"/>
  <!-- body -->
  <ellipse cx="${98 + lean}" cy="132" rx="42" ry="34" fill="#e8923a" stroke="#1a120c" stroke-width="2.8"/>
  <ellipse cx="${90 + lean}" cy="138" rx="26" ry="22" fill="#fff6e8"/>
  <!-- legs -->
  <path d="M78 158 L74 186" stroke="#1a120c" stroke-width="3" stroke-linecap="round"/>
  <path d="M92 160 L94 186" stroke="#1a120c" stroke-width="3" stroke-linecap="round"/>
  <path d="M112 158 L116 186" stroke="#1a120c" stroke-width="3" stroke-linecap="round"/>
  <path d="M126 156 L132 184" stroke="#1a120c" stroke-width="3" stroke-linecap="round"/>
  <path d="M68 186 H80" stroke="#1a120c" stroke-width="3" stroke-linecap="round"/>
  <path d="M88 186 H100" stroke="#1a120c" stroke-width="3" stroke-linecap="round"/>
  <path d="M110 186 H122" stroke="#1a120c" stroke-width="3" stroke-linecap="round"/>
  <path d="M126 184 H140" stroke="#1a120c" stroke-width="3" stroke-linecap="round"/>
  <!-- head -->
  <g transform="translate(${headX}, ${headY})">
    <ellipse cx="78" cy="78" rx="36" ry="32" fill="#e8923a" stroke="#1a120c" stroke-width="2.8"/>
    <!-- ears -->
    <path d="M56 58 L48 ${28 - earTip} L70 52Z" fill="#e8923a" stroke="#1a120c" stroke-width="2.4"/>
    <path d="M54 54 L50 ${36 - earTip * 0.5} L64 50Z" fill="#fff6e8"/>
    <path d="M98 56 L108 ${26 + earTip} L84 52Z" fill="#e8923a" stroke="#1a120c" stroke-width="2.4"/>
    <path d="M98 52 L104 ${36 + earTip * 0.5} L88 50Z" fill="#fff6e8"/>
    <!-- face blaze -->
    <ellipse cx="78" cy="86" rx="20" ry="18" fill="#fff6e8"/>
    <!-- eyes -->
    <circle cx="66" cy="76" r="5.5" fill="#1a120c"/>
    <circle cx="90" cy="76" r="5.5" fill="#1a120c"/>
    <circle cx="${66 + pupilX * 0.4}" cy="${74 + pupilY * 0.4}" r="1.8" fill="#fff6e8"/>
    <circle cx="${90 + pupilX * 0.4}" cy="${74 + pupilY * 0.4}" r="1.8" fill="#fff6e8"/>
    <!-- nose -->
    <ellipse cx="${78 + pupilX * 0.3}" cy="92" rx="5" ry="3.5" fill="#1a120c"/>
    <path d="M78 95 Q78 102 72 104" stroke="#1a120c" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M78 95 Q78 102 84 104" stroke="#1a120c" stroke-width="1.8" stroke-linecap="round"/>
  </g>
</svg>`;
}

/** Phone intact → spin → explode keyframes for scroll scrub. */
function explodePose(frame: number): string {
  const p = frame / (EXPLODE_FRAME_COUNT - 1);
  const rot = p < 0.35 ? (p / 0.35) * 18 : 18 + ((p - 0.35) / 0.65) * 8;
  const spread = p < 0.4 ? 0 : ((p - 0.4) / 0.6) * 1;
  const spark = p > 0.05 && p < 0.95 ? 1 : 0;
  const layers = [
    { y: -58 * spread, label: "glass", fill: "#dfe8f2" },
    { y: -28 * spread, label: "display", fill: "#1c2430" },
    { y: 0, label: "board", fill: "#3d7a5a" },
    { y: 30 * spread, label: "battery", fill: "#2a2a2a" },
    { y: 58 * spread, label: "shell", fill: "#c8ced6" },
  ];

  const layerSvg =
    spread < 0.08
      ? `<g transform="rotate(${rot} 120 110)">
          <rect x="78" y="38" width="84" height="148" rx="14" fill="#c8ced6" stroke="#141414" stroke-width="3"/>
          <rect x="84" y="50" width="72" height="112" rx="6" fill="#1c2430"/>
          <circle cx="120" cy="172" r="4" fill="#141414"/>
          <rect x="108" y="44" width="24" height="4" rx="2" fill="#141414"/>
        </g>`
      : layers
          .map(
            (L, i) => `<g transform="translate(0 ${L.y}) rotate(${rot * (1 - i * 0.08)} 120 110)">
            <rect x="78" y="${60 + i * 2}" width="84" height="${i === 2 ? 28 : 22}" rx="6" fill="${L.fill}" stroke="#141414" stroke-width="2.4"/>
            ${i === 1 ? `<rect x="88" y="66" width="64" height="12" rx="2" fill="#5ad0a8" opacity="0.85"/>` : ""}
            ${i === 2 ? `<circle cx="100" cy="74" r="4" fill="#f0c14a"/><circle cx="140" cy="74" r="4" fill="#f0c14a"/>` : ""}
          </g>`,
          )
          .join("");

  const sparks =
    spark > 0
      ? Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2 + p * 2;
          const r = 70 + spread * 40;
          const x = 120 + Math.cos(a) * r;
          const y = 110 + Math.sin(a) * r * 0.7;
          return `<path d="M${x} ${y} l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2z" fill="#f0c14a" opacity="${0.35 + spread * 0.5}"/>`;
        }).join("")
      : "";

  const screws =
    spread > 0.3
      ? `<circle cx="${70 - spread * 20}" cy="${90 - spread * 10}" r="3" fill="#888" stroke="#141414" stroke-width="1.5"/>
         <circle cx="${170 + spread * 18}" cy="${130 + spread * 12}" r="3" fill="#888" stroke="#141414" stroke-width="1.5"/>
         <circle cx="${160 + spread * 24}" cy="${70 - spread * 8}" r="3" fill="#888" stroke="#141414" stroke-width="1.5"/>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 220" fill="none" aria-hidden="true">
  ${sparks}
  ${layerSvg}
  ${screws}
</svg>`;
}

function buildCache(count: number, factory: (i: number) => string): string[] {
  return Array.from({ length: count }, (_, i) => factory(i));
}

export const REED_FRAMES = buildCache(REED_FRAME_COUNT, reedPose);
export const PIP_FRAMES = buildCache(PIP_FRAME_COUNT, pipPose);
export const EXPLODE_FRAMES = buildCache(EXPLODE_FRAME_COUNT, explodePose);
