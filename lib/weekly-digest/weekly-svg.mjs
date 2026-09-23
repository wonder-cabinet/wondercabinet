// Weekly digest, v2: real HTML/SVG rebuild replacing the satori/@vercel-og
// pipeline entirely. Built directly from the actual Figma SVG exports
// Ibrahim provided (file WC-DESIGN, week WK03: `Weekly -Sep-WK03-cover/en/ar.svg`
// + the generic print reference `A3 PRINT.svg` / `A3 PRINT 02.svg`), pulled
// from his Dropbox (Program/2026/09 Sep/WK03/Claude/).
//
// Why the rebuild: the old satori pipeline required routing around a
// satori bidi bug (digit-reversal, word-order) with hacks (arNum/bidiRow).
// Real SVG <text> with direction="rtl" handles Arabic bidi and mixed
// Arabic-Indic digits correctly out of the box (verified empirically) --
// so none of that is needed here. This module emits plain, valid SVG
// documents with live <text>/<tspan> elements, rendered by a real engine
// (browser or resvg) rather than satori's reimplementation.
//
// Fonts (all provided directly by Ibrahim, no substitutes):
//   - "Neue Haas Grotesk Display Pro 55 Roman" (as "Haas") -- English
//     headers, day/time labels and titles.
//   - "IBM Plex Sans Medium" (as "IBMPlex") -- English description/body
//     copy specifically, NOT the same font as headers/titles.
//   - "Nabi" -- Arabic headers, day/time labels and titles (cover
//     week-ordinal label, grid day headers, event titles).
//   - "Alyamama" -- Arabic description/body copy specifically.
//   - "Amiri" -- every numeral inside Arabic text, in both the header/
//     title font's context (Nabi) and the description font's context
//     (Alyamama) -- e.g. the day number in "الأربعاء ٢٣" or the digits in
//     a time like "٧ مساءً" are Amiri, the surrounding letters are not.
//   Corrected 2026-09-23 against the real Figma layer (file
//   mXK4Qerzr2XeGko8q3BhCG, nodes 375:143/375:170/375:179): an earlier
//   version of this file had confirmed only the header/title text block
//   against Figma (font "Nabi") and had generalized that to ALL Arabic
//   text, including descriptions and numerals -- checking the description
//   and numeral text blocks specifically showed that was wrong on both
//   counts (descriptions use Alyamama/IBMPlex, numerals use Amiri).
//   Amiri/IBMPlex ship in this repo as .woff (assets/fonts/, added for
//   the old satori pipeline) and were converted to .ttf for this module's
//   fonts/ dir via `fonttools ttLib -o out.ttf in.woff`, since resvg's
//   fontdb (used server-side, see lib/weekly-digest-render.mjs) doesn't
//   load WOFF, only TTF/OTF.
//
// Colors are a per-week 2-color theme (bg + fg) -- "usually its 2 colors
// the whole thing" (Ibrahim) -- passed in, not hardcoded. WK03's real
// theme (read off the provided SVGs) is bg #77FF90 / fg #4450D6 for the
// digital slides; the generic print reference uses #1500B3 on white, kept
// as print's default until told otherwise (flagged to Ibrahim).
//
// The calligraphy tagline ("هذا الأسبوع في مجلس العجب") is fixed copy, not
// per-week data, so instead of re-setting it as text (Nabi is an
// extremely ornate connected script -- a plain live-text rendering would
// not reproduce the designer's manual letter overlap) this module inlines
// the REAL outlined artwork extracted directly from Ibrahim's SVGs
// (calligraphy.svg for the 1080x1350 digital cover, calligraphy-print.svg
// for the 842x1191 print header) as `fill="currentColor"` path data, so
// it recolors with the week's theme via a wrapping `color`.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ot from "opentype.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- fixed art assets (extracted once from Ibrahim's real SVGs) --------

function innerOf(svgPath) {
  // svgPath must be a full, already-joined path (built with a literal at
  // the call site, e.g. path.join(__dirname, "x.svg")) rather than joined
  // in here -- Vercel's build-time file tracer (@vercel/nft) only reliably
  // detects readFileSync targets built from LITERAL path.join() calls; a
  // join with a variable one function-call away is invisible to it, so the
  // asset silently gets left out of the deployed function bundle and this
  // throws ENOENT the moment the module loads in production -- which took
  // down every request to this endpoint, including CORS preflight OPTIONS
  // (found 2026-09-21: this is exactly what "Load failed" / "Preflight
  // response ... 500" in the Studio turned out to be).
  const raw = readFileSync(svgPath, "utf8");
  const m = raw.match(/<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>/);
  const [, viewBox, inner] = m;
  const [, , w, h] = viewBox.split(/\s+/).map(Number);
  // Real Figma/Adobe exports can embed a Content Credentials (C2PA)
  // provenance manifest as <metadata><c2pa:manifest>...huge base64...</...>
  // right inside the SVG body. Browsers silently ignore the unknown
  // namespace so this never showed up visually, but it's pure dead weight
  // (bloats the file) and resvg (used for server-side rendering) actually
  // throws on the undeclared "c2pa" namespace prefix -- strip any
  // <metadata> block out of the extracted content so it can't do either.
  const cleaned = inner.replace(/<metadata>[\s\S]*?<\/metadata>/g, "");
  return { inner: cleaned, w, h };
}

