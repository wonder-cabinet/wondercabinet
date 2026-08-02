// Wonder Cabinet — Google Calendar → Sanity event sync
//
// Reads the public "WONDER CABINET PUBLIC" Google Calendar (ICS feed) and
// upserts `event` documents into Sanity (project xdtj605l / dataset production)
// so calendar additions show up on the site automatically.
//
// Runs hourly via .github/workflows/calendar-sync.yml (+ manual dispatch).
//
// Rules (see PLAN / task spec for full detail):
//  - Window: events starting from 7 days ago to +180 days are considered for
//    one-off create/patch. Recurring masters always get their *next* upcoming
//    occurrence recomputed, regardless of window.
//  - All-day / date-only events are skipped (exhibitions are managed by hand
//    as `project` documents).
//  - STATUS:CANCELLED events are skipped.
//  - Recurring (RRULE) events collapse to a single Sanity doc keyed by the
//    *master* UID; we never expand occurrences into separate docs.
//  - Matching order: (1) googleCalendarEventId === ICS UID (master UID for
//    recurring), stripped of any "@google.com" suffix. (2) Adoption pass —
//    for existing docs that lack googleCalendarEventId, match by same
//    Asia/Hebron calendar date + normalized title similarity, then patch
//    googleCalendarEventId onto that doc instead of creating a duplicate.
//  - New events: createIfNotExists with all parsed fields (published, no
//    draft) + googleCalendarEventId.
//  - Existing (matched via googleCalendarEventId — not a fresh adoption this
//    run): patch startDateTime / endDateTime / title.en / title.ar / body.en /
//    body.ar if they differ from the calendar. Never touch subtitle/images/
//    relatedArtists ordering/etc — those may be hand-polished in the Studio.
//  - Artist detection: inside the DESCRIPTION block, an <u>underlined name</u>
//    is treated as "this event's artist" — text before it is the event's own
//    description, text after it is that artist's bio. The name is fuzzy-
//    matched (same normalization as title adoption) against existing `artist`
//    docs; a match gets linked (relatedArtists, append-only — never removes
//    an existing link), no match creates a new artist doc (name + bio) and
//    links that instead. Only ever adds artists, never edits an existing
//    artist's bio once created (that's the Studio's job from then on).
//  - Docs that have a googleCalendarEventId, a future startDateTime, and
//    whose UID no longer appears *anywhere* in the raw feed (even in a
//    skipped/all-day/cancelled event) get a warning logged. Never deleted.
//
// Usage:
//   node scripts/calendar-sync.mjs                 # live run, needs SANITY_TOKEN
//   node scripts/calendar-sync.mjs --dry-run        # read-only, prints a table
//
// Test-only overrides (never used in the GitHub Action):
//   --ics-file <path>          read ICS text from a local file instead of the network
//   --sanity-snapshot <path>   read existing-events JSON from a local file instead of querying Sanity
//
// Zero dependencies. Node 20+.

const PROJECT_ID = "xdtj605l";
const DATASET = "production";
const API_VERSION = "v2024-01-01";
const ICS_URL =
  "https://calendar.google.com/calendar/ical/c_869ed25e6012728063fdfceaca41691722afc92fa977221ef092fe1b38b744f8%40group.calendar.google.com/public/basic.ics";

const WINDOW_PAST_DAYS = 7;
const WINDOW_FUTURE_DAYS = 180;
// Note: the calendar only ever uses the Asia/Hebron timezone (see VTIMEZONE
// handling below), so we don't need to track TZID per-property.

const TOKEN = process.env.SANITY_TOKEN;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const icsFileIdx = args.indexOf("--ics-file");
const ICS_FILE = icsFileIdx !== -1 ? args[icsFileIdx + 1] : null;
const snapshotIdx = args.indexOf("--sanity-snapshot");
const SANITY_SNAPSHOT = snapshotIdx !== -1 ? args[snapshotIdx + 1] : null;

const MONTH_ABBR = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

// ---------------------------------------------------------------------------
// Asia/Hebron UTC offset
//
// The calendar's VTIMEZONE block defines the rule Google itself uses:
//   DAYLIGHT (+03:00) from the last Saturday of March, 02:00
//   STANDARD (+02:00) from the last Saturday of October, 02:00
// This mirrors Palestine's DST rule. We replicate it directly instead of
// depending on the host machine's tz database (so GitHub Actions' UTC
// runners produce identical results to any dev machine).
// ---------------------------------------------------------------------------
function lastSaturdayOfMonth(year, monthIndex0) {
  // monthIndex0: 2 = March, 9 = October
  const d = new Date(Date.UTC(year, monthIndex0 + 1, 0)); // last day of month
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (dow - 6 + 7) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d; // UTC midnight of the last Saturday
}

function hebronOffsetMinutes(utcDate) {
  const year = utcDate.getUTCFullYear();
  const dstStart = lastSaturdayOfMonth(year, 2); // March
  dstStart.setUTCHours(0, 0, 0, 0); // rule fires at 02:00 local +02:00 = 00:00 UTC
  const dstEnd = lastSaturdayOfMonth(year, 9); // October
  dstEnd.setUTCHours(0, 0, 0, 0); // 02:00 local +03:00 = 23:00 UTC previous day, close enough at day granularity
  if (utcDate >= dstStart && utcDate < dstEnd) return 180; // +03:00
  return 120; // +02:00
}

