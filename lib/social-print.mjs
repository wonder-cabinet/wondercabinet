// Renders a branded A3-landscape print poster for an event, matching
// lib/social-image.mjs's visual system (TYPE_COLORS, kicker/title/footer)
// reflowed for print, with the real Wonder Cabinet badge mark (assets/wc-logo.svg)
// added top-left. Same server-side-Node @vercel/og build as social-image.mjs.
//
// Badge implementation note: the circle + two star paths + rule render as a
// nested data-URI SVG image fine, but <text> elements inside a nested SVG
// don't get font-shaped when the raster pass runs on the sub-document -- so
// the "W"/"C" letters are separate text nodes in the main tree, absolutely
// positioned over the circle, using the same font/pipeline as the rest of
// the poster (proven to render correctly).
import { ImageResponse } from "@vercel/og";
import { PDFDocument } from "pdf-lib";

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

const DWEN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function formatTime(iso) {
  if (!iso) return "";
  const hasTime = +iso.slice(11, 13) || +iso.slice(14, 16);
  return hasTime ? new Date(iso).toTimeString().slice(0, 5) : "";
}

// Longer titles need a smaller font to keep from overflowing the canvas --
// same length-based step-down approach as titleFontSize() in social-image.mjs.
function titleFontSize(title) {
  const len = (title || "").length;
  if (len > 70) return 90;
  if (len > 45) return 120;
  return 150;
}

// A3 landscape, 420x297mm.
const MM_W = 420;
const MM_H = 297;
function pxSize(dpi) {
  return {
    w: Math.round((MM_W / 25.4) * dpi),
    h: Math.round((MM_H / 25.4) * dpi),
  };
}

function badgeVectorSvg(ink, size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 200 200" fill="none">
  <circle cx="100" cy="100" r="92" stroke="${ink}" stroke-width="4"/>
  <path d="M55 85 L70 55 L85 85 L78 85 L70 70 L62 85 Z" fill="${ink}"/>
  <path d="M115 85 L130 55 L145 85 L138 85 L130 70 L122 85 Z" fill="${ink}"/>
  <line x1="86" y1="130" x2="114" y2="130" stroke="${ink}" stroke-width="3"/>
</svg>`;
}

function badgeNode(ink, size) {
  const svgB64 = Buffer.from(badgeVectorSvg(ink, size)).toString("base64");
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
  });
  return {
    type: "div",
    props: {
      style: { position: "relative", width: size, height: size, display: "flex" },
      children: [
        { type: "img", props: { src: `data:image/svg+xml;base64,${svgB64}`, width: size, height: size } },
        { type: "div", props: { style: letterStyle(56), children: "W" } },
        { type: "div", props: { style: letterStyle(74), children: "C" } },
      ],
    },
  };
}

function buildTree(doc, dpi) {
  const colors = TYPE_COLORS[doc.eventType] || FALLBACK;
  const start = doc.startDateTime ? new Date(doc.startDateTime) : null;
  const kicker = [
    (doc.eventType || "").toUpperCase(),
    start ? `${DWEN[start.getDay()]} ${start.getDate()} ${MABBR[start.getMonth()]}` : "",
    formatTime(doc.startDateTime),
  ]
    .filter(Boolean)
    .join(" · ");
  const title = doc.title?.en || "(untitled)";
  const { w, h } = pxSize(dpi);
  const badgeSize = Math.round(h * 0.11);

  return {
    tree: {
      type: "div",
      props: {
        style: {
          width: `${w}px`,
          height: `${h}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: `${Math.round(h * 0.09)}px`,
          background: colors.bg,
          color: colors.ink,
          fontFamily: "sans-serif",
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
                      fontSize: Math.round(h * 0.032),
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      opacity: 0.85,
                      display: "flex",
                    },
                    children: kicker,
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: titleFontSize(title),
                fontWeight: 700,
                textTransform: "uppercase",
                lineHeight: 1.02,
                display: "flex",
                maxWidth: "88%",
              },
              children: title,
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: Math.round(h * 0.028),
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 2,
                display: "flex",
                justifyContent: "space-between",
              },
              children: [
                { type: "span", props: { children: "The Wonder Cabinet" } },
                { type: "span", props: { children: "wondercabinet.space" } },
              ],
            },
          },
        ],
      },
    },
    w,
    h,
  };
}

// dpi: 150 keeps render time/memory comfortable in a Vercel serverless
// function and is a normal working resolution for poster-scale print
// (viewed at a distance, not held close) -- bump to 300 for print-shop
// quality if a given deploy's function timeout/memory allows it.
export async function renderPrintPosterPng(doc, dpi = 150) {
  const { tree, w, h } = buildTree(doc, dpi);
  const res = new ImageResponse(tree, { width: w, height: h });
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
