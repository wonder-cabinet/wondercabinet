// Renders the "weekly digest" — three 1080x1350 panels (cover / EN grid /
// AR grid) for a `weeklyIssue` Sanity document, matching the actual Figma
// reference ("Weekly -Sep-WK02-cover/en/ar", file WC-DESIGN, page "Digital")
// pixel-for-pixel where the content is fixed, and adapted proportionally
// where the content is dynamic (a real week has a variable number of
// event-days, unlike the one fixed mockup week in Figma).
//
// Confirmed against Figma via get_design_context/get_metadata:
//   - Canvas: 1080x1350 per panel.
//   - Colors: cover text/grid #ee3523, EN/AR grid text #e92726, bg pure
//     yellow (#ffff00).
//   - Fonts: "Helvetica Neue" (headers/titles — not licensable, standard
//     sans-serif fallback used instead), "IBM Plex Sans Medium" (small
//     description copy — exact Google Fonts match, vendored below),
//     "Nabi"/"Alyamama" (Arabic display/body — proprietary, not available;
//     per Ibrahim's instruction, Amiri (Google Fonts) is used for ALL
//     Arabic text as the approved substitute).
//   - The "logo" on the cover is NOT a logo: it's a 52-week-of-year
//     tracker (12 columns; the first 4 columns hold 5 cells, the rest 4,
//     totalling 52) with a star marking the current week. It fills
//     column-by-column, bottom-to-top within each column (verified: the
//     reference's Week-2 example has its star in column 1, second cell
//     from the bottom). Week 1 = the Gregorian year's first 7 days.
//
// @vercel/og is imported lazily so this module's pure parts (builders,
// fonts, week-grid math) can be exercised with plain `satori` locally.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AMIRI_REGULAR = readFileSync(path.join(__dirname, "..", "assets", "fonts", "amiri-regular.woff"));
const AMIRI_BOLD = readFileSync(path.join(__dirname, "..", "assets", "fonts", "amiri-bold.woff"));
const PLEX_MEDIUM = readFileSync(path.join(__dirname, "..", "assets", "fonts", "ibm-plex-sans-medium.woff"));
export const WEEKLY_FONTS = [
  { name: "Amiri", data: AMIRI_REGULAR, weight: 400, style: "normal" },
  { name: "Amiri", data: AMIRI_BOLD, weight: 700, style: "normal" },
  { name: "IBM Plex Sans", data: PLEX_MEDIUM, weight: 500, style: "normal" },
];

const YELLOW = "#ffff00";
const RED = "#ee3523"; // cover text + week-grid squares
const RED_GRID_TEXT = "#e92726"; // EN/AR grid panel text (Figma uses a hair different red)
const W = 1080;
const H = 1350;

const DWEN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DWEN_FULL = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const MABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DWAR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MABBR_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

function toArabicDigits(n) {
  return String(n).replace(/[0-9]/g, (d) => ARABIC_DIGITS[+d]);
}

// Satori's bidi handling reverses the character order of a multi-digit
// Arabic-Indic run embedded in RTL text (verified: feeding the logical
// digits of "36" renders visually as "63"). Feeding the digits
// pre-reversed compensates, so this — not toArabicDigits — is what must be
// used for any standalone number placed inline in Amiri/RTL text. Only
// call this per individual number (never on a whole sentence/date-range
// string at once), since each number's digit run needs its own reversal.
function arNum(n) {
  return String(n).split("").reverse().map((d) => ARABIC_DIGITS[+d]).join("");
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

function formatTimeEn(iso) {
  if (!iso) return "";
  const hasTime = +iso.slice(11, 13) || +iso.slice(14, 16);
  if (!hasTime) return "";
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return m ? `${h12}:${String(m).padStart(2, "0")}${ampm}` : `${h12}${ampm}`;
}

// Week 1 = the Gregorian year's first 7 days (per Ibrahim's confirmed rule).
// Used ONLY for the 52-week star tracker's position on the digital cover --
// not for any displayed "Week No.X" label (see weekOfMonth below).
export function weekOfYear(date) {
  const d = new Date(date);
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const diffDays = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}

// "Week of month" -- what's actually shown as "Week No.X" everywhere (cover
// + EN/AR grid headers). Week 1 = the Monday-Sunday week containing the
// 1st of the month; counts forward from there. Verified against Ibrahim's
// correction: Mon Sep 7 2026 is week 2, because Sep 1 2026 is a Tuesday,
// so Mon Aug 31 - Sun Sep 6 is week 1 and Sep 7-13 is week 2.
export function weekOfMonth(weekStartDate) {
  const d = new Date(weekStartDate);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const firstDow = (firstOfMonth.getUTCDay() + 6) % 7; // Monday = 0 .. Sunday = 6
  const week1Start = firstOfMonth.getTime() - firstDow * 86400000;
  const diffDays = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - week1Start) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}