const CALLIGRAPHY_COVER = innerOf(path.join(__dirname, "calligraphy.svg")); // 748.7 x 280.5
// (calligraphy-print.svg was a separate hand-extraction for the print
// header that turned out to be missing a path -- the ع loop in "الأسبوع"
// silently didn't render. Removed; the print header now reuses
// CALLIGRAPHY_COVER at a smaller scale instead of maintaining two
// independently-extracted copies of the same artwork that can drift.)

// Real star shape traced from the Figma export (a genuine 10-point star
// path, not a generated regular polygon), normalized to a single grid
// cell's local origin (~77.5 x 76 cell).
const STAR_D =
  "M 14.033 73.863 L 14.855 74.412 L 38.290 55.750 L 61.813 74.500 L 62.530 73.969 L 52.369 45.473 L 77.500 28.527 L 77.133 27.537 L 47.104 28.616 L 38.902 -0.500 H 37.835 L 29.546 28.616 L -0.133 27.537 L -0.500 28.616 L 24.194 45.384 L 14.033 73.863 Z";

// --- fonts ----------------------------------------------------------------

const FONT_FILES = {
  haas: path.join(__dirname, "fonts", "HaasGrotDisp-55Roman.otf"),
  nabi: path.join(__dirname, "fonts", "Nabi-Regular.ttf"),
  alyamama: path.join(__dirname, "fonts", "Alyamama-VariableFont_wght.ttf"),
  // Confirmed directly against the real Figma layer (2026-09-23, node
  // 375:179 in file mXK4Qerzr2XeGko8q3BhCG): every numeral inside Arabic
  // text -- day numbers in headers, times -- is set in "Amiri:Regular",
  // NOT Nabi (Nabi covers the surrounding Arabic letters only). And
  // Arabic BODY/description copy (node 375:170) is "Alyamama:Regular", not
  // Nabi either -- Nabi turns out to be for headers/titles specifically.
  // English description copy (node 375:143) is "IBM_Plex_Sans:Medium",
  // not Haas -- Haas is for English headers/titles/times only. Converted
  // from the .woff files already vendored at assets/fonts/ (added for the
  // old satori pipeline) via `fonttools ttLib -o out.ttf in.woff`, since
  // resvg's fontdb doesn't load WOFF.
  amiri: path.join(__dirname, "fonts", "amiri-regular.ttf"),
  ibmplex: path.join(__dirname, "fonts", "ibm-plex-sans-medium.ttf"),
};

// Real advance-width text measurement (via opentype.js reading the actual
// font files) so day-column titles/descriptions can be word-wrapped to fit
// their column -- SVG <text> never wraps on its own.
const OT_FONTS = {
  Haas: ot.parse(readFileSync(FONT_FILES.haas).buffer),
  Nabi: ot.parse(readFileSync(FONT_FILES.nabi).buffer),
  Alyamama: ot.parse(readFileSync(FONT_FILES.alyamama).buffer),
  Amiri: ot.parse(readFileSync(FONT_FILES.amiri).buffer),
  IBMPlex: ot.parse(readFileSync(FONT_FILES.ibmplex).buffer),
};

function measureWidth(text, fontFamily, size) {
  return OT_FONTS[fontFamily].getAdvanceWidth(text, size);
}

// Total rendered width of a genuinely-Arabic line, accounting for digit
// runs switching to Amiri (see splitDigitRuns/arabicRunElementsRTL below --
// this mirrors the same per-run font logic, just summed rather than laid
// out) -- used by printHeaderInner to size the gap before the English
// week-number block, since a plain measureWidth(text, font, size) would use
// the wrong (Nabi) advance widths for any digits in the string.
function measureArabicLineWidth(text, font, size) {
  return splitDigitRuns(text).reduce((sum, r) => sum + measureWidth(r.text, r.isDigit ? "Amiri" : font, size), 0);
}

// Every numeral (Western 0-9 or Arabic-Indic \u0660-\u0669) inside a
// genuinely-Arabic string renders in Amiri, not the surrounding Arabic
// font (Nabi for headers/titles, Alyamama for descriptions) -- confirmed
// against the real Figma layer (see FONT_FILES comment). splitDigitRuns
// breaks a string into alternating digit/non-digit runs so callers can
// measure and mark up each run with its own font.
const DIGIT_RE = /[0-9\u0660-\u0669]/;
function splitDigitRuns(text) {
  const runs = [];
  let cur = "";
  let curIsDigit = null;
  for (const ch of text) {
    const isDigit = DIGIT_RE.test(ch);
    if (curIsDigit === null || isDigit === curIsDigit) {
      cur += ch;
      curIsDigit = isDigit;
    } else {
      runs.push({ text: cur, isDigit: curIsDigit });
      cur = ch;
      curIsDigit = isDigit;
    }
  }
  if (cur) runs.push({ text: cur, isDigit: curIsDigit });
  return runs;
}

