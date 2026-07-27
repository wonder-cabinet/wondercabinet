// Generates the bilingual (EN/AR) caption/message/blurb text for a
// socialPost doc, from a raw Sanity `event` document. Pure string
// formatting — no network calls, no Sanity/Vercel dependencies — so it's
// easy to unit-test and reuse from both the webhook handler and any
// future manual "regenerate" tool.

const DWEN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DWAR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const MFULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const TYPE_HASHTAG_EN = {
  Performance: "Performance", Film: "FilmScreening", Radio: "Radio", Class: "Class",
  Workshop: "Workshop", "Open Studio": "OpenStudio", Reading: "Reading",
  Opening: "Opening", Bar: "Bar", Exhibition: "Exhibition",
};

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function arNum(s) {
  return String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
}

function formatTime(iso) {
  if (!iso) return "";
  const hasTime = +iso.slice(11, 13) || +iso.slice(14, 16);
  if (!hasTime) return "";
  return new Date(iso).toTimeString().slice(0, 5);
}

// Truncate on a word boundary, never mid-word — for the short excerpt
// pulled into the Instagram/newsletter copy.
function excerpt(text, maxLen) {
  if (!text) return "";
  const clean = text.trim();
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

function firstParagraph(localeText) {
  if (!localeText) return "";
  return localeText.split(/\n\s*\n/)[0].trim();
}

export function buildSocialContent(doc) {
  const start = doc.startDateTime ? new Date(doc.startDateTime) : null;
  const dowEn = start ? DWEN[start.getDay()] : "";
  const dowAr = start ? DWAR[start.getDay()] : "";
  const dateEn = start ? `${MFULL[start.getMonth()]} ${ordinal(start.getDate())}` : "";
  const dateAr = start ? `${arNum(start.getDate())} ${MONTH_AR[start.getMonth()]}` : "";
  const timeEn = formatTime(doc.startDateTime);
  const endTimeEn = formatTime(doc.endDateTime);
  const timeLine = timeEn ? `${timeEn}${endTimeEn ? "–" + endTimeEn : ""}` : "";

  const titleEn = doc.title?.en || "";
  const titleAr = doc.title?.ar || "";
  const locationName =
    (doc.location && typeof doc.location === "object" && (doc.location.name || doc.location.title)) || "Wonder Cabinet";

  const bodyEn = firstParagraph(doc.shortDescription?.en || doc.body?.en);
  const bodyAr = firstParagraph(doc.shortDescription?.ar || doc.body?.ar);

  const eventUrl = `https://www.wondercabinet.space/event.html?id=${encodeURIComponent(doc.slug?.current || doc._id)}`;

  const typeTag = TYPE_HASHTAG_EN[doc.eventType] || "Event";
  const hashtags = `#WonderCabinet #Bethlehem #Palestine #${typeTag}`;

  // --- Instagram ---
  const igEnLines = [
    titleEn,
    [dowEn, dateEn, timeLine].filter(Boolean).join(" · "),
    "",
    excerpt(bodyEn, 280),
    "",
    `📍 ${locationName}, Bethlehem`,
    `🔗 ${eventUrl}`,
    "",
    hashtags,
  ];
  const igArLines = titleAr
    ? [
        titleAr,
        [dowAr, dateAr, timeLine].filter(Boolean).join(" · "),
        "",
        excerpt(bodyAr, 280),
        "",
        `📍 ${locationName === "Wonder Cabinet" ? "مجلس العجب" : locationName}، بيت لحم`,
        `🔗 ${eventUrl}`,
      ]
    : [];

  // --- WhatsApp (shorter, casual) ---
  const waEnLines = [
    `📣 ${titleEn}`,
    `🗓 ${[dowEn, dateEn, timeLine].filter(Boolean).join(" · ")}`,
    `📍 ${locationName}`,
    "",
    excerpt(bodyEn, 160),
    "",
    `More info: ${eventUrl}`,
  ];
  const waArLines = titleAr
    ? [
        `📣 ${titleAr}`,
        `🗓 ${[dowAr, dateAr, timeLine].filter(Boolean).join(" · ")}`,
        `📍 ${locationName === "Wonder Cabinet" ? "مجلس العجب" : locationName}`,
        "",
        excerpt(bodyAr, 160),
        "",
        `التفاصيل: ${eventUrl}`,
      ]
    : [];

  // --- Newsletter (plain text, no dedicated tool yet) ---
  const nlEnLines = [
    titleEn,
    [dowEn, dateEn, timeLine, locationName].filter(Boolean).join(" · "),
    "",
    excerpt(bodyEn, 400),
    "",
    `Read more: ${eventUrl}`,
  ];
  const nlArLines = titleAr
    ? [
        titleAr,
        [dowAr, dateAr, timeLine, locationName === "Wonder Cabinet" ? "مجلس العجب" : locationName].filter(Boolean).join(" · "),
        "",
        excerpt(bodyAr, 400),
        "",
        `لمزيد من التفاصيل: ${eventUrl}`,
      ]
    : [];

  return {
    instagramCaption: { en: igEnLines.filter((l) => l !== undefined).join("\n"), ar: igArLines.join("\n") || undefined },
    whatsappMessage: { en: waEnLines.filter((l) => l !== undefined).join("\n"), ar: waArLines.join("\n") || undefined },
    newsletterBlurb: { en: nlEnLines.filter((l) => l !== undefined).join("\n"), ar: nlArLines.join("\n") || undefined },
  };
}