function offsetString(minutes) {
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

// Build an Asia/Hebron ISO string ("YYYY-MM-DDTHH:mm:ss+03:00") from a UTC Date.
function utcToHebronIso(utcDate) {
  const offMin = hebronOffsetMinutes(utcDate);
  const local = new Date(utcDate.getTime() + offMin * 60000);
  const y = local.getUTCFullYear();
  const mo = String(local.getUTCMonth() + 1).padStart(2, "0");
  const da = String(local.getUTCDate()).padStart(2, "0");
  const h = String(local.getUTCHours()).padStart(2, "0");
  const mi = String(local.getUTCMinutes()).padStart(2, "0");
  const s = String(local.getUTCSeconds()).padStart(2, "0");
  return `${y}-${mo}-${da}T${h}:${mi}:${s}${offsetString(offMin)}`;
}

// Build an Asia/Hebron ISO string directly from wall-clock fields (already
// local to Asia/Hebron, e.g. from a DTSTART;TZID=Asia/Hebron value).
function wallClockToHebronIso(y, mo, da, h, mi, s) {
  // Determine offset using a UTC instant close to this wall-clock moment.
  // We don't know the exact UTC instant yet, but the DST rule is date-based
  // (not time-of-day-sensitive at this granularity), so probing with the
  // wall-clock date at midday UTC is safe.
  const probe = new Date(Date.UTC(y, mo - 1, da, 12, 0, 0));
  const offMin = hebronOffsetMinutes(probe);
  return `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:${String(s).padStart(2, "0")}${offsetString(offMin)}`;
}

function isoToUtcDate(iso) {
  // iso already carries its own offset (e.g. +03:00) — plain `new Date()` parses that correctly.
  return new Date(iso);
}

// Monday–Sunday bounds (as plain YYYY-MM-DD calendar-date strings, Asia/Hebron
// wall-clock) of the week containing `now`. Used to auto-create this week's
// (and next week's) `weeklyIssue` doc — see main()'s weekly-issue pass below.
// Deliberately mirrors the "local calendar date, not UTC" reasoning used
// throughout this file (utcToHebronIso, calendarDate) and on the site itself
// (index.html's getMonday): computing the week boundary from a UTC instant
// directly would risk rolling the date back/forward a day around midnight.
function getHebronWeekBounds(now) {
  const hebronIso = utcToHebronIso(now);
  const [y, mo, da] = hebronIso.slice(0, 10).split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1, da)); // midnight UTC standing in for that Hebron calendar date
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(d.getTime() - diffToMonday * 86400000);
  const fmt = (x) => `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}-${String(x.getUTCDate()).padStart(2, "0")}`;
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  return { weekStart: fmt(monday), weekEnd: fmt(sunday), mondayDate: monday };
}

// ---------------------------------------------------------------------------
// ICS parsing
// ---------------------------------------------------------------------------

function unfoldIcs(raw) {
  // RFC5545: continuation lines start with a single space or tab; the
  // fold (CRLF + that whitespace) must be removed with NO character
  // inserted in its place.
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const out = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function parsePropertyLine(line) {
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return null;
  const head = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1);
  const parts = head.split(";");
  const name = parts[0].toUpperCase();
  const params = {};
  for (let i = 1; i < parts.length; i++) {
    const eq = parts[i].indexOf("=");
    if (eq === -1) continue;
    params[parts[i].slice(0, eq).toUpperCase()] = parts[i].slice(eq + 1);
  }
  return { name, params, value };
}

function unescapeIcsText(value) {
  if (!value) return "";
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseDtProperty(prop) {
  // Returns { isDateOnly, iso } where iso is an Asia/Hebron-offset ISO string
  // (for timed values) or a plain YYYY-MM-DD (for all-day values).
  const v = prop.value.trim();
  if (prop.params.VALUE === "DATE" || /^\d{8}$/.test(v)) {
    const y = +v.slice(0, 4), mo = +v.slice(4, 6), da = +v.slice(6, 8);
    return { isDateOnly: true, dateOnly: `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`, y, mo, da };
  }
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) return null;
  const [, y, mo, da, h, mi, s, z] = m;
  if (z === "Z") {
    const utc = new Date(Date.UTC(+y, +mo - 1, +da, +h, +mi, +s));
    return { isDateOnly: false, iso: utcToHebronIso(utc), utc };
  }
  // Local wall-clock value, either bare (floating) or with a TZID param.
  // We treat any TZID as Asia/Hebron (the only zone this calendar uses).
  const iso = wallClockToHebronIso(+y, +mo, +da, +h, +mi, +s);
  return { isDateOnly: false, iso, utc: isoToUtcDate(iso) };
}

function parseVEvents(icsText) {
  const lines = unfoldIcs(icsText);
  const events = [];
  let current = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = [];
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) events.push(parseOneVEvent(current));
      current = null;
      continue;
    }
    if (current) current.push(line);
  }
  return events;
}

function parseOneVEvent(propLines) {
  const props = {};
  for (const line of propLines) {
    const p = parsePropertyLine(line);
    if (!p) continue;
    // DESCRIPTION/SUMMARY can only appear once; last one wins if duplicated.
    props[p.name] = p;
  }
  const uid = props.UID ? props.UID.value.trim() : null;
  const dtstart = props.DTSTART ? parseDtProperty(props.DTSTART) : null;
  const dtend = props.DTEND ? parseDtProperty(props.DTEND) : null;
  const status = props.STATUS ? props.STATUS.value.trim().toUpperCase() : "CONFIRMED";
  const summary = props.SUMMARY ? unescapeIcsText(props.SUMMARY.value.trim()) : "";
  const description = props.DESCRIPTION ? unescapeIcsText(props.DESCRIPTION.value) : "";
  const rrule = props.RRULE ? props.RRULE.value.trim() : null;
  const isOverrideInstance = !!props["RECURRENCE-ID"];
  return { uid, dtstart, dtend, status, summary, description, rrule, isOverrideInstance };
}

// ---------------------------------------------------------------------------
// RRULE — next-occurrence calculator
//
// Supports the common Google Calendar shapes: FREQ=DAILY/WEEKLY/MONTHLY/YEARLY
// with INTERVAL, BYDAY, COUNT, UNTIL. This is intentionally not a full
// RFC5545 implementation — it only needs to find the single next occurrence
// on/after "now", which covers weekly classes, monthly meetups, etc.
// ---------------------------------------------------------------------------

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function parseRrule(rrule) {
  const parts = {};
  for (const kv of rrule.split(";")) {
    const [k, v] = kv.split("=");
    if (k) parts[k.toUpperCase()] = v;
  }
  return {
    freq: parts.FREQ || "WEEKLY",
    interval: parts.INTERVAL ? parseInt(parts.INTERVAL, 10) : 1,
    byday: parts.BYDAY ? parts.BYDAY.split(",") : null,
    count: parts.COUNT ? parseInt(parts.COUNT, 10) : null,
    until: parts.UNTIL ? parseUntil(parts.UNTIL) : null,
  };
}