// Renders a genuinely-Arabic string's digit/non-digit runs as SEPARATE
// sibling <text> elements (never a <tspan> inside one <text>), right edge
// pinned at `rightEdge` and growing leftward -- one element per run from
// splitDigitRuns, each with its own explicit font-family/direction, digit
// runs in Amiri (direction="ltr", multi-digit numbers read left-to-right)
// and the rest in `font` (direction="rtl"). Runs are walked in logical
// (string) order, which for RTL text IS right-to-left visual order, so
// placing each run's right edge at the previous run's left edge produces
// the correct reading order with no bidi reordering needed from us.
//
// Why not a <tspan font-family="Amiri"> inside one <text>, which is what
// an earlier version of this function did: reproducibly BLANK render (the
// whole <text> vanishes, not just mispositioned) in this exact server-side
// setup -- resvg (@resvg/resvg-js 2.6.2) with all 5 of this module's fonts
// loaded together via font.fontFiles (Haas/Nabi/Alyamama/Amiri/IBMPlex, the
// real production set -- see lib/weekly-digest-render.mjs). Confirmed via
// isolated repro (2026-09-23): deterministic for this exact font set/
// count/order, not flaky -- a 4-font subset of the same fonts renders the
// identical tspan markup fine, all 5 together reproducibly drops it. Using
// separate <text> elements (no tspan at all) avoids whatever resvg
// font-matching path that combination triggers, and was verified stable
// across many repeated renders in the same and different processes.
function arabicRunElementsRTL(text, font, size, y, rightEdge, attrs = "") {
  let cursor = rightEdge;
  const els = [];
  for (const r of splitDigitRuns(text)) {
    const runFont = r.isDigit ? "Amiri" : font;
    const dir = r.isDigit ? "ltr" : "rtl";
    const w = measureWidth(r.text, runFont, size);
    const x = cursor - w;
    els.push(
      `<text x="${x}" y="${y}" font-size="${size}" font-family="${runFont}" direction="${dir}" text-anchor="start"${attrs}>${esc(r.text)}</text>`
    );
    cursor = x;
  }
  return els.join("\n");
}

// Same idea, for the one Arabic block that's LEFT-anchored instead of
// right-anchored (buildCoverSVG's subtitle, text-anchor="start" at a fixed
// left x that's deliberately not the block's right edge -- see that call
// site). Runs are walked in REVERSE logical order (the last-read run is
// visually leftmost in RTL text) with each run's left edge placed at the
// previous run's right edge.
function arabicRunElementsLTR(text, font, size, y, leftEdge, attrs = "") {
  let cursor = leftEdge;
  const els = [];
  const runs = splitDigitRuns(text).reverse();
  for (const r of runs) {
    const runFont = r.isDigit ? "Amiri" : font;
    const dir = r.isDigit ? "ltr" : "rtl";
    const w = measureWidth(r.text, runFont, size);
    els.push(
      `<text x="${cursor}" y="${y}" font-size="${size}" font-family="${runFont}" direction="${dir}" text-anchor="start"${attrs}>${esc(r.text)}</text>`
    );
    cursor += w;
  }
  return els.join("\n");
}

// Greedy word-wrap: splits on spaces (works for both EN and AR -- Arabic
// words are still space-separated in logical/string order; direction="rtl"
// on the <text> element handles the visual reordering).
function wrapWords(text, fontFamily, size, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w;
    if (cur && measureWidth(candidate, fontFamily, size) > maxWidth) {
      lines.push(cur);
      cur = w;
    } else {
      cur = candidate;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function b64(file) {
  return readFileSync(file).toString("base64");
}

// Self-contained @font-face block (base64-inlined) so any exported SVG
// still displays correctly with the right fonts outside the site.
export function fontFaceCSS() {
  return `
@font-face { font-family: "Haas"; src: url(data:font/otf;base64,${b64(FONT_FILES.haas)}) format("opentype"); }
@font-face { font-family: "Nabi"; src: url(data:font/ttf;base64,${b64(FONT_FILES.nabi)}) format("truetype"); }
@font-face { font-family: "Alyamama"; src: url(data:font/ttf;base64,${b64(FONT_FILES.alyamama)}) format("truetype"); }
@font-face { font-family: "Amiri"; src: url(data:font/ttf;base64,${b64(FONT_FILES.amiri)}) format("truetype"); }
@font-face { font-family: "IBMPlex"; src: url(data:font/ttf;base64,${b64(FONT_FILES.ibmplex)}) format("truetype"); }
`;
}

// --- date / week helpers ----------------------------------------------

const DWEN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DWAR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
// Levantine month names (confirmed from Ibrahim's real design: "أيلول" for
// September, not the MSA "سبتمبر") -- Palestinian usage throughout.
const MABBR_AR = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const ORDINAL_AR = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"];

function arDigits(n) {
  return String(n).replace(/[0-9]/g, (d) => ARABIC_DIGITS[+d]);
}

function ordinalSuffix(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

// The 52-star tracker does NOT follow the Gregorian calendar year -- it
// follows Wonder Cabinet's own programming season. Reverse-engineered from
// the real WK03 cover (Sep 14-19, 2026): the star there sits at column 1,
// row 3 of the grid, which is star-tracker week #7 -- meaning the season's
// "week 1" started Monday Aug 3, 2026 (6 weeks / 42 days earlier). Until
// Ibrahim confirms the actual season-start rule (e.g. "first Monday of
// August every year"), this date is the working assumption -- update
// SEASON_START each season, or pass an explicit seasonStart to override.
export const SEASON_START = "2026-08-03";

export function starWeekNumber(weekStartDate, seasonStart = SEASON_START) {
  const d = new Date(weekStartDate);
  const s = new Date(seasonStart);
  const diffDays = Math.floor(
    (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) -
      Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())) /
      86400000
  );
  return Math.floor(diffDays / 7) + 1;
}

// Week 1 of the MONTH = the Monday-Sunday week containing the 1st --
// what's actually shown as "Week No.X" everywhere.
export function weekOfMonth(weekStartDate) {
  const d = new Date(weekStartDate);
  const firstOfMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const firstDow = (firstOfMonth.getUTCDay() + 6) % 7;
  const week1Start = firstOfMonth.getTime() - firstDow * 86400000;
  const diffDays = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - week1Start) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}

