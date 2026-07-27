// Renders a branded 1080×1080 share image for a socialPost, matching the
// site's bold-uppercase-sans / solid-type-color visual identity (see
// TYPE_COLORS in event.html and index.html). Kept as its own small copy
// here rather than importing the client-side files directly — this runs
// server-side under plain Node (via @vercel/og's Node build, not Edge), and
// the client files assume a DOM/browser environment.
import { ImageResponse } from "@vercel/og";

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

const DWEN = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const MABBR = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function formatTime(iso) {
  if (!iso) return "";
  const hasTime = +iso.slice(11, 13) || +iso.slice(14, 16);
  return hasTime ? new Date(iso).toTimeString().slice(0, 5) : "";
}

// Long titles need a smaller font to keep from overflowing the 1080×1080
// canvas — a simple length-based step-down rather than trying to measure
// real text width up front.
function titleFontSize(title) {
  const len = (title || "").length;
  if (len > 70) return 56;
  if (len > 45) return 68;
  return 84;
}

export async function renderShareImage(doc) {
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

  const res = new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          width: "1080px",
          height: "1080px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px",
          background: colors.bg,
          color: colors.ink,
          fontFamily: "sans-serif",
        },
        children: [
          {
            type: "div",
            props: {
              style: { fontSize: 28, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, opacity: 0.85, display: "flex" },
              children: kicker,
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: titleFontSize(title),
                fontWeight: 700,
                textTransform: "uppercase",
                lineHeight: 1.05,
                display: "flex",
              },
              children: title,
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: 26,
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
    { width: 1080, height: 1080 }
  );

  return Buffer.from(await res.arrayBuffer());
}