function parseUntil(v) {
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[5] || 0), +(m[6] || 0), +(m[7] || 0)));
}

function addUtcDays(date, n) {
  return new Date(date.getTime() + n * 86400000);
}

// Compute the next occurrence (as a UTC Date, same wall-clock time as the
// master) at or after `now`, given the master's first occurrence `dtstartUtc`.
function nextRecurrenceOccurrence(dtstartUtc, rrule, now) {
  const rule = parseRrule(rrule);
  const maxIterations = 5000;

  if (rule.freq === "WEEKLY") {
    const days = (rule.byday && rule.byday.length ? rule.byday : [DAY_CODES[dtstartUtc.getUTCDay()]]);
    const dayNums = days.map((d) => DAY_CODES.indexOf(d)).filter((n) => n >= 0).sort((a, b) => a - b);
    // Walk week-by-week (respecting INTERVAL) from the week containing dtstart.
    const weekStart0 = addUtcDays(dtstartUtc, -dtstartUtc.getUTCDay()); // Sunday of the start week, at dtstart's time-of-day
    let weekIndex = 0;
    for (let iter = 0; iter < maxIterations; iter++) {
      const weekStart = addUtcDays(weekStart0, weekIndex * 7 * rule.interval);
      for (const dn of dayNums) {
        const occ = addUtcDays(weekStart, dn);
        if (occ < dtstartUtc) continue;
        if (rule.until && occ > rule.until) return null;
        if (occ >= now) {
          if (rule.count) {
            // Rough count check: count occurrences from dtstart up to occ.
            const n = countWeeklyOccurrencesUpTo(dtstartUtc, dayNums, rule.interval, occ);
            if (n > rule.count) return null;
          }
          return occ;
        }
      }
      weekIndex++;
      if (rule.until && weekStart > rule.until) return null;
    }
    return null;
  }

  if (rule.freq === "DAILY") {
    const stepMs = rule.interval * 86400000;
    let occ = new Date(dtstartUtc.getTime());
    let n = 0;
    for (let iter = 0; iter < maxIterations; iter++) {
      if (rule.until && occ > rule.until) return null;
      if (rule.count && n >= rule.count) return null;
      if (occ >= now) return occ;
      occ = new Date(occ.getTime() + stepMs);
      n++;
    }
    return null;
  }

  if (rule.freq === "MONTHLY" || rule.freq === "YEARLY") {
    const monthsStep = rule.freq === "MONTHLY" ? rule.interval : rule.interval * 12;
    let occ = new Date(dtstartUtc.getTime());
    let n = 0;
    for (let iter = 0; iter < maxIterations; iter++) {
      if (rule.until && occ > rule.until) return null;
      if (rule.count && n >= rule.count) return null;
      if (occ >= now) return occ;
      const next = new Date(occ.getTime());
      next.setUTCMonth(next.getUTCMonth() + monthsStep);
      occ = next;
      n++;
    }
    return null;
  }

  return null;
}

function countWeeklyOccurrencesUpTo(dtstartUtc, dayNums, interval, occ) {
  const weekStart0 = addUtcDays(dtstartUtc, -dtstartUtc.getUTCDay());
  let count = 0;
  for (let weekIndex = 0; ; weekIndex++) {
    const weekStart = addUtcDays(weekStart0, weekIndex * 7 * interval);
    if (weekStart > occ) break;
    for (const dn of dayNums) {
      const d = addUtcDays(weekStart, dn);
      if (d < dtstartUtc) continue;
      if (d > occ) break;
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// HTML / text helpers
// ---------------------------------------------------------------------------

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " ",
};

function decodeEntities(text) {
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+\d*);/gi, (m, code) => {
    if (code[0] === "#") {
      const num = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(num) ? String.fromCodePoint(num) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

function stripHtmlToText(html) {
  if (!html) return "";
  let t = html;
  // Paragraph / line breaks become blank-line separators before tags are dropped.
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<\/(p|div|li)>/gi, "\n\n");
  t = t.replace(/<[^>]+>/g, "");
  t = decodeEntities(t);
  // Collapse the leftover markdown-ish emphasis markers used in the
  // structured template ("**bold**", "_italic_") once blocks are extracted.
  t = t.replace(/\*\*/g, "").replace(/(^|\s)_+|_+(\s|$)/g, "$1$2");
  // Normalize whitespace: collapse 3+ blank lines to 2, trim trailing spaces per line.
  t = t
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/g, "").trim())
    .join("\n");
  t = t.replace(/\n{3,}/g, "\n\n").trim();
  return t;
}

function splitParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Registration URL extraction — must run on the raw (HTML-ish, ICS-unescaped)
// description text, before tags are stripped, so we still have hrefs.
// ---------------------------------------------------------------------------

function extractRegisterUrl(rawDescription) {
  if (!rawDescription) return null;
  const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = anchorRe.exec(rawDescription))) {
    const href = m[1];
    const text = stripHtmlToText(m[2]);
    if (/regist|سجّل|سجل/i.test(text)) return href;
  }
  const bareUrlRe = /https?:\/\/(?:events\.teams\.microsoft\.com|forms\.gle)[^\s")<\]]*/i;
  const bare = rawDescription.match(bareUrlRe);
  if (bare) return bare[0];
  return null;
}