function formatRangeEn(startIso, endIso) {
  const a = new Date(startIso);
  const b = endIso ? new Date(endIso) : a;
  return `${a.getDate()} - ${b.getDate()} ${MABBR[b.getMonth()]}`.toUpperCase();
}

// The digital cover's date line uses an en-dash ("14 – 19 SEP"), while the
// grid/print pages use a plain hyphen ("14 - 19 SEP") -- matches the real
// reference files exactly (a real, if inconsistent, distinction in the
// original design across artboards).
function formatRangeEnCover(startIso, endIso) {
  const a = new Date(startIso);
  const b = endIso ? new Date(endIso) : a;
  return `${a.getDate()} – ${b.getDate()} ${MABBR[b.getMonth()]}`.toUpperCase();
}

function formatRangeEnHeader(startIso, endIso) {
  const a = new Date(startIso);
  const b = endIso ? new Date(endIso) : a;
  if (a.getMonth() !== b.getMonth()) return formatRangeEn(startIso, endIso);
  return `${MABBR[a.getMonth()]} ${a.getDate()} – ${b.getDate()}`.toUpperCase();
}

function formatRangeAr(startIso, endIso) {
  const a = new Date(startIso);
  const b = endIso ? new Date(endIso) : a;
  return `${arDigits(a.getDate())} – ${arDigits(b.getDate())} ${MABBR_AR[b.getMonth()]}`;
}

// Native SVG bidi handles ordering correctly -- no arNum/bidiRow hacks
// needed (verified: mixed Arabic-Indic digit runs and word order both
// render correctly with plain direction="rtl" text).
function formatTime(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return m ? `${h12}:${String(m).padStart(2, "0")}${ampm}` : `${h12}${ampm}`;
}

function formatTimeAr(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "صباحاً" : "مساءً";
  const num = m ? `${arDigits(h12)}:${arDigits(String(m).padStart(2, "0"))}` : arDigits(h12);
  return `${num} ${ampm}`;
}

// Column-major, bottom-to-top fill: columns 0-3 hold 5 cells, columns
// 4-11 hold 4 cells (52 total) -- verified against the real star's
// position in Ibrahim's WK03 cover (col 1, row 3 from the top = star-tracker
// week #7, see starWeekNumber above).
export function starPosition(weekNum) {
  let remaining = Math.max(1, Math.min(52, weekNum));
  for (let col = 0; col < 12; col++) {
    const rows = col < 4 ? 5 : 4;
    if (remaining <= rows) {
      const rowFromBottom = remaining - 1;
      const row = rows === 5 ? 4 - rowFromBottom : 3 - rowFromBottom;
      return { col, row };
    }
    remaining -= rows;
  }
  return { col: 11, row: 0 };
}

// Groups events by day, sorted; days beyond the first 3 stack below the
// LAST column rather than adding a 4th column (matches the real WK03
// reference: Wed/Thu get their own columns, Fri+Sat share the 3rd).
function groupDays(events) {
  const map = new Map();
  for (const ev of events || []) {
    if (!map.has(ev.day)) map.set(ev.day, []);
    map.get(ev.day).push(ev);
  }
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([day, evs]) => ({ day, evs }));
}

// Digital slide (1080x1350, single "page"): max 3 columns -- a 4th+
// event-day does NOT get a new column, it stacks BELOW the existing
// content in the LAST column. Verified against the real WK03 EN/AR grids
// (Fri + Sat both land in column 3, Sat below Fri's content).
function groupByDay(events) {
  const days = groupDays(events);
  const cols = [[], [], []];
  days.forEach((d, i) => cols[Math.min(i, 2)].push(d));
  return cols.filter((c) => c.length);
}

// NOTE: print used to lay days out as a proper row-major 3-column grid
// that wrapped a 4th+ day to an entirely new row (see the old
// groupByDayGrid, removed 2026-09-23) -- verified against the real print
// reference (A3 PRINT.svg's 6-event sample, which happened to fill 2 full
// rows of 3 columns exactly, one day per column). That reference never
// covered a partially-full case: a real week with only 4 distinct days
// put the 4th day (Sunday) alone in a mostly-empty second row, at the
// SAME column position as the first row's 1st day (Wednesday) -- visually
// disconnected from Saturday just above it in row 1's 3rd column, not
// "under" it. Ibrahim flagged this from the real generated print PDF and
// asked for Sunday to sit directly under Saturday instead. Print now
// reuses groupByDay (below) -- the same column-major, overflow-stacks-in-
// the-last-column layout the digital grid already used -- so a 4th+ day
// stacks under the 3rd column's day rather than starting a new row.

function esc(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- shared bits -----------------------------------------------------

function starTrackerSVG(weekNum, theme, cell = 77) {
  const { col: starCol, row: starRow } = starPosition(weekNum);
  let out = "";
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 12; col++) {
      if (row === 4 && col >= 4) continue;
      const x = col * cell;
      const y = row * (cell - 1);
      out += `<rect x="${x}" y="${y}" width="${cell - 1.5}" height="${cell - 2.5}" fill="${theme.fg}" stroke="${theme.bg}"/>`;
      if (col === starCol && row === starRow) {
        out += `<g transform="translate(${x},${y})" fill="${theme.bg}"><path d="${STAR_D}"/></g>`;
      }
    }
  }
  return out;
}

// --- Digital cover (1080x1350) -----------------------------------------

