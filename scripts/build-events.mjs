// Wonder Cabinet — Sanity → assets/events.js generator
//
// Pulls live `event` documents from Sanity (drafts perspective, since virtually
// all WC content is currently unpublished/draft) and writes a static
// assets/events.js file in the exact shape the existing design-bundle site
// (index.html / event.html) expects.
//
// Usage (live fetch, needs a Sanity token with read access incl. drafts):
//   SANITY_TOKEN=<token> node scripts/build-events.mjs <outDir>
//
// Usage (offline, from a pre-fetched snapshot — no token needed):
//   node scripts/build-events.mjs <outDir> --snapshot scripts/raw-events-snapshot.json
//
// The token, when used, only ever lives in this Node process at build time.
// It is never written to disk or shipped to the browser.

const PROJECT_ID = "xdtj605l";
const DATASET = "production";
const API_VERSION = "v2024-01-01";

const TOKEN = process.env.SANITY_TOKEN;
const outDir = process.argv[2] || ".";
const snapshotFlagIdx = process.argv.indexOf("--snapshot");
const snapshotPath = snapshotFlagIdx !== -1 ? process.argv[snapshotFlagIdx + 1] : null;

if (!TOKEN && !snapshotPath) {
  console.error("Need either SANITY_TOKEN (live fetch) or --snapshot <file.json> (offline).");
  process.exit(1);
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DOW_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

function localParts(iso) {
  // Sanity datetimes are stored with their original local offset
  // (e.g. 2026-04-06T19:00:00+03:00 == 19:00 Bethlehem time already).
  // Parse the wall-clock fields directly rather than converting timezones.
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) throw new Error("Bad datetime: " + iso);
  return { year: +m[1], month: +m[2], day: m[3], hour: m[4], minute: m[5] };
}

function dowFor(year, month, day) {
  // Use UTC construction so the sandbox's own timezone can't shift the date.
  return new Date(Date.UTC(year, month - 1, +day)).getUTCDay();
}

function splitParagraphs(text) {
  if (!text) return [];
  return text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
}

