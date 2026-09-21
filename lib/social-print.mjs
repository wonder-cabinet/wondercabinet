// Renders a branded A3 print poster for an event as THREE vertically
// stacked panels on one portrait sheet, mirroring the layout of the WC
// weekly-digest reference frames (cover / EN grid / AR grid) that Ibrahim
// sent as the target look:
//   1. COVER  — event-color band, WC badge, big bilingual headline
//               (Arabic set in Amiri, echoing the calligraphic cover look)
//   2. EN GRID — a labeled info grid (Type / Date / Time / Location) plus
//                the English description, ruled like a print grid
//   3. AR GRID — the same grid mirrored right-to-left in Arabic (Amiri)
//
// The circle+star WC badge (assets/wc-logo.svg) is kept as-is per Ibrahim's
// answer ("No, keep the circle+star badge") — the reference images' pixel
// logo is NOT used here.
//
// Badge implementation note (carried over from the first version): the
// circle + two star paths + rule render fine as a nested data-URI SVG
// image, but <text> inside a nested SVG doesn't get font-shaped by resvg's
// raster pass on the sub-document — so the "W"/"C" letters are separate
// text nodes in the main tree, absolutely positioned over the circle.
//
// @vercel/og is imported lazily (inside the render functions) so this
// module's pure parts (buildTree, font loading, colors) can be imported and
// exercised with plain `satori` in a local/test environment where
// @vercel/og's Node build won't run outside a bundler.
import { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Amiri (Google Fonts, via @fontsource) — Arabic subset only, regular +
// bold. Loaded once per cold start; passed to satori/@vercel/og as font data.
const AMIRI_REGULAR = readFileSync(path.join(__dirname, "..", "assets", "fonts", "amiri-regular.woff"));
const AMIRI_BOLD = readFileSync(path.join(__dirname, "..", "assets", "fonts", "amiri-bold.woff"));
export const AMIRI_FONTS = [
  { name: "Amiri", data: AMIRI_REGULAR, weight: 400, style: "normal" },
  { name: "Amiri", data: AMIRI_BOLD, weight: 700, style: "normal" },
];

const TYPE_COLORS = {
  Performance: { bg: "#cc6698", ink: "#0a0a16" },
  Film: { bg: "#ffe600", ink: "#0a0a16" },
  Class: { bg: "#c8a0f0", ink: "#0a0a16" },
  Workshop: { bg: "#ff5a00", ink: "#f6f3ea" },
  "Open Studio": { bg: "#ff5a00", ink: "#f6f3ea" },
  Radio: { bg: "#00d26a", ink: "#0a0a16" },
  Reading: { bg: "#ffd6c2", ink: "#0a0a16" },
  Opening: { bg: "#0a0a16", ink: "#f6f3ea" },
  Bar: { bg: "#e8a33d", ink: "#0a0a16" },
  Exhibition: { bg: "#1d24ff", ink: "#f6f3ea" },
};
const FALLBACK = { bg: "#1d24ff", ink: "#f6f3ea" };
const PAPER = "#f6f3ea";
const INK = "#0a0a16";

const DWEN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DWAR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MABBR_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function formatTime(iso) {
  if (!iso) return "";
  const hasTime = +iso.slice(11, 13) || +iso.slice(14, 16);
  return hasTime ? new Date(iso).toTimeString().slice(0, 5) : "";
}

function formatDateEn(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${DWEN[d.getDay()]} ${d.getDate()} ${MABBR[d.getMonth()]}`;
}

function formatDateAr(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${DWAR[d.getDay()]} ${d.getDate()} ${MABBR_AR[d.getMonth()]}`;
}

// A3 portrait — three stacked panels read top to bottom, same as three
// separate cards stacked on one sheet, so portrait gives each one room.
const MM_W = 297;
const MM_H = 420;
function pxSize(dpi) {
  return {
    w: Math.round((MM_W / 25.4) * dpi),
    h: Math.round((MM_H / 25.4) * dpi),
  };
}

function badgeVectorSvg(ink) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <circle cx="100" cy="100" r="92" stroke="${ink}" stroke-width="4"/>
  <path d="M55 85 L70 55 L85 85 L78 85 L70 70 L62 85 Z" fill="${ink}"/>
  <path d="M115 85 L130 55 L145 85 L138 85 L130 70 L122 85 Z" fill="${ink}"/>
  <line x1="86" y1="130" x2="114" y2="130" stroke="${ink}" stroke-width="3"/>
</svg>`;
}

function badgeNode(ink, size) {
  const svgB64 = Buffer.from(badgeVectorSvg(ink)).toString("base64");
  const letterStyle = (topPct) => ({
    position: "absolute",
    top: `${topPct}%`,
    left: 0,
    width: "100%",
    display: "flex",
    justifyContent: "center",
    fontSize: Math.round(size * 0.12),
    fontWeight: 700,
    letterSpacing: 1,
    color: ink,
    fontFamily: "sans-serif",
  });
  return {
    type: "div",
    props: {
      style: { position: "relative", width: size, height: size, display: "flex", flexShrink: 0 },
      children: [
        { type: "img", props: { src: `data:image/svg+xml;base64,${svgB64}`, width: size, height: size } },
        { type: "div", props: { style: letterStyle(46), children: "W" } },
        { type: "div", props: { style: letterStyle(70), children: "C" } },
      ],
    },
  };
}

// Longer titles need a smaller font to keep from overflowing the panel.
function headlineFontSize(text, base) {
  const len = (text || "").length;
  if (len > 60) return Math.round(base * 0.5);
  if (len > 35) return Math.round(base * 0.68);
  return base;
}

function rule(color, thickness = 2) {
  return { type: "div", props: { style: { width: "100%", height: thickness, background: color, flexShrink: 0 } } };
}

function vrule(color, thickness = 2) {
  return { type: "div", props: { style: { width: thickness, alignSelf: "stretch", background: color, flexShrink: 0 } } };
}

// One "label over value" cell used in the info grid row.
function cell({ label, value, dir, labelSize, valueSize }) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: "22px 26px",
        gap: 10,
        alignItems: dir === "rtl" ? "flex-end" : "flex-start",
        textAlign: dir === "rtl" ? "right" : "left",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              fontSize: labelSize,
              fontWeight: 700,
              textTransform: dir === "rtl" ? "none" : "uppercase",
              letterSpacing: dir === "rtl" ? 0 : 1.5,
              opacity: 0.6,
              fontFamily: dir === "rtl" ? "Amiri" : "sans-serif",
            },
            children: label,
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              fontSize: valueSize,
              fontWeight: 700,
              lineHeight: 1.15,
              fontFamily: dir === "rtl" ? "Amiri" : "sans-serif",
            },
            children: value || "—",
          },
        },
      ],
    },
  };
}

// A grid panel: header strip (kicker), a 4-column ruled info row, then a
// ruled description block — the "3-column event grid" from the reference
// images, adapted to one event's fields instead of a week of events.
function gridPanel({ dir, w, h, kicker, columns, description, fontFamily }) {
  const cellW = w; // divided evenly by flex:1 children
  const labelSize = Math.round(w * 0.014);
  const valueSize = Math.round(w * 0.024);
  const kickerSize = Math.round(w * 0.017);
  const descSize = Math.round(w * 0.026);

  const cells = columns.map((c) => cell({ ...c, dir, labelSize, valueSize }));
  const withDividers = [];
  cells.forEach((c, i) => {
    if (i > 0) withDividers.push(vrule(`${INK}22`, 2));
    withDividers.push(c);
  });

  return {
    type: "div",
    props: {
      style: {
        width: `${w}px`,
        height: `${h}px`,
        display: "flex",
        flexDirection: "column",
        background: PAPER,
        color: INK,
        fontFamily: fontFamily,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              padding: "28px 40px",
              fontSize: kickerSize,
              fontWeight: 700,
              textTransform: dir === "rtl" ? "none" : "uppercase",
              letterSpacing: dir === "rtl" ? 0 : 2,
              flexDirection: dir === "rtl" ? "row-reverse" : "row",
            },
            children: [
              { type: "span", props: { children: kicker } },
              { type: "span", props: { style: { opacity: 0.6 }, children: "wondercabinet.space" } },
            ],
          },
        },
        rule(INK, 3),
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: dir === "rtl" ? "row-reverse" : "row", width: `${cellW}px` },
            children: withDividers,
          },
        },
        rule(INK, 3),
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flex: 1,
              padding: "0 40px",
              alignItems: "center",
              justifyContent: dir === "rtl" ? "flex-end" : "flex-start",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: descSize,
                    lineHeight: 1.5,
                    textAlign: dir === "rtl" ? "right" : "left",
                    // Clamp to 4 lines so a long description never overflows the panel.
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 4,
                    overflow: "hidden",
                  },
                  children: description || "",
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export function buildTree(doc, dpi = 150) {
  const colors = TYPE_COLORS[doc.eventType] || FALLBACK;
  const { w, h } = pxSize(dpi);

  const titleEn = doc.title?.en || "(untitled)";
  const titleAr = doc.title?.ar || "";
  const subtitleEn = doc.subtitle?.en || "";
  const badgeSize = Math.round(w * 0.13);

  const coverH = Math.round(h * 0.34);
  const gridH = Math.round((h - coverH) / 2);

  const locationName = doc.location?.name || "";
  const descEn = doc.shortDescription?.en || doc.body?.en || "";
  const descAr = doc.shortDescription?.ar || doc.body?.ar || "";

  // --- Cover panel ---
  const cover = {
    type: "div",
    props: {
      style: {
        width: `${w}px`,
        height: `${coverH}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `${Math.round(w * 0.06)}px`,
        background: colors.bg,
        color: colors.ink,
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", justifyContent: "space-between" },
            children: [
              badgeNode(colors.ink, badgeSize),
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    fontFamily: "sans-serif",
                    fontSize: Math.round(w * 0.02),
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    opacity: 0.85,
                    textAlign: "right",
                  },
                  children: [
                    { type: "span", props: { children: (doc.eventType || "").toUpperCase() } },
                    { type: "span", props: { children: `${formatDateEn(doc.startDateTime)} · ${formatTime(doc.startDateTime)}` } },
                  ],
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 18 },
            children: [
              titleAr
                ? {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        fontFamily: "Amiri",
                        fontWeight: 700,
                        fontSize: headlineFontSize(titleAr, Math.round(w * 0.1)),
                        lineHeight: 1.25,
                        justifyContent: "flex-end",
                        textAlign: "right",
                      },
                      children: titleAr,
                    },
                  }
                : null,
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontFamily: "sans-serif",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    fontSize: headlineFontSize(titleEn, Math.round(w * 0.075)),
                    lineHeight: 1.05,
                  },
                  children: titleEn,
                },
              },
              subtitleEn
                ? {
                    type: "div",
                    props: {
                      style: { display: "flex", fontFamily: "sans-serif", fontSize: Math.round(w * 0.022), opacity: 0.85 },
                      children: subtitleEn,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
      ],
    },
  };

  const enGrid = gridPanel({
    dir: "ltr",
    w,
    h: gridH,
    kicker: "This event",
    fontFamily: "sans-serif",
    columns: [
      { label: "Type", value: doc.eventType || "" },
      { label: "Date", value: formatDateEn(doc.startDateTime) },
      { label: "Time", value: formatTime(doc.startDateTime) || "—" },
      { label: "Location", value: locationName },
    ],
    description: descEn,
  });

  const arGrid = gridPanel({
    dir: "rtl",
    w,
    h: h - coverH - gridH,
    kicker: "هذا الحدث",
    fontFamily: "Amiri",
    columns: [
      { label: "النوع", value: doc.eventType || "" },
      { label: "التاريخ", value: formatDateAr(doc.startDateTime) },
      { label: "الوقت", value: formatTime(doc.startDateTime) || "—" },
      { label: "المكان", value: locationName },
    ],
    description: descAr,
  });

  return {
    tree: {
      type: "div",
      props: {
        style: { width: `${w}px`, height: `${h}px`, display: "flex", flexDirection: "column" },
        children: [cover, rule(INK, 4), enGrid, rule(INK, 4), arGrid],
      },
    },
    w,
    h,
  };
}

// dpi: 150 keeps render time/memory comfortable in a Vercel serverless
// function and is a normal working resolution for poster-scale print
// (viewed at a distance, not held close) — bump to 300 for print-shop
// quality if a given deploy's function timeout/memory allows it.
export async function renderPrintPosterPng(doc, dpi = 150) {
  const { ImageResponse } = await import("@vercel/og");
  const { tree, w, h } = buildTree(doc, dpi);
  const res = new ImageResponse(tree, { width: w, height: h, fonts: AMIRI_FONTS });
  return Buffer.from(await res.arrayBuffer());
}

export async function renderPrintPosterPdf(doc, dpi = 150) {
  const pngBuffer = await renderPrintPosterPng(doc, dpi);
  const pdf = await PDFDocument.create();
  const pageW = (MM_W / 25.4) * 72; // points
  const pageH = (MM_H / 25.4) * 72;
  const page = pdf.addPage([pageW, pageH]);
  const png = await pdf.embedPng(pngBuffer);
  page.drawImage(png, { x: 0, y: 0, width: pageW, height: pageH });
  return Buffer.from(await pdf.save());
}