// ---------------------------------------------------------------------------
// Structured-template description parser
//
//   *_# START PUBLIC INFO #_* ... *_# TYPE #_* ... *_# IMAGE URL #_* ...
//   *_# TITLE #_* ... *_# SUBTITLE #_* ... *_# DESCRIPTION #_* ...
//   *_# ARABIC #_* (then TITLE/SUBTITLE/DESCRIPTION again, in Arabic) ...
//   *_# END PUBLIC INFO #_*
//
// Markers are matched loosely (asterisk/underscore emphasis wrapping is
// inconsistent in the wild), keyed on the plain marker word(s) inside "#...#".
// ---------------------------------------------------------------------------

const MARKER_RE = /\*?_?#\s*\**([A-Z][A-Z \t]*?)\**\s*#\_?\*?/g;

function findMarkers(text) {
  const found = [];
  let m;
  MARKER_RE.lastIndex = 0;
  while ((m = MARKER_RE.exec(text))) {
    found.push({ name: m[1].trim().replace(/\s+/g, " "), index: m.index, end: MARKER_RE.lastIndex });
  }
  return found;
}

// Raw (HTML-still-intact) slice between two markers — needed for the artist
// extraction below, which has to see the literal <u> tag before it's stripped.
function sliceBetweenRaw(text, markers, fromName, toNames) {
  const fromIdx = markers.findIndex((mk) => mk.name === fromName);
  if (fromIdx === -1) return "";
  const from = markers[fromIdx];
  let to = null;
  for (let i = fromIdx + 1; i < markers.length; i++) {
    if (toNames.includes(markers[i].name)) {
      to = markers[i];
      break;
    }
  }
  return to ? text.slice(from.end, to.index) : text.slice(from.end);
}

function sliceBetween(text, markers, fromName, toNames) {
  return stripHtmlToText(sliceBetweenRaw(text, markers, fromName, toNames));
}

// ---------------------------------------------------------------------------
// Artist extraction — the artist's name is written as underlined text
// (<u>Name</u>) inside the DESCRIPTION block, with their bio as the text
// immediately following it. Everything before the underlined name is the
// event's own description; everything after it is the artist's bio.
// If no underlined text is found, the whole block is just the description
// and no artist is detected (existing behavior, unchanged).
// ---------------------------------------------------------------------------
function extractArtistFromBlock(rawBlockHtml) {
  const m = rawBlockHtml.match(/<u>([\s\S]*?)<\/u>/i);
  if (!m) return { body: stripHtmlToText(rawBlockHtml), artistName: "", artistBio: "" };
  const before = rawBlockHtml.slice(0, m.index);
  const after = rawBlockHtml.slice(m.index + m[0].length);
  return {
    body: stripHtmlToText(before),
    artistName: stripHtmlToText(m[1]),
    artistBio: stripHtmlToText(after),
  };
}

function parseStructuredDescription(rawDescription) {
  const hasStart = /START PUBLIC INFO/i.test(rawDescription);
  if (!hasStart) return null;

  const markers = findMarkers(rawDescription);
  const names = markers.map((m) => m.name);
  if (!names.some((n) => /^START PUBLIC INFO$/i.test(n))) return null;

  const enTitle = sliceBetween(rawDescription, markers, "TITLE", ["SUBTITLE", "DESCRIPTION", "ARABIC"]);
  const enSubtitle = sliceBetween(rawDescription, markers, "SUBTITLE", ["DESCRIPTION", "ARABIC"]);
  const enDescRaw = sliceBetweenRaw(rawDescription, markers, "DESCRIPTION", ["ARABIC"]);
  const enArtist = extractArtistFromBlock(enDescRaw);

  // Arabic section: everything after the ARABIC marker gets its own
  // TITLE/SUBTITLE/DESCRIPTION triplet (second occurrence of each name).
  const arabicIdx = markers.findIndex((mk) => /^ARABIC$/i.test(mk.name));
  let arTitle = "", arSubtitle = "";
  let arArtist = { body: "", artistName: "", artistBio: "" };
  if (arabicIdx !== -1) {
    const afterArabic = markers.slice(arabicIdx + 1);
    const arMarkersRebased = afterArabic; // indices are still absolute into rawDescription
    arTitle = sliceBetween(rawDescription, [markers[arabicIdx], ...arMarkersRebased], "TITLE", ["SUBTITLE", "DESCRIPTION", "END PUBLIC INFO"]);
    arSubtitle = sliceBetween(rawDescription, [markers[arabicIdx], ...arMarkersRebased], "SUBTITLE", ["DESCRIPTION", "END PUBLIC INFO"]);
    const arDescRaw = sliceBetweenRaw(rawDescription, [markers[arabicIdx], ...arMarkersRebased], "DESCRIPTION", ["END PUBLIC INFO"]);
    arArtist = extractArtistFromBlock(arDescRaw);
  }

  return {
    en: { title: enTitle, subtitle: enSubtitle, body: enArtist.body, artistName: enArtist.artistName, artistBio: enArtist.artistBio },
    ar: { title: arTitle, subtitle: arSubtitle, body: arArtist.body, artistName: arArtist.artistName, artistBio: arArtist.artistBio },
  };
}

// ---------------------------------------------------------------------------
// Free-form fallback parser (no structured markers): SUMMARY is the EN title;
// Arabic vs. English paragraphs are split by script majority.
// ---------------------------------------------------------------------------

function arabicRatio(str) {
  const letters = str.match(/[A-Za-z؀-ۿ]/g) || [];
  if (!letters.length) return 0;
  const arabic = str.match(/[؀-ۿ]/g) || [];
  return arabic.length / letters.length;
}

// SUMMARY on a free-form (non-structured-template) event is often typed as
// "English title  Arabic title" in one line, no separator — split it on the
// EN/AR script boundary instead of dumping the whole thing into title.en
// with title.ar left empty. Handles the common EN-then-AR order; falls back
// to AR-then-EN if the string starts with an Arabic character.
function splitTitleByScript(summary) {
  const s = (summary || "").trim();
  if (!s) return { en: "", ar: "" };
  const idx = s.search(/[؀-ۿ]/);
  if (idx === -1) return { en: s, ar: "" };
  if (idx === 0) {
    const latinIdx = s.search(/[A-Za-z]/);
    if (latinIdx > 0) return { en: s.slice(latinIdx).trim(), ar: s.slice(0, latinIdx).trim() };
    return { en: "", ar: s };
  }
  return { en: s.slice(0, idx).trim(), ar: s.slice(idx).trim() };
}

