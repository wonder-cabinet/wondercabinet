// One-time (or manual re-run) endpoint to register a Google Calendar push
// notification channel for the "WONDER CABINET PUBLIC" calendar, pointed at
// /api/calendar-webhook. Protected by CRON_SECRET so randoms on the internet
// can't spin up watch channels against our calendar.
//
// Usage: GET https://www.wondercabinet.space/api/setup-watch?secret=<CRON_SECRET>
//
// The resulting channel (channelId/resourceId/expiration) is stored in a
// Sanity singleton doc (`calendarWebhookState`, not part of the editorial
// schema — just internal state) so /api/renew-watch knows what to renew
// before it expires. See /api/calendar-webhook for the receiving end.
import { getGoogleAccessToken } from "../lib/google-auth.mjs";
import { sanityMutate } from "../lib/sanity-client.mjs";
import { randomUUID } from "node:crypto";

// Same calendar as scripts/calendar-sync.mjs's public ICS feed, expressed as
// a Calendar API calendarId (the ICS URL embeds this exact id, "c_...@group.calendar.google.com").
const CALENDAR_ID = "c_869ed25e6012728063fdfceaca41691722afc92fa977221ef092fe1b38b744f8@group.calendar.google.com";
const WEBHOOK_URL = "https://www.wondercabinet.space/api/calendar-webhook";

export default async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.query.secret !== process.env.CRON_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const result = await registerWatch();
    res.status(200).json(result);
  } catch (err) {
    console.error("setup-watch failed", err);
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}

export async function registerWatch() {
  if (!process.env.WEBHOOK_TOKEN) throw new Error("WEBHOOK_TOKEN env var is not set");

  const accessToken = await getGoogleAccessToken("https://www.googleapis.com/auth/calendar.readonly");
  const channelId = randomUUID();

  const watchRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events/watch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: WEBHOOK_URL,
        token: process.env.WEBHOOK_TOKEN,
      }),
    }
  );
  const watchJson = await watchRes.json();
  if (!watchRes.ok) {
    throw new Error(`events.watch failed: ${watchRes.status} ${JSON.stringify(watchJson)}`);
  }

  await sanityMutate([
    {
      createOrReplace: {
        _id: "calendarWebhookState",
        _type: "calendarWebhookState",
        channelId,
        resourceId: watchJson.resourceId,
        expiration: watchJson.expiration,
        calendarId: CALENDAR_ID,
        registeredAt: new Date().toISOString(),
      },
    },
  ]);

  return { channelId, resourceId: watchJson.resourceId, expiration: watchJson.expiration };
}