// Column-major, bottom-to-top fill: columns 0-3 hold 5 cells (rows 0..4,
// row 4 = bottom short row), columns 4-11 hold 4 cells (rows 0..3).
export function starPosition(weekNum) {
  let remaining = Math.max(1, Math.min(52, weekNum));
  for (let col = 0; col < 12; col++) {
    const rows = col < 4 ? 5 : 4;
    if (remaining <= rows) {
      const rowFromBottom = remaining - 1; // 0 = bottom-most cell in this column
      const row = rows === 5 ? 4 - rowFromBottom : 3 - rowFromBottom;
      return { col, row };
    }
    remaining -= rows;
  }
  return { col: 11, row: 0 };
}

function starPolygonPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + rad * Math.cos(angle)).toFixed(1)},${(cy + rad * Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(" ");
}

// The 52-week tracker (not a logo) — see module header note.
function weekGridSvg(weekNum) {
  const cell = 77;
  const cols = 12;
  const { col: starCol, row: starRow } = starPosition(weekNum);
  let shapes = "";
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < cols; col++) {
      if (row === 4 && col >= 4) continue; // bottom row only exists for cols 0-3
      const x = col * cell;
      const y = row * cell;
      shapes += `<rect x="${x}" y="${y}" width="${cell - 1.5}" height="${cell - 1.5}" fill="${RED}"/>`;
      if (col === starCol && row === starRow) {
        shapes += `<polygon points="${starPolygonPoints(x + cell / 2, y + cell / 2, cell * 0.42)}" fill="${YELLOW}"/>`;
      }
    }
  }
  const w = cols * cell;
  const h = 5 * cell;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${shapes}</svg>`, w, h };
}

function weekGridNode(weekNum, scale = 1) {
  const { svg, w, h } = weekGridSvg(weekNum);
  const b64 = Buffer.from(svg).toString("base64");
  return { type: "img", props: { src: `data:image/svg+xml;base64,${b64}`, width: w * scale, height: h * scale } };
}

// Renders a short sequence of Arabic-reading-order parts (first item =
// rightmost) via explicit flex layout rather than a concatenated string,
// so word order is deterministic and doesn't depend on the renderer's own
// bidi/text-shaping behavior. Used for "day name then number" and
// "time then AM/PM" per Ibrahim's correction.
function bidiRow(parts, style = {}) {
  return {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "row-reverse", alignItems: "baseline", ...style },
      children: parts.map((p) => ({ type: "span", props: { style: p.style || {}, children: p.text } })),
    },
  };
}

function arTimeParts(iso) {
  if (!iso) return null;
  const hasTime = +iso.slice(11, 13) || +iso.slice(14, 16);
  if (!hasTime) return null;
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "صباحاً" : "مساءاً";
  const num = m ? `${arNum(h12)}:${arNum(String(m).padStart(2, "0"))}` : arNum(h12);
  return { num, ampm };
}

// Reading-order parts (rightmost first) for a time or time range: the
// number(s) first, the AM/PM word last -- "the time then PM or AM" per
// Ibrahim.
function arTimeRowParts(startIso, endIso) {
  const start = arTimeParts(startIso);
  if (!start) return [];
  const end = endIso ? arTimeParts(endIso) : null;
  if (!end) return [{ text: start.num }, { text: start.ampm }];
  return [{ text: start.num }, { text: "-" }, { text: end.num }, { text: end.ampm }];
}

function formatRangeEn(startIso, endIso) {
  const a = new Date(startIso);
  const b = endIso ? new Date(endIso) : a;
  return `${a.getDate()} - ${b.getDate()} ${MABBR[b.getMonth()]}`.toUpperCase();
}

function formatRangeAr(startIso, endIso) {
  const a = new Date(startIso);
  const b = endIso ? new Date(endIso) : a;
  return `${arNum(a.getDate())} – ${arNum(b.getDate())} ${MABBR_AR[b.getMonth()]}`;
}

// --- Cover panel ---------------------------------------------------------

export function buildCoverTree(weekly) {
  const weekStart = weekly.weekStart || new Date().toISOString();
  const weekEnd = weekly.weekEnd || weekStart;
  const starWeekNum = weekOfYear(weekStart); // star tracker position only
  const weekNum = weekOfMonth(weekStart); // the displayed "Week No.X"
  const margin = 77;

  return {
    type: "div",
    props: {
      style: {
        width: `${W}px`,
        height: `${H}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: YELLOW,
        color: RED,
        padding: `${margin}px`,
        fontFamily: "sans-serif",
      },
      children: [
        weekGridNode(starWeekNum),
        {
          type: "div",
          props: {
            style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", gap: 6 },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", fontFamily: "Amiri", fontWeight: 700, fontSize: 78, lineHeight: 1.1, justifyContent: "flex-end", textAlign: "right" },
                        children: `الأسبوع رقم ${arNum(weekNum)}`,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", fontFamily: "Amiri", fontWeight: 400, fontSize: 40, justifyContent: "flex-end" },
                        children: formatRangeAr(weekStart, weekEnd),
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right", gap: 4 },
                  children: [
                    { type: "div", props: { style: { display: "flex", fontWeight: 700, fontSize: 34, textTransform: "uppercase", letterSpacing: 1 }, children: "This week at the" } },
                    { type: "div", props: { style: { display: "flex", fontWeight: 700, fontSize: 34, textTransform: "uppercase", letterSpacing: 1 }, children: "Wonder Cabinet" } },
                    { type: "div", props: { style: { display: "flex", fontWeight: 700, fontSize: 40, textTransform: "uppercase", marginTop: 14 }, children: `Week No.${weekNum}` } },
                    { type: "div", props: { style: { display: "flex", fontWeight: 700, fontSize: 40, textTransform: "uppercase" }, children: formatRangeEn(weekStart, weekEnd) } },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// --- Grid panels (EN / AR) -----------------------------------------------

// Groups `events` by calendar day (local date of startDateTime).
function groupByDay(events) {
  const map = new Map();
  for (const ev of events || []) {
    if (!ev?.startDateTime) continue;
    const key = ev.startDateTime.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(ev);
  }
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, evs]) => evs);
}