export function buildCoverSVG(weekly, theme) {
  const W = 1080, H = 1350;
  const starWeekNum = starWeekNumber(weekly.weekStart);
  const weekNum = weekOfMonth(weekly.weekStart);
  const ordinal = ORDINAL_AR[weekNum - 1] || arDigits(weekNum);
  const margin = 77;

  // Calligraphy block: position/scale measured directly off the real
  // WK03 reference render (top-left at ~77,809 in this 1080x1350 canvas,
  // natural-ish size) so its bottom edge just touches the Arabic subtitle.
  const calScale = 798 / CALLIGRAPHY_COVER.w;
  const calX = margin, calY = 809;

  // Right-side tagline stack: 5 lines, right-aligned to the margin, with
  // ~58px line spacing, CABINET's baseline sitting at H-119 -- all measured
  // off the reference. "WEEK NO.X" / date-range is a SEPARATE right-aligned
  // block sitting to the left of it, sharing the WONDER/CABINET baselines.
  const tagline = ["THIS", "WEEK", "AT THE", "WONDER", "CABINET"];
  const lineSpacing = 58;
  const cabinetY = H - 119;
  const taglineSVG = tagline
    .map((t, i) => {
      const y = cabinetY - (tagline.length - 1 - i) * lineSpacing;
      return `<text x="${W - margin}" y="${y}" font-size="36" letter-spacing="1">${t}</text>`;
    })
    .join("\n  ");
  const infoX = W - margin - 256;
  const infoSVG = `<text x="${infoX}" y="${cabinetY - lineSpacing}" font-size="32">WEEK NO.${weekNum}</text>
  <text x="${infoX}" y="${cabinetY}" font-size="32">${esc(formatRangeEnCover(weekly.weekStart, weekly.weekEnd))}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>${fontFaceCSS()}
text { font-family: "Haas", sans-serif; }
.ar-title { font-family: "Nabi", sans-serif; }
</style>
<rect width="${W}" height="${H}" fill="${theme.bg}"/>
<g transform="translate(${margin},${margin})" color="${theme.fg}">${starTrackerSVG(starWeekNum, theme)}</g>
<g transform="translate(${calX},${calY}) scale(${calScale})" color="${theme.fg}">${CALLIGRAPHY_COVER.inner}</g>
<g fill="${theme.fg}">
  ${arabicRunElementsLTR(`الأسبوع ${ordinal}`, "Nabi", 40, H - margin - 82, margin)}
  ${arabicRunElementsLTR(formatRangeAr(weekly.weekStart, weekly.weekEnd), "Nabi", 40, H - margin - 28, margin)}
</g>
<g fill="${theme.fg}" text-anchor="end" font-weight="700">
  ${taglineSVG}
  ${infoSVG}
</g>
</svg>`;
}

// --- Digital grid (EN / AR), 1080x1350 ----------------------------------

// Real event data is patchy -- an event with no Arabic title/description
// yet falls back to its English text (see lib/weekly-digest-render.mjs's
// adapter). That fallback text needs to actually measure/wrap/render using
// a Latin font (Haas), not the column's nominal Arabic body font (Nabi),
// regardless of which slide it's on -- confirmed necessary by testing
// against real production data, most of which has no Arabic title yet.
// This picks the right font per PIECE OF TEXT, not per column.
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F]/;
function scriptFont(text, columnFont, fallbackFont = "Haas") {
  return ARABIC_RE.test(text) ? columnFont : fallbackFont;
}

