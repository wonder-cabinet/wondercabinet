// Periodic renewal of the Google Calendar push notification channel before
// it expires (Calendar API watch channels are time-limited — typically on
// the order of a week). Runs daily via the `crons` entry in vercel.json.
//
// Best-effort stops the old channel, then registers a fresh one via
// registerWatch() (shared with /api/setup-watch), updating the
// `calendarWebhookState` Sanity doc either way.
import { getGoogleAccessToken } from "../lib/google-auth.mjs";
import { sanityQuery } from "../lib/sanity-client.mjs";
import { registerWatch } from "./setup-watch.mjs";

const RENEW_BUFFER_MS = 24 * 60 * 60 * 1000; // renew if expiring within 24h

export default async function handler(req, res) {
  // Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>`
  // when the CRON_SECRET env var is set on the project — this rejects any
  // other caller. (Manually hitting the URL also works if you have the secret.)
  const auth = req.headers["authorization"];
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const state = await sanityQuery('*[_id=="calendarWebhookState"][0]');
    const expiresAt = state && state.expiration ? Number(state.expiration) : 0;
    const dueForRenewal = !state || Date.now() > expiresAt - RENEW_BUFFER_MS;

    if (!dueForRenewal) {
      res.status(200).json({ ok: true, renewed: false, expiration: state.expiration });
      return;
    }

    if (state && state.channelId && state.resourceId) {
      try {
        const accessToken = await getGoogleAccessToken("https://www.googleapis.com/auth/calendar.readonly");
        await fetch("https://www.googleapis.com/calendar/v3/channels/stop", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ id: state.channelId, resourceId: state.resourceId }),
        });
      } catch (err) {
        console.warn("renew-watch: failed to stop old channel (continuing anyway)", err);
      }
    }

    const result = await registerWatch();
    res.status(200).json({ ok: true, renewed: true, ...result });
  } catch (err) {
    console.error("renew-watch failed", err);
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}