function dayColumnEn(dayEvents, colFontScale) {
  const first = dayEvents[0];
  const d = new Date(first.startDateTime);
  const dayNum = d.getDate();
  return {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", flex: 1, gap: Math.round(24 * colFontScale) },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "baseline", gap: 6, fontWeight: 700, fontSize: Math.round(52 * colFontScale), textTransform: "uppercase", lineHeight: 1 },
            children: [
              { type: "span", props: { children: `${DWEN[d.getDay()]} ${dayNum}` } },
              { type: "span", props: { style: { fontSize: Math.round(34 * colFontScale), textTransform: "lowercase" }, children: ordinalSuffix(dayNum) } },
            ],
          },
        },
        ...dayEvents.flatMap((ev, i) => {
          const timeParts = [formatTimeEn(ev.startDateTime), formatTimeEn(ev.endDateTime)].filter(Boolean);
          const timeLabel = timeParts.length === 2 ? timeParts.join(" - ") : timeParts[0] || "";
          return [
            {
              type: "div",
              props: {
                style: { display: "flex", flexDirection: "column", gap: Math.round(10 * colFontScale), marginTop: i > 0 ? Math.round(20 * colFontScale) : 0 },
                children: [
                  timeLabel
                    ? { type: "div", props: { style: { display: "flex", fontSize: Math.round(30 * colFontScale), fontWeight: 700, textTransform: "uppercase" }, children: timeLabel } }
                    : null,
                  { type: "div", props: { style: { display: "flex", fontSize: Math.round(34 * colFontScale), lineHeight: 1.2 }, children: ev.title?.en || "(untitled)" } },
                  ev.shortDescription?.en
                    ? { type: "div", props: { style: { display: "flex", fontFamily: "IBM Plex Sans", fontWeight: 500, fontSize: Math.round(21 * colFontScale), lineHeight: 1.35, opacity: 0.9 }, children: ev.shortDescription.en } }
                    : null,
                ].filter(Boolean),
              },
            },
          ];
        }),
      ],
    },
  };
}