function dayColumn(day, evs, ar, colFontScale, fg, maxWidth) {
  const d = new Date(day);
  const dayNum = d.getDate();
  const headerMain = ar ? `${DWAR[d.getDay()]} ${arDigits(dayNum)}` : `${DWEN[d.getDay()]} ${dayNum}`;
  const headerSup = ar ? "" : ordinalSuffix(dayNum);
  const fontFam = ar ? "Nabi" : "Haas";
  let y = 0;
  const lines = [];
  const push = (text, size, weight, opacity, dy, sup, font) => {
    y += dy;
    lines.push({ text, size, weight, opacity, y, sup, font: font || fontFam });
  };
  push(headerMain, Math.round(52 * colFontScale), 700, 1, 0, headerSup);
  evs.forEach((ev, i) => {
    const tl = ar ? arTimeRange(ev) : enTimeRange(ev);
    if (i > 0) y += Math.round(20 * colFontScale);
    if (tl) push(tl, Math.round(28 * colFontScale), 700, 1, Math.round(46 * colFontScale));

    const titleFontSize = Math.round(32 * colFontScale);
    const titleText = ar ? ev.title.ar : ev.title.en;
    const titleFont = scriptFont(titleText, fontFam);
    wrapWords(titleText, titleFont, titleFontSize, maxWidth).forEach((line, li) =>
      push(line, titleFontSize, 400, 1, li === 0 ? Math.round(44 * colFontScale) : Math.round(38 * colFontScale), undefined, titleFont)
    );

    const desc = ar ? ev.desc?.ar : ev.desc?.en;
    if (desc) {
      const descFontSize = Math.round(20 * colFontScale);
      // Description copy uses its own font, not the header/title font:
      // confirmed against the real Figma layer (node 375:170) that Arabic
      // body text is set in Alyamama, and (node 375:143) English body text
      // in IBM Plex Sans Medium -- Nabi/Haas are for headers and titles
      // only. An earlier version of this file used the header/title font
      // (fontFam) for descriptions too, based on an incomplete design read
      // that only checked the header text block.
      const descFont = scriptFont(desc, "Alyamama", "IBMPlex");
      let firstDescLine = true;
      desc
        .split("\n")
        .filter(Boolean)
        .forEach((para, pi) => {
          wrapWords(para, descFont, descFontSize, maxWidth).forEach((line, li) => {
            // First line of the whole description: bigger gap from the
            // title. First line of a later paragraph (e.g. the "Tickets on
            // tzkrti." line): a small paragraph-break gap. Any wrapped
            // continuation line within a paragraph: tight line-height.
            const dy = firstDescLine
              ? Math.round(38 * colFontScale)
              : li === 0
              ? Math.round(34 * colFontScale)
              : Math.round(26 * colFontScale);
            push(line, descFontSize, 400, 0.9, dy, undefined, descFont);
            firstDescLine = false;
          });
        });
    }
  });
  // NOTE on text-anchor + direction="rtl": empirically (verified in both
  // Chromium and resvg), text-anchor="start" anchors the RIGHT edge of RTL
  // text at x (text extends leftward) -- i.e. "start" is what you want for
  // right-aligned RTL content, not "end" (which does the opposite: anchors
  // the LEFT edge, extending rightward off the page here).
  //
  // That rule was verified against genuine Arabic content, but real event
  // data is patchy -- an event with no Arabic title/description yet falls
  // back to its English text (see lib/weekly-digest-render.mjs's adapter),
  // which can land plain Latin text inside an Arabic (ar=true) column.
  // Rendering that Latin run with direction="rtl" doesn't reverse it, but
  // it DOES break the anchor math above -- confirmed by testing against
  // real, messy production data (most real events have no Arabic title
  // yet): the fallback English title rendered off the right edge of the
  // canvas entirely. So direction/anchor are now picked per LINE from
  // that line's own actual script, not from the column's language --
  // each ar/en column has one edge that's always anchored (the right edge
  // for ar columns, the left edge for en columns; see anchorX in
  // buildGridSVG/renderPrintGrid), and the anchor value that pins a given
  // line to THAT edge depends on whether the line's own text is RTL or LTR.
  const textEls = lines
    .map((l) => {
      const supTspan = l.sup
        ? `<tspan font-size="${Math.round(l.size * 0.55)}" dy="-${Math.round(l.size * 0.35)}">${esc(l.sup)}</tspan>`
        : "";
      const lineIsArabic = ARABIC_RE.test(l.text);
      const dir = lineIsArabic ? "rtl" : "ltr";
      const anchor = ar && !lineIsArabic ? "end" : "start";
      // A genuinely-Arabic line in an AR column must right-align at the
      // column's right edge (local x=0 -- see anchorX in buildGridSVG /
      // renderPrintGrid). text-anchor="start" does NOT do this in resvg
      // despite direction="rtl": confirmed by direct testing, it behaves
      // as a plain left anchor and extends the text RIGHTWARD from x
      // regardless of direction -- which pushed real day-header text
      // (e.g. "الأربعاء ٢٣") off the right edge of its column into the
      // next one (found 2026-09-21, from the real generated print PDF).
      // So an Arabic line's x is computed from its own measured width
      // instead of trusting the anchor to place it -- same fix applied to
      // the digital grid header and the print header block.
      // Numerals inside a genuinely-Arabic line (day numbers, times) render
      // in Amiri, not the line's own font -- see arabicRunElementsRTL and
      // the FONT_FILES comment for why it's separate <text> elements per
      // run rather than a <tspan> inside one. Only applies to lineIsArabic
      // text: an English fallback line (e.g. no Arabic title yet) keeps
      // its digits in Haas, matching the real design (Figma's "WED 9th"
      // keeps the "9" in Helvetica Neue, not Amiri).
      if (ar && lineIsArabic) {
        return arabicRunElementsRTL(l.text, l.font, l.size, l.y, 0, ` opacity="${l.opacity}" font-weight="${l.weight}"`);
      }
      const x = 0;
      return `<text x="${x}" y="${l.y}" font-size="${l.size}" font-weight="${l.weight}" opacity="${l.opacity}" font-family="${l.font}" direction="${dir}" text-anchor="${anchor}">${esc(l.text)}${supTspan}</text>`;
    })
    .join("\n");
  // Return the block height too (not just its markup) -- content wraps to a
  // variable number of lines, so stacked day-blocks in an overflow column
  // must space themselves by actual height, not a fixed guess.
  return { svg: `<g fill="${fg}">${textEls}</g>`, height: y };
}

function enTimeRange(ev) {
  if (!ev.start) return "";
  if (!ev.end) return formatTime(ev.start);
  return `${formatTime(ev.start)} - ${formatTime(ev.end)}`;
}
function arTimeRange(ev) {
  if (!ev.start) return "";
  if (!ev.end) return formatTimeAr(ev.start);
  return `${formatTimeAr(ev.start)} - ${formatTimeAr(ev.end)}`;
}

