// Wonder Cabinet runs on Bethlehem time (Asia/Hebron), the same zone the
// website and Sanity use. Vercel servers run in UTC, so anything that reads
// getHours()/getDate() off a `new Date(isoString)` shows UTC wall-clock
// (2-3 hours early). bethlehemDate() returns a Date whose LOCAL getters
// (getHours, getDate, getDay, getMonth ...) read Bethlehem wall-clock time,
// whatever zone the server runs in.
export const BETHLEHEM_TZ = "Asia/Hebron";

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: BETHLEHEM_TZ,
  hourCycle: "h23",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
});

export function bethlehemDate(value) {
  if (value instanceof Date || typeof value === "number") return bethlehemDate(new Date(value).toISOString());
  const s = String(value);
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dateOnly) return new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]);
  const inst = new Date(s);
  if (Number.isNaN(inst.getTime())) return inst;
  const p = Object.fromEntries(fmt.formatToParts(inst).map((x) => [x.type, x.value]));
  return new Date(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
}

// True when the Bethlehem-local time of day isn't exactly 00:00
// (00:00 is how all-day / date-only events are stored).
export function hasLocalTime(value) {
  const d = bethlehemDate(value);
  return !!(d.getHours() || d.getMinutes());
}

// "YYYY-MM-DD" and "HH:MM" in Bethlehem time.
export function bethlehemDay(value) {
  const d = bethlehemDate(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function bethlehemHHMM(value) {
  const d = bethlehemDate(value);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