function dayColumnAr(dayEvents, colFontScale) {
  const first = dayEvents[0];
  const d = new Date(first.startDateTime);
  return {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", flex: 1, gap: Math.round(24 * colFontScale), alignItems: "flex-end", textAlign: "right" },
      children: [
        bidiRow(
          [{ text: DWAR[d.getDay()] }, { text: arNum(d.getDate()) }],
          { gap: 14, fontWeight: 700, fontSize: Math.round(48 * colFontScale), lineHeight: 1, fontFamily: "Amiri" }
        ),
        ...dayEvents.flatMap((ev, i) => {
          const timeRowParts = arTimeRowParts(ev.startDateTime, ev.endDateTime);
          return [
            {
              type: "div",
              props: {
                style: { display: "flex", flexDirection: "column", gap: Math.round(10 * colFontScale), alignItems: "flex-end", marginTop: i > 0 ? Math.round(20 * colFontScale) : 0 },
                children: [
                  timeRowParts.length
                    ? bidiRow(timeRowParts, { gap: 10, fontSize: Math.round(26 * colFontScale), fontWeight: 700, fontFamily: "Amiri" })
                    : null,
                  { type: "div", props: { style: { display: "flex", fontSize: Math.round(32 * colFontScale), lineHeight: 1.3, fontFamily: "Amiri" }, children: ev.title?.ar || ev.title?.en || "(بدون عنوان)" } },
                  ev.shortDescription?.ar
                    ? { type: "div", props: { style: { display: "flex", fontFamily: "Amiri", fontSize: Math.round(20 * colFontScale), lineHeight: 1.5, opacity: 0.9 }, children: ev.shortDescription.ar } }
                    : null,
                ].filter(Boolean),
              },
            },
          ];
        }),
      ],
    },
  };
}

function secondaryRowEn(ev) {
  const timeLabel = formatTimeEn(ev.startDateTime);
  return {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 },
      children: [
        timeLabel ? { type: "div", props: { style: { display: "flex", fontSize: 40, fontWeight: 700, textTransform: "uppercase" }, children: timeLabel } } : null,
        { type: "div", props: { style: { display: "flex", fontSize: 34, lineHeight: 1.2 }, children: ev.title?.en || "" } },
        ev.shortDescription?.en
          ? { type: "div", props: { style: { display: "flex", fontFamily: "IBM Plex Sans", fontWeight: 500, fontSize: 21, opacity: 0.9, maxWidth: 480, lineHeight: 1.35 }, children: ev.shortDescription.en } }
          : null,
      ].filter(Boolean),
    },
  };
}

function secondaryRowAr(ev) {
  const timeRowParts = arTimeRowParts(ev.startDateTime);
  return {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, alignItems: "flex-end", textAlign: "right" },
      children: [
        timeRowParts.length ? bidiRow(timeRowParts, { gap: 10, fontSize: 36, fontWeight: 700, fontFamily: "Amiri" }) : null,
        { type: "div", props: { style: { display: "flex", fontSize: 32, lineHeight: 1.3, fontFamily: "Amiri" }, children: ev.title?.ar || ev.title?.en || "" } },
        ev.shortDescription?.ar
          ? { type: "div", props: { style: { display: "flex", fontFamily: "Amiri", fontSize: 20, opacity: 0.9, maxWidth: 480, lineHeight: 1.5 }, children: ev.shortDescription.ar } }
          : null,
      ].filter(Boolean),
    },
  };
}