export function buildGridSVG(weekly, dir, theme, opts = {}) {
  const { background = theme.bg, hideHeader = false } = opts;
  const ar = dir === "rtl";
  const W = 1080, H = 1350;
  const margin = 77;
  const weekNum = weekOfMonth(weekly.weekStart);
  const ordinal = ORDINAL_AR[weekNum - 1] || arDigits(weekNum);
  const cols = groupByDay(weekly.events);
  const colFontScale = cols.length <= 3 ? 1 : 0.85;

  // Same right-alignment fix as dayColumn's textEls (see its comment):
  // text-anchor="start" + direction="rtl" doesn't right-anchor in resvg,
  // so the AR header's two lines are measured and positioned explicitly
  // to end flush at the right margin instead.
  const arHeaderLine1 = `الأسبوع ${ordinal}`;
  const arHeaderLine2 = formatRangeAr(weekly.weekStart, weekly.weekEnd);
  const headerSVG = hideHeader
    ? ""
    : ar
    ? `<g fill="${theme.fg}">
        ${arabicRunElementsRTL(arHeaderLine1, "Nabi", 53, margin + 50, W - margin, ' font-weight="700"')}
        ${arabicRunElementsRTL(arHeaderLine2, "Nabi", 36, margin + 95, W - margin)}
      </g>`
    : `<g text-anchor="start" fill="${theme.fg}" font-family="Haas">
        <text x="${margin}" y="${margin + 50}" font-size="53" font-weight="700">WEEK NO.${weekNum}</text>
        <text x="${margin}" y="${margin + 95}" font-size="36" font-weight="700">${esc(formatRangeEn(weekly.weekStart, weekly.weekEnd))}</text>
      </g>`;

  const colGap = 40;
  const colW = (W - margin * 2 - colGap * 2) / 3;
  const columnsTop = margin + (hideHeader ? 20 : 175);
  let colsSVG = "";
  cols.forEach((col, i) => {
    const cx = ar ? W - margin - colW * (i + 1) - colGap * i : margin + colW * i + colGap * i;
    const anchorX = ar ? cx + colW : cx;
    let voffset = 0;
    col.forEach(({ day, evs }) => {
      const block = dayColumn(day, evs, ar, colFontScale, theme.fg, colW);
      colsSVG += `<g transform="translate(${anchorX},${columnsTop + voffset})">${block.svg}</g>`;
      // Gap before the next stacked day-block in an overflow column (4th+
      // event-day lands in column 3 below the 3rd day's content -- see
      // groupByDay above). Bumped from 70 to 150 2026-09-23: Ibrahim flagged
      // the real generated AR grid, where a day's description text ran
      // right into the next day's header with barely any breathing room --
      // 70px reads as just another line-gap within a block, not a break
      // between two different days.
      voffset += block.height + Math.round(150 * colFontScale);
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>${fontFaceCSS()}</style>
<rect width="${W}" height="${H}" fill="${background}"/>
${headerSVG}
${colsSVG}
</svg>`;
}

// --- Print header (from the real A3 PRINT.svg header, 842x400) ---------

function printHeaderInner(weekly, theme, margin = 52) {
  const weekNum = weekOfMonth(weekly.weekStart);
  const ordinal = ORDINAL_AR[weekNum - 1] || arDigits(weekNum);
  // Uses the cover's calligraphy artwork (CALLIGRAPHY_COVER), not the
  // print-specific extraction (CALLIGRAPHY_PRINT) -- the print-specific one
  // is missing a path (the ع loop in "الأسبوع"), dropped during the earlier
  // hand-extraction from Ibrahim's print SVG. The cover version is verified
  // complete (19/19 paths) and is the same real tagline artwork, so it's
  // reused here at a smaller scale rather than shipping a broken glyph.
  const calScale = 180 / CALLIGRAPHY_COVER.h;

  const printArLine1 = `الأسبوع ${ordinal}`;
  const printArLine2 = formatRangeAr(weekly.weekStart, weekly.weekEnd);
  const printArSize = 34;
  const printArSize2 = 30;
  // Left-aligned at the grid's own margin, matching WED/THU/SAT's left
  // edge just below (see buildPrintPageSVG/buildPrintCombinedSVG's
  // `margin`, passed in here) -- flagged by Ibrahim 2026-09-23: this block
  // used to sit at a fixed x=330 (AR right edge) / x=347 (EN start),
  // leaving ~300px of unused space between the grid's left margin and the
  // week label, so the header read as floating in the middle of the page
  // instead of lining up with the content below it. Uses
  // arabicRunElementsLTR (left-anchored, growing rightward -- the same
  // helper buildCoverSVG's subtitle uses) instead of the RTL/right-anchored
  // variant used everywhere else in this file, since this block's anchor
  // edge is now its LEFT edge, not its right.
  //
  // The English block's x is computed from the wider of the two Arabic
  // lines' real measured width (digit-run-aware, via measureArabicLineWidth
  // below) rather than a fixed offset, since the Arabic ordinal word's
  // width varies week to week ("الأسبوع الرابع" vs "الأسبوع الخامس" etc.)
  // -- a fixed gap would either collide with a long ordinal or leave an
  // inconsistent gap after a short one.
  const arBlockWidth = Math.max(
    measureArabicLineWidth(printArLine1, "Nabi", printArSize),
    measureArabicLineWidth(printArLine2, "Nabi", printArSize2)
  );
  const enX = margin + arBlockWidth + 20;

  // Tagline font-size matched to the week-number/date block (32, was 24)
  // per Ibrahim's ask 2026-09-23 -- line spacing scaled up by the same
  // ratio (40, was 30) so the now-larger lines don't crowd each other;
  // the block's total height still comfortably fits inside this header's
  // fixed 400pt height above where the grid starts.
  const taglineSize = 32;
  const taglineSpacing = 40;
  const taglineTop = 220;
  const tagline = ["THIS", "WEEK", "AT THE", "WONDER", "CABINET"];
  const taglineSVG = tagline
    .map((t, i) => `<text x="812" y="${taglineTop + i * taglineSpacing}">${t}</text>`)
    .join("\n  ");

  return `<g transform="translate(30,25) scale(${calScale})" color="${theme.fg}">${CALLIGRAPHY_COVER.inner}</g>
<g fill="${theme.fg}">
  ${arabicRunElementsLTR(printArLine1, "Nabi", printArSize, 280, margin, ' font-weight="700"')}
  ${arabicRunElementsLTR(printArLine2, "Nabi", printArSize2, 320, margin)}
</g>
<g fill="${theme.fg}" text-anchor="start" font-family="Haas" font-weight="700" text-transform="uppercase">
  <text x="${enX}" y="295" font-size="32">WEEK NO.${weekNum}</text>
  <text x="${enX}" y="330" font-size="32">${esc(formatRangeEnHeader(weekly.weekStart, weekly.weekEnd))}</text>
</g>
<g fill="${theme.fg}" text-anchor="end" font-family="Haas" font-weight="700" font-size="${taglineSize}">
  ${taglineSVG}
</g>`;
}

export function buildPrintHeaderSVG(weekly, theme) {
  const W = 842, H = 400;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>${fontFaceCSS()}</style>
${printHeaderInner(weekly, theme)}
</svg>`;
}

// --- Print page (A3, 842x1191) -- EN gets the header, AR doesn't --------
// (kept for standalone single-language print use; the shipped deliverable
// now uses buildPrintCombinedSVG below, which stacks EN above AR on one
// sheet -- both share this same row-major grid renderer.)

function renderPrintGrid(weekly, ar, theme, { W, margin, colGap, colFontScale, startY, mirror = ar }) {
  // `mirror` controls physical column order/position (RTL-style, first day
  // rightmost) independently of `ar` (which controls the day content's own
  // language/text-alignment). They default to matching -- a standalone AR
  // page mirrors its columns per convention -- but the combined print sheet
  // passes mirror:false for its AR section so its columns land in the exact
  // same physical slots as the English section above it, i.e. one shared
  // grid running top (EN) to bottom (AR) instead of two independently
  // laid-out blocks.
  const cols = groupByDay(weekly.events);
  const colW = (W - margin * 2 - colGap * 2) / 3;
  let svg = "";
  let bottom = startY;
  cols.forEach((col, ci) => {
    const cx = mirror ? W - margin - colW * (ci + 1) - colGap * ci : margin + colW * ci + colGap * ci;
    const anchorX = ar ? cx + colW : cx;
    let voffset = 0;
    col.forEach(({ day, evs }) => {
      const block = dayColumn(day, evs, ar, colFontScale, theme.fg, colW);
      svg += `<g transform="translate(${anchorX},${startY + voffset})">${block.svg}</g>`;
      // Gap before the next stacked day-block in an overflow column (4th+
      // event-day, see groupByDay above). Deliberately more generous than
      // the digital grid's own stacked-day gap (150, see buildGridSVG):
      // print's colFontScale (0.62) shrinks everything, including that
      // gap, and Ibrahim specifically asked for more breathing room above
      // Sunday's header here -- 260 * 0.62 ~= 161px, vs. the ~93px a
      // straight reuse of 150 would have given at this scale.
      voffset += block.height + Math.round(260 * colFontScale);
    });
    bottom = Math.max(bottom, startY + voffset);
  });
  return { svg, bottom };
}

export function buildPrintPageSVG(weekly, dir, theme, opts = {}) {
  const ar = dir === "rtl";
  const showHeader = opts.showHeader ?? !ar;
  const W = 842, H = 1191;
  const margin = 52;
  const colGap = 30;
  const colFontScale = 0.62;

  const headerH = showHeader ? 400 : 0;
  const headerSVG = showHeader ? `<g>${printHeaderInner(weekly, theme, margin)}</g>` : "";

  const grid = renderPrintGrid(weekly, ar, theme, {
    W, margin, colGap, colFontScale, startY: headerH + margin + 20,
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>${fontFaceCSS()}</style>
<rect width="${W}" height="${H}" fill="white"/>
<g color="${theme.fg}">${headerSVG}</g>
${grid.svg}
</svg>`;
}

// --- Print page, combined (A3 width, dynamic height) --------------------
// One physical sheet: shared header, then the English grid, then the
// Arabic grid stacked directly underneath it (no repeated header for the
// AR section -- same "intentional" choice as before, just no longer split
// across two separate pages). Height grows with content; the print CSS
// scales the whole sheet down to fit one A3 page.

export function buildPrintCombinedSVG(weekly, theme) {
  const W = 842;
  const margin = 52;
  const colGap = 30;
  const colFontScale = 0.62;
  const headerH = 400;

  const headerSVG = `<g>${printHeaderInner(weekly, theme, margin)}</g>`;

  const en = renderPrintGrid(weekly, false, theme, {
    W, margin, colGap, colFontScale, startY: headerH + margin + 20,
  });

  const sectionGap = 50;
  // Mirror the AR section's columns per RTL convention (first day
  // rightmost), same as the standalone AR-only print page -- confirmed
  // wrong the other way round once Ibrahim saw it with real data: keeping
  // the AR columns in the EN section's left-to-right physical order (an
  // earlier guess, made before real content existed to check it against)
  // reads backwards for an Arabic reader regardless of whether it lines
  // up positionally with the EN grid above it. `mirror` defaults to `ar`
  // (true here), so no override is passed.
  const ar = renderPrintGrid(weekly, true, theme, {
    W, margin, colGap, colFontScale, startY: en.bottom + sectionGap,
  });

  const H = ar.bottom + margin;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>${fontFaceCSS()}</style>
<rect width="${W}" height="${H}" fill="white"/>
<g color="${theme.fg}">${headerSVG}</g>
${en.svg}
${ar.svg}
</svg>`;
}
