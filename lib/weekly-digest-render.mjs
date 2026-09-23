// Rendering + Sanity-data adapter for the v2 (real SVG/HTML) weekly digest,
// replacing lib/social-weekly.mjs's satori/@vercel-og pipeline. The pure
// layout/builder logic lives in ./weekly-digest/weekly-svg.mjs (ported
// as-is from the standalone HTML prototype Ibrahim reviewed and approved);
// this file is the glue that (a) turns a raw weeklyIssue Sanity document
// into the plain-data shape that module expects, and (b) rasterizes its
// SVG output server-side, since a Vercel serverless function has no
// browser to render SVG in.
//
// Server-side rendering uses @resvg/resvg-js (a native, fast SVG rasterizer)
// rather than a headless browser (heavier, and not what the rest of this
// repo's Vercel plan supports). resvg does NOT honor embedded @font-face
// data URIs -- it needs its own explicit font.fontFiles list -- so the
// fonts are loaded from disk here regardless of what's embedded in the SVG
// markup (that embedding stays in weekly-svg.mjs purely so a downloaded SVG
// is self-contained when opened elsewhere, e.g. in a browser).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { PDFDocument } from "pdf-lib";
import {
  buildCoverSVG,
  buildGridSVG,
  buildPrintCombinedSVG,
} from "./weekly-digest/weekly-svg.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(__dirname, "weekly-digest", "fonts");
const FONT_FILES = [
  path.join(FONT_DIR, "HaasGrotDisp-55Roman.otf"),
  path.join(FONT_DIR, "Nabi-Regular.ttf"),
  path.join(FONT_DIR, "Alyamama-VariableFont_wght.ttf"),
  // Amiri (Arabic numerals) and IBM Plex Sans Medium (English description
  // copy) -- see weekly-svg.mjs's top-of-file font comment for why these
  // two were added and why they're .ttf here (converted from the .woff
  // vendored at assets/fonts/) rather than resvg's fontdb loading the woff
  // directly, which it can't.
  path.join(FONT_DIR, "amiri-regular.ttf"),
  path.join(FONT_DIR, "ibm-plex-sans-medium.ttf"),
];

// WK03's real, Ibrahim-approved colors -- used whenever a weeklyIssue
// document hasn't set its own digestThemeBg/digestThemeFg yet (see the
// two new fields added to studio/schemas/weeklyIssue.ts alongside this).
export const DEFAULT_THEME = { bg: "#77FF90", fg: "#4450D6" };
// Print currently stays on this fixed blue-on-white regardless of the
// week's digital theme -- this was flagged as an open question for
// Ibrahim (should print instead follow the week's rotating theme too?)
// and hasn't been answered yet, so it's kept fixed rather than guessed.
export const PRINT_THEME = { bg: "#ffffff", fg: "#1500B3" };

// --- SVG -> PNG (resvg) ---------------------------------------------------

// The generated SVGs embed all 3 fonts as base64 @font-face data (for
// portability when downloaded/opened standalone) -- that's dead weight for
// resvg, which never reads it, so it's stripped before rasterizing to keep
// parsing fast. It's always the single <style> block these builders emit.
function stripFontStyle(svg) {
  return svg.replace(/<style>[\s\S]*?<\/style>/, "");
}

function svgToPng(svg, widthPx) {
  const resvg = new Resvg(stripFontStyle(svg), {
    fitTo: { mode: "width", value: Math.round(widthPx) },
    font: {
      loadSystemFonts: false,
      fontFiles: FONT_FILES,
      defaultFontFamily: "Haas",
    },
  });
  return resvg.render().asPng();
}

function svgDims(svg) {
  const m = svg.match(/width="([\d.]+)" height="([\d.]+)"/);
  if (!m) throw new Error("Could not read width/height from generated SVG");
  return { w: parseFloat(m[1]), h: parseFloat(m[2]) };
}

// --- Sanity weeklyIssue + expanded events -> weekly-svg.mjs input --------

// Real event data is patchy in practice: most events have only an English
// title, no Arabic title, and no/blank shortDescription (confirmed by
// checking live production events on 2026-09-21 -- 5 of 6 had no Arabic
// title at all, none had a filled-in Arabic description). Rather than
// leaving the Arabic slide/section blank or erroring out and blocking the
// weekly generation, this falls back to the English text for anything
// missing on the Arabic side, and reports how many events needed a
// fallback so the coordinator/Ibrahim can see it's worth backfilling
// Arabic copy on the event documents themselves -- this is a stopgap, not
// a translation, so it's surfaced rather than hidden.
function pick(locale, lang) {
  if (!locale) return "";
  return locale[lang] || locale.en || locale.ar || "";
}