function parseFreeform(summary, rawDescription) {
  const plain = stripHtmlToText(rawDescription);
  const paragraphs = splitParagraphs(plain);
  const enParas = [];
  const arParas = [];
  for (const p of paragraphs) {
    if (arabicRatio(p) > 0.5) arParas.push(p);
    else enParas.push(p);
  }
  const titleSplit = splitTitleByScript(summary);
  // No underlined-name convention to look for outside the structured
  // template — artist detection only ever runs on structured descriptions.
  return {
    en: { title: titleSplit.en, subtitle: "", body: enParas.join("\n\n"), artistName: "", artistBio: "" },
    ar: { title: titleSplit.ar, subtitle: "", body: arParas.join("\n\n"), artistName: "", artistBio: "" },
  };
}

// ---------------------------------------------------------------------------
// eventType inference (keyword match on the EN title only)
// ---------------------------------------------------------------------------

function inferEventType(title) {
  const t = (title || "").toLowerCase();
  const rules = [
    { kw: ["film", "screening"], type: "Film" },
    { kw: ["yoga", "class"], type: "Class" },
    { kw: ["workshop", "tatreez"], type: "Workshop" },
    { kw: ["radio"], type: "Radio" },
    { kw: ["opening"], type: "Opening" },
    { kw: ["performance", "concert", "live"], type: "Performance" },
    { kw: ["reading"], type: "Reading" },
    { kw: ["bar"], type: "Bar" },
  ];
  for (const r of rules) {
    if (r.kw.some((k) => t.includes(k))) return r.type;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Slug / _id helpers
// ---------------------------------------------------------------------------

function slugify(title) {
  let s = (title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip latin diacritics
    .replace(/[؀-ۿ]/g, "") // drop Arabic (title should be EN already)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  if (s.length > 60) {
    // Truncate at a hyphen boundary so we don't cut a word in half.
    const cut = s.slice(0, 60);
    const lastHyphen = cut.lastIndexOf("-");
    s = lastHyphen > 20 ? cut.slice(0, lastHyphen) : cut;
  }
  return s.replace(/-+$/g, "");
}

function dateSuffix(iso) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${MONTH_ABBR[+m[2] - 1]}-${String(+m[3])}`;
}

function buildDocId(title, iso, { recurring }) {
  const base = slugify(title) || "event";
  if (recurring) return base; // stable id, no date suffix — see README note in this file's header
  return `${base}-${dateSuffix(iso)}`;
}

// ---------------------------------------------------------------------------
// Title normalization / similarity (for the adoption pass)
// ---------------------------------------------------------------------------

function normalizeTitle(title) {
  return (title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(title) {
  return new Set(normalizeTitle(title).split(" ").filter(Boolean));
}

function titlesLikelyMatch(a, b) {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  if (!ta.size || !tb.size) return false;
  let intersection = 0;
  for (const tok of ta) if (tb.has(tok)) intersection++;
  const overlap = intersection / Math.min(ta.size, tb.size);
  return overlap > 0.6;
}

function calendarDate(iso) {
  return iso.slice(0, 10); // YYYY-MM-DD — datetimes are stored in Hebron wall-clock already
}

// ---------------------------------------------------------------------------
// Sanity HTTP API
// ---------------------------------------------------------------------------

async function sanityQuery(query) {
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.result;
}

async function sanityMutate(mutations) {
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/mutate/${DATASET}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ mutations }),
  });
  if (!res.ok) throw new Error(`Sanity mutate failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function fetchExistingEvents() {
  if (SANITY_SNAPSHOT) {
    const fs = await import("node:fs");
    return JSON.parse(fs.readFileSync(SANITY_SNAPSHOT, "utf8"));
  }
  return sanityQuery(
    '*[_type=="event"]{_id,title,slug,startDateTime,endDateTime,googleCalendarEventId,eventType,recurring,body,"relatedArtistRefs":relatedArtists[]._ref,calendarSyncTitleEn,calendarSyncTitleAr,calendarSyncBodyEn,calendarSyncBodyAr}'
  );
}

// Every artist doc's _id + English name, used to fuzzy-match a name parsed
// off the calendar against an existing artist before creating a new one.
async function fetchExistingArtists() {
  if (SANITY_SNAPSHOT) return []; // dry-run/local test path — no artist linking without live data
  const docs = await sanityQuery('*[_type=="artist"]{_id, "nameEn": name.en}');
  return (docs || []).map((d) => ({ _id: d._id, nameEn: d.nameEn || "" }));
}

function randomKey() {
  return Math.random().toString(36).slice(2, 10);
}

// Resolve a parsed artist name to a Sanity reference — reusing an existing
// artist (fuzzy match, same normalization as event-title adoption) if one
// exists, otherwise queuing a createIfNotExists for a new artist doc with
// the bio text that followed their underlined name. `existingArtists` and
// `mutations` are mutated in place so the same artist mentioned in two
// events later in this same run is only ever created once.
function resolveArtistRef(nameEn, bioEn, nameAr, bioAr, existingArtists, mutations, actions) {
  if (!nameEn) return null;
  const match = existingArtists.find((a) => titlesLikelyMatch(a.nameEn, nameEn));
  if (match) return { id: match._id, created: false };

  const id = `artist-${slugify(nameEn) || "unnamed"}`;
  const doc = {
    _id: id,
    _type: "artist",
    name: { _type: "localeString", en: nameEn, ar: nameAr || undefined },
    slug: { _type: "slug", current: slugify(nameEn) || id },
    bio: bioEn || bioAr ? { _type: "localeText", en: bioEn || undefined, ar: bioAr || undefined } : undefined,
  };
  for (const k of Object.keys(doc)) if (doc[k] === undefined) delete doc[k];

  mutations.push({ createIfNotExists: doc });
  existingArtists.push({ _id: id, nameEn });
  actions.push({ action: "CREATE-ARTIST", id, title: nameEn, date: "-", notes: "auto-detected from underlined name in calendar description" });
  return { id, created: true };
}

async function fetchExistingIssues() {
  // eventsAutoAssigned (a hidden schema field, not the events array itself)
  // is the sentinel for "have we ever auto-filled this doc's events list."
  // Using a dedicated flag instead of "is events empty?" means an editor can
  // remove events down to zero on purpose without the next sync run
  // silently re-populating it — see main()'s weekly-issue pass.
  const docs = await sanityQuery('*[_type=="weeklyIssue"]{_id, eventsAutoAssigned}');
  const byId = new Map();
  for (const d of docs || []) byId.set(d._id, !!d.eventsAutoAssigned);
  return byId;
}

async function fetchIcsText() {
  if (ICS_FILE) {
    const fs = await import("node:fs");
    return fs.readFileSync(ICS_FILE, "utf8");
  }
  const res = await fetch(ICS_URL);
  if (!res.ok) throw new Error(`ICS fetch failed: ${res.status}`);
  return res.text();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const now = new Date();
  const windowStart = addUtcDays(now, -WINDOW_PAST_DAYS);
  const windowEnd = addUtcDays(now, WINDOW_FUTURE_DAYS);

  console.log(`Wonder Cabinet calendar sync — ${DRY_RUN ? "DRY RUN" : "LIVE RUN"} — ${now.toISOString()}`);
  if (!DRY_RUN && !TOKEN) {
    console.error("SANITY_TOKEN is required for a live run (writes). Use --dry-run to test without it.");
    process.exit(1);
  }

  const icsText = await fetchIcsText();
  const rawEvents = parseVEvents(icsText);
  console.log(`Fetched ICS feed: ${rawEvents.length} VEVENT blocks.`);

  // Full set of every UID present in the raw feed (masters + one-offs +
  // cancelled + all-day), used for the "removed from calendar" check so we
  // never warn about events we intentionally skip (e.g. exhibitions).
  const allFeedUids = new Set();
  for (const ev of rawEvents) {
    if (ev.uid) allFeedUids.add(ev.uid.replace(/@google\.com$/i, ""));
  }

  const existingDocs = await fetchExistingEvents();
  const existingArtists = await fetchExistingArtists();
  const byGcalId = new Map();
  const adoptionCandidates = [];
  for (const doc of existingDocs) {
    if (doc.googleCalendarEventId) {
      byGcalId.set(doc.googleCalendarEventId, doc);
    } else if (doc.startDateTime) {
      adoptionCandidates.push(doc);
    }
  }

  const actions = []; // {action, id, title, date, notes}
  const mutations = [];
  const matchedDocIds = new Set(); // docs touched this run, for the "removed" pass

  for (const ev of rawEvents) {
    if (!ev.uid || !ev.dtstart) continue;
    if (ev.isOverrideInstance) {
      actions.push({ action: "SKIP", id: "-", title: ev.summary, date: "-", notes: "recurring exception/instance override (handled via master)" });
      continue;
    }
    if (ev.status === "CANCELLED") {
      actions.push({ action: "SKIP", id: "-", title: ev.summary, date: "-", notes: "status=CANCELLED" });
      continue;
    }
    if (ev.dtstart.isDateOnly) {
      actions.push({ action: "SKIP", id: "-", title: ev.summary, date: ev.dtstart.dateOnly, notes: "all-day/date-only (managed as project)" });
      continue;
    }

    const gcalId = ev.uid.replace(/@google\.com$/i, "");
    let startIso, endIso, isRecurring = false;

    if (ev.rrule) {
      isRecurring = true;
      const nextUtc = nextRecurrenceOccurrence(ev.dtstart.utc, ev.rrule, now);
      if (!nextUtc) {
        actions.push({ action: "SKIP", id: "-", title: ev.summary, date: "-", notes: "recurring series has no future occurrence (past UNTIL/COUNT)" });
        continue;
      }
      startIso = utcToHebronIso(nextUtc);
      if (ev.dtend) {
        const durationMs = ev.dtend.utc.getTime() - ev.dtstart.utc.getTime();
        endIso = utcToHebronIso(new Date(nextUtc.getTime() + durationMs));
      } else {
        endIso = null;
      }
    } else {
      if (ev.dtstart.utc < windowStart || ev.dtstart.utc > windowEnd) {
        actions.push({ action: "SKIP", id: "-", title: ev.summary, date: ev.dtstart.iso.slice(0, 10), notes: "outside sync window (-7d/+180d)" });
        continue;
      }
      startIso = ev.dtstart.iso;
      endIso = ev.dtend ? ev.dtend.iso : null;
    }

    // --- parse title/body (structured template, else free-form fallback) ---
    let parsed = parseStructuredDescription(ev.description);
    let usedFallback = false;
    if (!parsed || !parsed.en.title) {
      parsed = parseFreeform(ev.summary, ev.description);
      usedFallback = true;
    }
    const enTitle = (parsed.en.title || ev.summary || "").trim();
    const arTitle = (parsed.ar.title || "").trim();
    const enBody = (parsed.en.body || "").trim();
    const arBody = (parsed.ar.body || "").trim();
    const artistNameEn = (parsed.en.artistName || "").trim();
    const artistBioEn = (parsed.en.artistBio || "").trim();
    const artistNameAr = (parsed.ar.artistName || "").trim();
    const artistBioAr = (parsed.ar.artistBio || "").trim();
    const registerUrl = extractRegisterUrl(ev.description);
    const eventType = inferEventType(enTitle);

    // Resolve (link existing, or create) the artist mentioned via an
    // underlined name in the description, if any. Shared by both the
    // patch and create branches below.
    const artistRef = resolveArtistRef(artistNameEn, artistBioEn, artistNameAr, artistBioAr, existingArtists, mutations, actions);

    // --- matching: (1) gcal id, (2) adoption by date + title similarity ---
    let doc = byGcalId.get(gcalId);
    let adopted = false;
    if (!doc) {
      const dateKey = calendarDate(startIso);
      const candidateIdx = adoptionCandidates.findIndex(
        (c) => c.startDateTime && calendarDate(c.startDateTime) === dateKey && titlesLikelyMatch(c.title?.en, enTitle)
      );
      if (candidateIdx !== -1) {
        doc = adoptionCandidates[candidateIdx];
        adopted = true;
        adoptionCandidates.splice(candidateIdx, 1); // don't adopt the same doc twice in one run
      }
    }

    if (doc) {
      matchedDocIds.add(doc._id);
      const patch = {};
      if (doc.startDateTime !== startIso) patch.startDateTime = startIso;
      if (endIso && doc.endDateTime !== endIso) patch.endDateTime = endIso;
      if (adopted) patch.googleCalendarEventId = gcalId;

      // Keep title / description in sync with the calendar — but only ever
      // apply a change to a field an editor hasn't touched since the last
      // sync. calendarSyncTitleEn/Ar/BodyEn/Ar (hidden) hold the calendar
      // value as of the last run; if the Studio field still matches that
      // baseline, nothing's been hand-edited and it's safe to advance it.
      // If it doesn't match, an editor changed it in Studio since — leave
      // it alone (this is the fix for a real incident: a hand-edited title
      // sitting in Studio got silently reverted back to the calendar's
      // version on the next hourly run, because there was no way to tell
      // "calendar changed" apart from "editor changed it independently").
      // The baseline itself always advances to the calendar's current value
      // regardless, so a legacy doc (no baseline yet) starts being tracked
      // from its current Studio value — never retroactively overwritten —
      // and a hand-edit doesn't get flagged as "different" forever.
      // Skipped entirely on a fresh adoption this run: adoption matches by
      // *similar*, not identical, title on purpose, so the existing title
      // is almost certainly a deliberately hand-edited version already.
      function syncField(currentValue, calendarValue, baselineField, setPath) {
        if (!calendarValue) return;
        const hasBaseline = doc[baselineField] != null;
        // No baseline yet (a doc from before this feature existed) — treat
        // as "unknown editing history", NOT "untouched". The alternative
        // (defaulting baseline to currentValue, which trivially always
        // equals itself) would mean the very first run after this ships
        // treats every legacy doc as safe to overwrite, which is exactly
        // backwards: it's the one case where we have zero information
        // about whether Studio has since diverged from the calendar.
        const baseline = hasBaseline ? doc[baselineField] : currentValue;
        const untouchedSinceLastSync = hasBaseline && currentValue === baseline;
        if (untouchedSinceLastSync && currentValue !== calendarValue) patch[setPath] = calendarValue;
        if (baseline !== calendarValue) patch[baselineField] = calendarValue;
      }
      if (!adopted) {
        syncField(doc.title?.en, enTitle, "calendarSyncTitleEn", "title.en");
        syncField(doc.title?.ar, arTitle, "calendarSyncTitleAr", "title.ar");
        syncField(doc.body?.en, enBody, "calendarSyncBodyEn", "body.en");
        syncField(doc.body?.ar, arBody, "calendarSyncBodyAr", "body.ar");
      }

      // Newly-detected artist: append-only (never remove/replace whatever's
      // already linked), and only if this exact artist isn't linked yet —
      // keeps repeated runs idempotent instead of piling up duplicate refs.
      const needsArtistLink = artistRef && !(doc.relatedArtistRefs || []).includes(artistRef.id);

      if (Object.keys(patch).length || needsArtistLink) {
        const patchBody = { id: doc._id };
        if (Object.keys(patch).length) patchBody.set = patch;
        if (needsArtistLink) {
          patchBody.setIfMissing = { relatedArtists: [] };
          patchBody.insert = { after: "relatedArtists[-1]", items: [{ _type: "reference", _ref: artistRef.id, _key: randomKey() }] };
        }
        mutations.push({ patch: patchBody });
        const changedFields = [...Object.keys(patch), ...(needsArtistLink ? ["relatedArtists"] : [])];
        actions.push({
          action: adopted ? "ADOPT+PATCH" : "PATCH",
          id: doc._id,
          title: enTitle,
          date: startIso.slice(0, 10),
          notes: adopted
            ? `matched existing doc by date+title, set googleCalendarEventId=${gcalId}${patch.startDateTime ? "; dates updated" : ""}`
            : `changed → ${changedFields.join(", ")}`,
        });
      } else {
        actions.push({ action: "OK", id: doc._id, title: enTitle, date: startIso.slice(0, 10), notes: "matched, no changes needed" });
      }
      continue;
    }

    // --- create new doc ---
    const docId = buildDocId(enTitle, startIso, { recurring: isRecurring });
    const doc2 = {
      _id: docId,
      _type: "event",
      title: { _type: "localeString", en: enTitle, ar: parsed.ar.title || undefined },
      slug: { _type: "slug", current: docId },
      subtitle: parsed.en.subtitle || parsed.ar.subtitle
        ? { _type: "localeString", en: parsed.en.subtitle || undefined, ar: parsed.ar.subtitle || undefined }
        : undefined,
      eventType,
      startDateTime: startIso,
      endDateTime: endIso || undefined,
      recurring: isRecurring || undefined,
      registerUrl: registerUrl || undefined,
      body: enBody || arBody
        ? { _type: "localeText", en: enBody || undefined, ar: arBody || undefined }
        : undefined,
      relatedArtists: artistRef ? [{ _type: "reference", _ref: artistRef.id, _key: randomKey() }] : undefined,
      googleCalendarEventId: gcalId,
      // Baseline for future runs' hand-edit detection (see the patch branch
      // above) — what the calendar said at creation time.
      calendarSyncTitleEn: enTitle || undefined,
      calendarSyncTitleAr: arTitle || undefined,
      calendarSyncBodyEn: enBody || undefined,
      calendarSyncBodyAr: arBody || undefined,
    };
    // Strip undefined keys (createIfNotExists payload should be clean).
    for (const k of Object.keys(doc2)) if (doc2[k] === undefined) delete doc2[k];

    mutations.push({ createIfNotExists: doc2 });
    actions.push({
      action: "CREATE",
      id: docId,
      title: enTitle,
      date: startIso.slice(0, 10),
      notes: `${isRecurring ? "recurring master; " : ""}${usedFallback ? "free-form description" : "structured template"}`,
    });
  }

  // --- "removed from calendar" pass ---
  for (const doc of existingDocs) {
    if (!doc.googleCalendarEventId) continue;
    if (matchedDocIds.has(doc._id)) continue;
    if (!doc.startDateTime) continue;
    if (isoToUtcDate(doc.startDateTime) <= now) continue; // only warn for future events
    if (allFeedUids.has(doc.googleCalendarEventId)) continue; // present in feed, just not synced this run (shouldn't normally happen)
    actions.push({
      action: "WARNING",
      id: doc._id,
      title: doc.title?.en || "(untitled)",
      date: doc.startDateTime.slice(0, 10),
      notes: `googleCalendarEventId "${doc.googleCalendarEventId}" no longer found in the feed — event may have been deleted/cancelled on the calendar. NOT auto-deleting.`,
    });
  }

  // --- weekly-issue auto-creation pass ---
  // Ensure this week's and next week's `weeklyIssue` doc shell exists so an
  // editor always has somewhere in Studio to type the theme title/description
  // ahead of (or during) the week — see studio/schemas/weeklyIssue.ts. The
  // `events` reference array is auto-filled once (with everything scheduled
  // that week, by start date) so an editor sees a ready-made, editable list
  // in Studio and can just delete the ones they want excluded — rather than
  // hand-picking a whole week's events from scratch. `eventsAutoAssigned`
  // marks that the one-time fill has happened; later runs never touch
  // `events` again once that's set, so removals (even down to zero) stick.
  const existingIssues = await fetchExistingIssues(); // Map<issueId, eventsAutoAssigned>
  const thisWeek = getHebronWeekBounds(now);
  const nextWeek = getHebronWeekBounds(new Date(thisWeek.mondayDate.getTime() + 7 * 86400000));
  for (const { weekStart, weekEnd } of [thisWeek, nextWeek]) {
    const issueId = `weekly-issue-${weekStart}`;
    const alreadyExists = existingIssues.has(issueId);
    const alreadyAutoAssigned = existingIssues.get(issueId) === true;

    if (alreadyExists && alreadyAutoAssigned) {
      actions.push({ action: "OK", id: issueId, title: "(weekly issue)", date: weekStart, notes: "already exists; events list already auto-assigned (editor-curated from here)" });
      continue;
    }

    // Events whose start date (Hebron wall-clock, same convention as
    // calendarDate() elsewhere in this file) falls within this Mon–Sun week.
    const weekEventIds = existingDocs
      .filter((d) => d.startDateTime && calendarDate(d.startDateTime) >= weekStart && calendarDate(d.startDateTime) <= weekEnd)
      .map((d) => d._id);
    const eventsField = weekEventIds.map((id) => ({ _type: "reference", _ref: id, _key: id }));

    if (!alreadyExists) {
      mutations.push({
        createIfNotExists: { _id: issueId, _type: "weeklyIssue", weekStart, weekEnd, events: eventsField, eventsAutoAssigned: true },
      });
      actions.push({ action: "CREATE", id: issueId, title: "(weekly issue)", date: weekStart, notes: `week ${weekStart} → ${weekEnd}; theme left blank for editor; auto-assigned ${weekEventIds.length} event(s)` });
    } else {
      // Doc exists (e.g. created before this feature shipped) but never had
      // its events auto-filled — patch it in now, once.
      mutations.push({
        patch: { id: issueId, set: { events: eventsField, eventsAutoAssigned: true } },
      });
      actions.push({ action: "PATCH", id: issueId, title: "(weekly issue)", date: weekStart, notes: `backfilled events list with ${weekEventIds.length} event(s) (one-time auto-assign)` });
    }
  }

  printTable(actions);

  const counts = actions.reduce((acc, a) => {
    acc[a.action] = (acc[a.action] || 0) + 1;
    return acc;
  }, {});
  console.log("\nSummary:", JSON.stringify(counts));

  if (DRY_RUN) {
    console.log(`\n(dry run — ${mutations.length} mutation(s) were planned but NOT sent)`);
    return;
  }

  if (mutations.length) {
    // Sanity caps mutation batch size generously; chunk defensively anyway.
    const CHUNK = 100;
    for (let i = 0; i < mutations.length; i += CHUNK) {
      await sanityMutate(mutations.slice(i, i + CHUNK));
    }
    console.log(`Applied ${mutations.length} mutation(s).`);
  } else {
    console.log("No mutations to apply.");
  }
}

function printTable(actions) {
  const cols = ["action", "id", "title", "date", "notes"];
  const widths = {
    action: 12,
    id: 42,
    title: 46,
    date: 10,
    notes: 60,
  };
  const truncate = (s, w) => {
    s = String(s ?? "");
    return s.length > w ? s.slice(0, w - 1) + "…" : s;
  };
  const pad = (s, w) => truncate(s, w).padEnd(w);
  console.log("\n" + cols.map((c) => pad(c.toUpperCase(), widths[c])).join(" | "));
  console.log(cols.map((c) => "-".repeat(widths[c])).join("-|-"));
  for (const a of actions) {
    console.log(cols.map((c) => pad(a[c], widths[c])).join(" | "));
  }
}

// CLI entry point. Guarded so this file can *also* be imported as a module
// (see api/calendar-webhook.mjs, which calls `main()` directly on each
// real-time push notification) without auto-running on import.
const isDirectRun = (() => {
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { main };