async function sanityFetch(query, params = {}) {
  const url = new URL(`https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}`);
  url.searchParams.set("query", query);
  url.searchParams.set("perspective", "drafts");
  for (const [k, v] of Object.entries(params)) url.searchParams.set("$" + k, JSON.stringify(v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.result;
}

function jsStr(s) {
  return JSON.stringify(s || "");
}

function jsArr(arr) {
  return "[\n" + arr.map(s => "      " + jsStr(s)).join(",\n") + "\n    ]";
}

function buildEventObject(ev) {
  const start = localParts(ev.startDateTime);
  const dowIdx = dowFor(start.year, start.month, start.day);
  const month = MONTHS[start.month - 1];
  const startHHMM = `${start.hour}:${start.minute}`;
  let endHHMM = "";
  if (ev.endDateTime) {
    const end = localParts(ev.endDateTime);
    endHHMM = `${end.hour}:${end.minute}`;
  }

  const title = ev.title?.en || "";
  const titleAr = ev.title?.ar || "";
  const subtitle = ev.subtitle?.en || "";
  const short = ev.shortDescription?.en || "";
  const shortAr = ev.shortDescription?.ar || "";
  const body = splitParagraphs(ev.body?.en);
  const bodyAr = splitParagraphs(ev.body?.ar);
  const writeup = ev.writeup?.en || "";
  const writeupAr = ev.writeup?.ar || "";

  const lines = [];
  lines.push(`  {`);
  lines.push(`    id: ${jsStr(ev.slug?.current || ev._id)},`);
  lines.push(`    day: ${jsStr(start.day)}, month: ${jsStr(month)}, year: ${start.year},`);
  lines.push(`    dow: ${jsStr(DOW_EN[dowIdx])}, dowAr: ${jsStr(DOW_AR[dowIdx])},`);
  lines.push(`    start: ${jsStr(startHHMM)}, end: ${jsStr(endHHMM)},`);
  lines.push(`    type: ${jsStr(ev.eventType)},`);
  lines.push(`    title: ${jsStr(title)},`);
  lines.push(`    titleAr: ${jsStr(titleAr)},`);
  if (subtitle) lines.push(`    subtitle: ${jsStr(subtitle)},`);
  if (ev.location) lines.push(`    location: ${jsStr(ev.location)},`);
  if (ev.recurring) lines.push(`    recurring: true,`);
  if (ev.recurringLabel?.en) lines.push(`    recurringLabel: ${jsStr(ev.recurringLabel.en)},`);
  if (ev.featured) lines.push(`    featured: true,`);
  lines.push(`    status: ${jsStr(ev.status)},`);
  if (ev.registerUrl) lines.push(`    register: ${jsStr(ev.registerUrl)},`);
  if (ev.coverUrl) lines.push(`    cover: ${jsStr(ev.coverUrl)},`);
  if (short) lines.push(`    short: ${jsStr(short)},`);
  if (shortAr) lines.push(`    shortAr: ${jsStr(shortAr)},`);
  if (writeup) lines.push(`    writeup: ${jsStr(writeup)},`);
  if (writeupAr) lines.push(`    writeupAr: ${jsStr(writeupAr)},`);
  lines.push(`    body: ${jsArr(body)},`);
  lines.push(`    bodyAr: ${jsArr(bodyAr)}`);
  lines.push(`  }`);
  return lines.join("\n");
}

const FOOTER = `

// Season computation — Northern hemisphere meteorological seasons (Bethlehem)
// Winter spans Dec→Feb; anchored to the December year (Dec 2025 + Jan/Feb 2026 = "Winter 2025")
function __twcSeason(month, year){
  if (["Sep","Oct","Nov"].includes(month)) return { key: "autumn-" + year,   name: "Autumn", nameAr: "خريف", year: year };
  if (month === "Dec")                     return { key: "winter-" + year,   name: "Winter", nameAr: "شتاء", year: year };
  if (["Jan","Feb"].includes(month))       return { key: "winter-" + (year-1), name: "Winter", nameAr: "شتاء", year: year-1 };
  if (["Mar","Apr","May"].includes(month)) return { key: "spring-" + year,   name: "Spring", nameAr: "ربيع", year: year };
  if (["Jun","Jul","Aug"].includes(month)) return { key: "summer-" + year,   name: "Summer", nameAr: "صيف", year: year };
  return { key: "unknown-" + year, name: "—", nameAr: "—", year: year };
}
window.EVENTS.forEach(e => { e.season = __twcSeason(e.month, e.year); });
window.SEASONS = (function(){
  const seen = {};
  window.EVENTS.forEach(e => { seen[e.season.key] = e.season; });
  const order = { winter: 4, autumn: 3, summer: 2, spring: 1 };
  return Object.values(seen).sort((a,b) => {
    if (a.year !== b.year) return b.year - a.year;
    const ak = a.key.split("-")[0], bk = b.key.split("-")[0];
    return (order[bk] || 0) - (order[ak] || 0);
  });
})();

window.EVENTS_BY_ID = Object.fromEntries(window.EVENTS.map(e=>[e.id, e]));
`;

async function main() {
  let events;
  if (snapshotPath) {
    const fs = await import("node:fs");
    events = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
    console.log(`Loaded ${events.length} event documents from snapshot ${snapshotPath}.`);
  } else {
    events = await sanityFetch(
      `*[_type == "event"] | order(startDateTime asc) {
        _id, title, slug, subtitle, eventType, startDateTime, endDateTime,
        location, featured, recurring, recurringLabel, status, registerUrl,
        shortDescription, body, writeup, "coverUrl": cover.asset->url
      }`
    );
    console.log(`Fetched ${events.length} event documents from Sanity (drafts perspective).`);
  }

  const body =
    "// Shared events data — GENERATED from live Sanity content. Do not hand-edit.\n" +
    "// Source: Sanity project " + PROJECT_ID + " / dataset " + DATASET + " (drafts perspective)\n" +
    "// Generated: " + new Date().toISOString() + "\n" +
    "// status: \"upcoming\" | \"past\"\n" +
    "// recurring: true if this is a weekly/recurring event\n\n" +
    "window.EVENTS = [\n\n" +
    events.map(buildEventObject).join(",\n\n") +
    "\n\n];\n" +
    FOOTER;

  const fs = await import("node:fs");
  const path = await import("node:path");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "events.js");
  fs.writeFileSync(outPath, body, "utf8");
  console.log(`Wrote ${outPath} (${events.length} events).`);
}

main().catch(err => { console.error(err); process.exit(1); });