// Wonder Cabinet events are always Bethlehem-local and Sanity stores
// startDateTime/endDateTime with an explicit offset (e.g.
// "2026-09-24T17:00:00+03:00") -- slicing the ISO string directly gives
// the correct local calendar day/time without any timezone-conversion
// risk (see wonder-cabinet-ops-build.md's own note about a UTC/local-time
// bug found the same way in a different part of this project).
function dayOf(iso) {
  return iso.slice(0, 10);
}
function timeOf(iso) {
  return iso.slice(11, 16);
}

// shortDescription is meant for a longer blurb elsewhere on the site; the
// digest only has room for one short line under the title (per the
// approved WK03 design). Use just the first line, capped, rather than
// dumping a whole paragraph into a grid cell.
function briefDesc(text) {
  if (!text) return "";
  const firstLine = text.split("\n")[0].trim();
  return firstLine.length > 90 ? firstLine.slice(0, 89) + "…" : firstLine;
}

function adaptEvent(ev) {
  const enTitle = pick(ev.title, "en") || "(untitled)";
  const arTitleRaw = ev.title && ev.title.ar;
  const enDescRaw = ev.shortDescription && ev.shortDescription.en;
  const arDescRaw = ev.shortDescription && ev.shortDescription.ar;

  return {
    day: dayOf(ev.startDateTime),
    start: timeOf(ev.startDateTime),
    end: ev.endDateTime ? timeOf(ev.endDateTime) : undefined,
    title: { en: enTitle, ar: arTitleRaw || enTitle },
    desc: { en: briefDesc(enDescRaw), ar: briefDesc(arDescRaw || enDescRaw) },
    _missingAr: !arTitleRaw,
  };
}

// doc is the WEEKLY_PROJECTION shape from api/generate-weekly-digest.mjs:
// { _id, weekStart, weekEnd, events: [...expanded event docs] }. Only the
// "Highlighted events" list feeds the digest grid, matching the WK03
// design Ibrahim already approved (v1's separate "Also happening this
// week" compact-list section was not carried over -- flagged as a
// possible future addition, not built here).
export function sanityDocToWeekly(doc) {
  const events = (doc.events || [])
    .filter((ev) => ev && ev.startDateTime)
    .map(adaptEvent)
    .sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start));

  return {
    weekStart: doc.weekStart,
    weekEnd: doc.weekEnd,
    events,
    missingArCount: events.filter((e) => e._missingAr).length,
    totalCount: events.length,
  };
}

// --- Public render functions ---------------------------------------------

export function renderWeeklyCoverPng(weekly, theme = DEFAULT_THEME) {
  return svgToPng(buildCoverSVG(weekly, theme), 2160); // 2x 1080 -> crisp IG upload
}

export function renderWeeklyEnPng(weekly, theme = DEFAULT_THEME) {
  return svgToPng(buildGridSVG(weekly, "ltr", theme), 2160);
}

export function renderWeeklyArPng(weekly, theme = DEFAULT_THEME) {
  return svgToPng(buildGridSVG(weekly, "rtl", theme), 2160);
}

// Combined EN-over-AR A3 sheet. The source SVG's height is dynamic (grows
// with how many events that week has), so -- exactly like the standalone
// HTML's print CSS -- this scales the rendered image to fit inside a fixed
// A3 page (842x1191pt = 297x420mm @72dpi) preserving its aspect ratio and
// centering it, rather than assuming it's always exactly one A3-shaped sheet.
export async function renderWeeklyDigestPdfCombined(weekly, printTheme = PRINT_THEME) {
  const svg = buildPrintCombinedSVG(weekly, printTheme);
  const { w: svgW, h: svgH } = svgDims(svg);

  const DPI_SCALE = 300 / 72; // print-quality raster (~300dpi at A3 width)
  const png = svgToPng(svg, svgW * DPI_SCALE);

  const PAGE_W = 842;
  const PAGE_H = 1191;
  const scale = Math.min(PAGE_W / svgW, PAGE_H / svgH);
  const drawW = svgW * scale;
  const drawH = svgH * scale;
  const x = (PAGE_W - drawW) / 2;
  const y = (PAGE_H - drawH) / 2;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const img = await pdf.embedPng(png);
  page.drawImage(img, { x, y, width: drawW, height: drawH });
  return Buffer.from(await pdf.save());
}
