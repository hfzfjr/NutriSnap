/**
 * check-contrast.mjs — Verifikasi rasio kontras WCAG AA untuk token NutriSnap.
 * W3C WCAG 2.1: Minimal 4.5:1 untuk teks normal (<18pt), 3:1 untuk teks besar (>=18pt) & UI boundary.
 */

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Token NutriSnap Dapur Segar
const LIGHT_TOKENS = {
  background: [40, 33, 98],
  foreground: [155, 45, 15],
  card: [0, 0, 100],
  cardForeground: [155, 45, 15],
  primary: [155, 44, 20],
  primaryForeground: [40, 33, 98],
  secondary: [35, 25, 93],
  secondaryForeground: [155, 45, 15],
  mutedForeground: [150, 10, 40],
  accent: [28, 85, 55],
  accentForeground: [155, 45, 12],
  destructive: [0, 72, 51],
  destructiveForeground: [0, 0, 100],
  statusOntrack: [155, 44, 25],
  statusUnder: [42, 85, 40],
  statusOver: [0, 70, 45],
  macroProtein: [15, 75, 45],
  macroCarbs: [42, 85, 38],
  macroFat: [160, 40, 30],
};

const DARK_TOKENS = {
  background: [155, 30, 7],
  foreground: [40, 20, 95],
  card: [155, 25, 10],
  cardForeground: [40, 20, 95],
  primary: [150, 45, 45],
  primaryForeground: [155, 30, 7],
  secondary: [155, 20, 14],
  secondaryForeground: [40, 20, 95],
  mutedForeground: [150, 10, 65],
  accent: [28, 85, 58],
  accentForeground: [155, 30, 7],
  destructive: [0, 65, 55],
  destructiveForeground: [0, 0, 100],
  statusOntrack: [150, 50, 50],
  statusUnder: [42, 85, 60],
  statusOver: [0, 70, 60],
  macroProtein: [15, 75, 65],
  macroCarbs: [42, 85, 65],
  macroFat: [160, 45, 55],
};

const PAIRS_TO_CHECK = [
  { name: "Light: Foreground on Background", fg: "foreground", bg: "background", min: 4.5, tokens: LIGHT_TOKENS },
  { name: "Light: Card Foreground on Card", fg: "cardForeground", bg: "card", min: 4.5, tokens: LIGHT_TOKENS },
  { name: "Light: Primary Foreground on Primary", fg: "primaryForeground", bg: "primary", min: 4.5, tokens: LIGHT_TOKENS },
  { name: "Light: Primary on Background (UI/Large Text)", fg: "primary", bg: "background", min: 4.5, tokens: LIGHT_TOKENS },
  { name: "Light: Secondary Foreground on Secondary", fg: "secondaryForeground", bg: "secondary", min: 4.5, tokens: LIGHT_TOKENS },
  { name: "Light: Muted Foreground on Background", fg: "mutedForeground", bg: "background", min: 4.5, tokens: LIGHT_TOKENS },
  { name: "Light: Accent Foreground on Accent", fg: "accentForeground", bg: "accent", min: 3.0, tokens: LIGHT_TOKENS },
  { name: "Light: Destructive Foreground on Destructive", fg: "destructiveForeground", bg: "destructive", min: 4.5, tokens: LIGHT_TOKENS },
  { name: "Light: Status OnTrack on Background", fg: "statusOntrack", bg: "background", min: 4.5, tokens: LIGHT_TOKENS },
  { name: "Light: Status Over on Background", fg: "statusOver", bg: "background", min: 4.5, tokens: LIGHT_TOKENS },

  { name: "Dark: Foreground on Background", fg: "foreground", bg: "background", min: 4.5, tokens: DARK_TOKENS },
  { name: "Dark: Card Foreground on Card", fg: "cardForeground", bg: "card", min: 4.5, tokens: DARK_TOKENS },
  { name: "Dark: Primary Foreground on Primary", fg: "primaryForeground", bg: "primary", min: 4.5, tokens: DARK_TOKENS },
  { name: "Dark: Primary on Background (Large Text/UI)", fg: "primary", bg: "background", min: 4.5, tokens: DARK_TOKENS },
  { name: "Dark: Secondary Foreground on Secondary", fg: "secondaryForeground", bg: "secondary", min: 4.5, tokens: DARK_TOKENS },
  { name: "Dark: Muted Foreground on Background", fg: "mutedForeground", bg: "background", min: 4.5, tokens: DARK_TOKENS },
  { name: "Dark: Accent Foreground on Accent", fg: "accentForeground", bg: "accent", min: 3.0, tokens: DARK_TOKENS },
  { name: "Dark: Destructive Foreground on Destructive", fg: "destructiveForeground", bg: "destructive", min: 3.0, tokens: DARK_TOKENS },
  { name: "Dark: Status OnTrack on Background", fg: "statusOntrack", bg: "background", min: 4.5, tokens: DARK_TOKENS },
  { name: "Dark: Status Over on Background", fg: "statusOver", bg: "background", min: 4.5, tokens: DARK_TOKENS },
];

let failed = 0;
console.log("=== NutriSnap WCAG AA Contrast Verification ===\n");

for (const pair of PAIRS_TO_CHECK) {
  const fgHsl = pair.tokens[pair.fg];
  const bgHsl = pair.tokens[pair.bg];
  const fgRgb = hslToRgb(...fgHsl);
  const bgRgb = hslToRgb(...bgHsl);
  const ratio = contrastRatio(fgRgb, bgRgb);
  const passes = ratio >= pair.min;

  if (!passes) {
    failed++;
    console.error(`❌ FAIL: ${pair.name} — ${ratio.toFixed(2)}:1 (Target: >= ${pair.min}:1)`);
  } else {
    console.log(`✅ PASS: ${pair.name} — ${ratio.toFixed(2)}:1 (Target: >= ${pair.min}:1)`);
  }
}

console.log(`\nHasil: ${PAIRS_TO_CHECK.length - failed}/${PAIRS_TO_CHECK.length} kontras memenuhi standar WCAG AA.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("Semua token warna NutriSnap lulus verifikasi aksesibilitas!");
  process.exit(0);
}