export function buildGridTree(weekly, dir, opts = {}) {
  const { background = YELLOW } = opts;
  const weekStart = weekly.weekStart || new Date().toISOString();
  const weekEnd = weekly.weekEnd || weekStart;
  const weekNum = weekOfMonth(weekStart);
  const days = groupByDay(weekly.events);
  // Keep columns legible: shrink type a bit once there are more than 3-4 days.
  const colFontScale = days.length <= 3 ? 1 : days.length === 4 ? 0.85 : days.length === 5 ? 0.72 : 0.6;
  const isAr = dir === "rtl";
  const margin = 47;

  const header = {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", gap: 4, alignItems: isAr ? "flex-end" : "flex-start" },
      children: isAr
        ? [
            { type: "div", props: { style: { display: "flex", fontFamily: "Amiri", fontWeight: 700, fontSize: 56 }, children: `الأسبوع رقم ${arNum(weekNum)}` } },
            { type: "div", props: { style: { display: "flex", fontFamily: "Amiri", fontSize: 40 }, children: formatRangeAr(weekStart, weekEnd) } },
          ]
        : [
            { type: "div", props: { style: { display: "flex", fontWeight: 700, fontSize: 53, textTransform: "uppercase" }, children: `Week No.${weekNum}` } },
            { type: "div", props: { style: { display: "flex", fontWeight: 700, fontSize: 40, textTransform: "uppercase" }, children: formatRangeEn(weekStart, weekEnd) } },
          ],
    },
  };

  const columnsRow = {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: isAr ? "row-reverse" : "row", gap: 40, marginTop: 90 },
      children: days.length
        ? days.map((dayEvents) => (isAr ? dayColumnAr(dayEvents, colFontScale) : dayColumnEn(dayEvents, colFontScale)))
        : [{ type: "div", props: { style: { display: "flex", fontSize: 30, opacity: 0.6 }, children: isAr ? "لا أحداث هذا الأسبوع" : "No events scheduled" } }],
    },
  };

  const secondary = weekly.secondaryEvents?.length
    ? {
        type: "div",
        props: {
          style: { display: "flex", flexDirection: "column", marginTop: 70, alignItems: isAr ? "flex-end" : "flex-start" },
          children: weekly.secondaryEvents.map((ev) => (isAr ? secondaryRowAr(ev) : secondaryRowEn(ev))),
        },
      }
    : null;

  return {
    type: "div",
    props: {
      style: {
        width: `${W}px`,
        height: `${H}px`,
        display: "flex",
        flexDirection: "column",
        background,
        color: RED_GRID_TEXT,
        padding: `${margin}px`,
        fontFamily: "sans-serif",
        direction: isAr ? "rtl" : "ltr",
      },
      children: [header, columnsRow, secondary].filter(Boolean),
    },
  };
}

// dpi is irrelevant here — these are fixed 1080x1350 digital assets
// (Instagram-carousel sized), matching the Figma source exactly.
export async function renderWeeklyCoverPng(weekly) {
  const { ImageResponse } = await import("@vercel/og");
  const res = new ImageResponse(buildCoverTree(weekly), { width: W, height: H, fonts: WEEKLY_FONTS });
  return Buffer.from(await res.arrayBuffer());
}

export async function renderWeeklyEnPng(weekly, opts = {}) {
  const { ImageResponse } = await import("@vercel/og");
  const res = new ImageResponse(buildGridTree(weekly, "ltr", opts), { width: W, height: H, fonts: WEEKLY_FONTS });
  return Buffer.from(await res.arrayBuffer());
}

export async function renderWeeklyArPng(weekly, opts = {}) {
  const { ImageResponse } = await import("@vercel/og");
  const res = new ImageResponse(buildGridTree(weekly, "rtl", opts), { width: W, height: H, fonts: WEEKLY_FONTS });
  return Buffer.from(await res.arrayBuffer());
}

// A3 portrait (297x420mm). Print drops the star-tracker cover panel
// entirely (Ibrahim: "for the print version its without the header with
// the star moving" -- each grid panel keeps its own text header/date-range,
// just no star graphic) and has no background fill at all -- blank paper,
// only the rendered text/line colors ("without a background color for
// print, only the text color"). Just the EN + AR grid panels, stacked,
// each kept at its exact 4:5 design proportions (uniformly scaled to fit,
// never stretched/cropped) and centered.
export async function renderWeeklyDigestPdf(weekly) {
  const { PDFDocument } = await import("pdf-lib");
  const [enPng, arPng] = await Promise.all([
    renderWeeklyEnPng(weekly, { background: "transparent" }),
    renderWeeklyArPng(weekly, { background: "transparent" }),
  ]);

  const MM_W = 297;
  const MM_H = 420;
  const pageW = (MM_W / 25.4) * 72;
  const pageH = (MM_H / 25.4) * 72;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([pageW, pageH]);
  // No background rectangle -- the PDF page itself is blank/white paper.

  const panelAspect = H / W; // 1.25
  const maxPanelH = pageH / 2;
  let panelW = maxPanelH / panelAspect;
  if (panelW > pageW) panelW = pageW;
  const panelH = panelW * panelAspect;
  const x = (pageW - panelW) / 2;
  const totalH = panelH * 2;
  const topY = (pageH - totalH) / 2;

  const images = await Promise.all([enPng, arPng].map((buf) => pdf.embedPng(buf)));
  images.forEach((img, i) => {
    const y = pageH - topY - panelH * (i + 1);
    page.drawImage(img, { x, y, width: panelW, height: panelH });
  });

  return Buffer.from(await pdf.save());
}
