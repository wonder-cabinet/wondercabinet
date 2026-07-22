// Real-time Google Calendar → Sanity sync trigger.
//
// Google calls this endpoint (registered via /api/setup-watch) whenever
// something on the "WONDER CABINET PUBLIC" calendar changes. We verify the
// shared channel token, then simply re-run the same sync logic used by the
// manual/CLI path (scripts/calendar-sync.mjs's `main`) — it always
// re-fetches the full ICS feed and reconciles from scratch, so there's no
// separate "process this one change" code path to maintain.
import { main as runCalendarSync } from "../scripts/calendar-sync.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const channelToken = req.headers["x-goog-channel-token"];
  if (!process.env.WEBHOOK_TOKEN || channelToken !== process.env.WEBHOOK_TOKEN) {
    res.status(401).json({ error: "Invalid channel token" });
    return;
  }

  const resourceState = req.headers["x-goog-resource-state"];
  console.log(`calendar-webhook: resourceState=${resourceState}`);

  // The initial "sync" notification just confirms the channel was created —
  // nothing has actually changed yet, so there's nothing to sync.
  if (resourceState === "sync") {
    res.status(200).json({ ok: true, note: "sync handshake acknowledged" });
    return;
  }

  try {
    await runCalendarSync();
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("calendar-webhook: sync failed", err);
    // Still respond 200 so Google doesn't retry-storm us over a transient
    // Sanity/ICS hiccup — the next real calendar change (or the daily
    // renew-watch cron re-registering the channel) gives us another chance.
    // Errors are visible in Vercel's function logs either way.
    res.status(200).json({ ok: false, error: String((err && err.message) || err) });
  }
}
