// Lightweight, read-only preview endpoint for the Studio's live color-theme
// preview (studio/components/DigestThemeTools.tsx). Renders ONLY the cover
// slide -- the one digest image that doesn't depend on actual event content
// (see buildCoverSVG in lib/weekly-digest/weekly-svg.mjs: it only uses
// weekStart/weekEnd + the theme, never events) -- at half the normal
// resolution for speed, and returns it directly as a PNG image rather than
// JSON, so the Studio can just point an <img> tag at this URL and let the
// browser's own image loading/caching handle it.
//
// Never touches Sanity data: purely a stateless render of whatever
// bg/fg/weekStart/weekEnd query params are passed in, so a rapid string of
// color-picker drags is cheap and has nothing to roll back if abandoned.
// Gated by the same shared token as the other generate-*.mjs endpoints,
// passed as a query param since this is a plain GET <img src>.
import { Resvg } from "@resvg/resvg-js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCoverSVG } from "../lib/weekly-digest/weekly-svg.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(__dirname, "..", "lib", "weekly-digest", "fonts");
const FONT_FILES = [
  path.join(FONT_DIR, "HaasGrotDisp-55Roman.otf"),
  path.join(FONT_DIR, "Nabi-Regular.ttf"),
  path.join(FONT_DIR, "Alyamama-VariableFont_wght.ttf"),
];

function stripFontStyle(svg) {
  return svg.replace(/<style>[\s\S]*?<\/style>/, "");
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function handler(req, res) {
  const token = process.env.STUDIO_GENERATE_TOKEN;
  if (!token || req.query.token !== token) {
    res.status(401).send("Unauthorized");
    return;
  }

  const bg = HEX_RE.test(req.query.bg) ? req.query.bg : "#77FF90";
  const fg = HEX_RE.test(req.query.fg) ? req.query.fg : "#4450D6";
  const weekStart = DATE_RE.test(req.query.weekStart)
    ? req.query.weekStart
    : new Date().toISOString().slice(0, 10);
  const weekEnd = DATE_RE.test(req.query.weekEnd) ? req.query.weekEnd : weekStart;

  try {
    const svg = buildCoverSVG({ weekStart, weekEnd }, { bg, fg });
    const resvg = new Resvg(stripFontStyle(svg), {
      fitTo: { mode: "width", value: 540 }, // half-res -- a live preview, not a download
      font: {
        loadSystemFonts: false,
        fontFiles: FONT_FILES,
        defaultFontFamily: "Haas",
      },
    });
    const png = resvg.render().asPng();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(png);
  } catch (err) {
    console.error("preview-weekly-cover: failed", err);
    res.status(500).send("Preview failed");
  }
}
