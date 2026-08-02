// Generates simple, deterministic placeholder illustrations for the mock
// property listings so the app has no dependency on external image hosts.
// Run with: node scripts/generate-placeholder-images.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "images", "properties");
mkdirSync(outDir, { recursive: true });

const properties = [
  { id: "p01", name: "ドムス渋谷参道" },
  { id: "p02", name: "グランツ新宿三丁目" },
  { id: "p03", name: "コンフォート三軒茶屋" },
  { id: "p04", name: "アーバンヒルズ麻布十番" },
  { id: "p05", name: "サンライズ中野" },
  { id: "p06", name: "グリーンコート荻窪" },
  { id: "p07", name: "リブレ中目黒" },
  { id: "p08", name: "レジデンス浅草雷門" },
  { id: "p09", name: "パークサイド五反田" },
  { id: "p10", name: "メゾン池袋" },
  { id: "p11", name: "ブライトタワー月島" },
  { id: "p12", name: "アクアシティ豊洲" },
  { id: "p13", name: "コーポ石神井" },
  { id: "p14", name: "文京ガーデンレジデンス" },
  { id: "p15", name: "スカイビュー錦糸町" },
  { id: "p16", name: "グランドール蒲田" },
];

const GOLDEN_ANGLE = 137.508;

function hueForIndex(index) {
  return Math.round((index * GOLDEN_ANGLE) % 360);
}

function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function exteriorSvg(hue, name, tag) {
  const sky1 = `hsl(${hue}, 70%, 88%)`;
  const sky2 = `hsl(${(hue + 24) % 360}, 65%, 72%)`;
  const building = `hsl(${hue}, 30%, 32%)`;
  const buildingShade = `hsl(${hue}, 30%, 24%)`;
  const window = `hsl(${(hue + 40) % 360}, 85%, 82%)`;

  const windowRects = [];
  const cols = 6;
  const rows = 5;
  const startX = 90;
  const startY = 210;
  const w = 34;
  const h = 34;
  const gapX = 14;
  const gapY = 16;
  let seed = hue;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      seed = (seed * 9301 + 49297) % 233280;
      const lit = seed / 233280 > 0.35;
      windowRects.push(
        `<rect x="${startX + c * (w + gapX)}" y="${startY + r * (h + gapY)}" width="${w}" height="${h}" rx="2" fill="${
          lit ? window : "rgba(255,255,255,0.18)"
        }" />`
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${escapeXml(
    name
  )} 外観">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${sky1}" />
      <stop offset="100%" stop-color="${sky2}" />
    </linearGradient>
    <linearGradient id="bld" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${building}" />
      <stop offset="100%" stop-color="${buildingShade}" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#sky)" />
  <rect x="0" y="560" width="800" height="40" fill="hsl(${hue}, 25%, 40%)" />
  <rect x="60" y="150" width="620" height="410" rx="6" fill="url(#bld)" />
  <rect x="60" y="150" width="620" height="36" fill="rgba(0,0,0,0.15)" />
  ${windowRects.join("\n  ")}
  <rect x="0" y="500" width="800" height="100" fill="rgba(0,0,0,0.38)" />
  <text x="40" y="540" font-family="'Hiragino Sans','Noto Sans JP',sans-serif" font-size="30" font-weight="700" fill="#fff">${escapeXml(
    name
  )}</text>
  <text x="40" y="572" font-family="'Hiragino Sans','Noto Sans JP',sans-serif" font-size="18" fill="rgba(255,255,255,0.85)">${escapeXml(
    tag
  )}</text>
</svg>`;
}

function roomSvg(hue, name, tag) {
  const wall = `hsl(${hue}, 35%, 90%)`;
  const wallShade = `hsl(${hue}, 30%, 82%)`;
  const floor = `hsl(${(hue + 20) % 360}, 30%, 62%)`;
  const sky1 = `hsl(${(hue + 190) % 360}, 70%, 88%)`;
  const sky2 = `hsl(${(hue + 210) % 360}, 65%, 70%)`;
  const accent = `hsl(${(hue + 300) % 360}, 55%, 55%)`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${escapeXml(
    name
  )} 室内">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${wall}" />
      <stop offset="100%" stop-color="${wallShade}" />
    </linearGradient>
    <linearGradient id="skyRoom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${sky1}" />
      <stop offset="100%" stop-color="${sky2}" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#wall)" />
  <polygon points="0,420 800,420 800,600 0,600" fill="${floor}" />
  <polygon points="120,420 680,420 780,600 20,600" fill="rgba(0,0,0,0.08)" />
  <rect x="480" y="110" width="240" height="220" rx="4" fill="url(#skyRoom)" stroke="#fff" stroke-width="10" />
  <line x1="600" y1="110" x2="600" y2="330" stroke="#fff" stroke-width="8" />
  <line x1="480" y1="220" x2="720" y2="220" stroke="#fff" stroke-width="8" />
  <rect x="90" y="330" width="220" height="100" rx="16" fill="${accent}" />
  <rect x="90" y="310" width="220" height="30" rx="14" fill="${accent}" opacity="0.85" />
  <rect x="90" y="430" width="220" height="14" fill="rgba(0,0,0,0.15)" />
  <rect x="360" y="360" width="90" height="70" rx="6" fill="hsl(${hue}, 20%, 30%)" />
  <rect x="0" y="500" width="800" height="100" fill="rgba(0,0,0,0.38)" />
  <text x="40" y="540" font-family="'Hiragino Sans','Noto Sans JP',sans-serif" font-size="30" font-weight="700" fill="#fff">${escapeXml(
    name
  )}</text>
  <text x="40" y="572" font-family="'Hiragino Sans','Noto Sans JP',sans-serif" font-size="18" fill="rgba(255,255,255,0.85)">${escapeXml(
    tag
  )}</text>
</svg>`;
}

properties.forEach((property, index) => {
  const hue = hueForIndex(index);
  writeFileSync(
    path.join(outDir, `${property.id}-exterior.svg`),
    exteriorSvg(hue, property.name, "外観イメージ")
  );
  writeFileSync(
    path.join(outDir, `${property.id}-room.svg`),
    roomSvg(hue, property.name, "室内イメージ")
  );
});

console.log(`Generated ${properties.length * 2} placeholder images in ${outDir}`);
