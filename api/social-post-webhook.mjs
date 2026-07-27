// Sanity → "ready-to-send" social content generator.
//
// Configured as a Sanity webhook (Project → API → Webhooks) firing on the
// `event` document type, published documents only. Sanity POSTs the
// projected event fields here every time an event is created or updated;
// we generate an Instagram caption, WhatsApp message, newsletter blurb, and
// a branded share image, then create a `socialPost` doc (see
// studio/schemas/socialPost.ts) so an editor can review and send it by hand
// from Studio. Nothing here posts to any external platform automatically —
// see that schema file's comment for why (deliberately a review step, and
// Instagram/WhatsApp's real posting APIs need Business-account setup this
// project doesn't have yet).
//
// Only ever generates ONCE per event: if a socialPost already exists for
// this event's _id, later edits to the event are ignored here, the same
// "auto-fill once, then it's the editor's to curate" rule already used by
// scripts/calendar-sync.mjs's weeklyIssue pass — otherwise every small edit
// to an event (fixing a typo, adding a cover image) would silently
// regenerate and stomp on a caption someone already hand-edited.
import { createHmac, timingSafeEqual } from "node:crypto";
import { sanityQuery, sanityMutate, sanityUploadImage } from "../lib/sanity-client.mjs";
import { buildSocialContent } from "../lib/social-content.mjs";
import { renderShareImage } from "../lib/social-image.mjs";

export const config = {
  api: { bodyParser: false }, // need the raw body to verify Sanity's HMAC signature
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

// Sanity's webhook signature scheme: header `sanity-webhook-signature` looks
// like "t=<unix ms>,v1=<base64url hmac>". The signed message is
// "<timestamp>.<raw body>", HMAC-SHA256 with the webhook secret, base64url
// encoded (Sanity's own docs recipe — see @sanity/webhook's isValidSignature
// for the reference implementation this mirrors).
function isValidSignature(rawBody, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=")));
  const { t, v1 } = parts;
  if (!t || !v1) return false;
  const expected = createHmac("sha256", secret)
    .update(`${t}.${rawBody}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const a = Buffer.from(v1);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawBody = await readRawBody(req);

  if (process.env.SANITY_WEBHOOK_SECRET) {
    const sig = req.headers["sanity-webhook-signature"];
    if (!isValidSignature(rawBody, sig, process.env.SANITY_WEBHOOK_SECRET)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
  }

  let doc;
  try {
    doc = JSON.parse(rawBody);
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  if (!doc || doc._type !== "event" || !doc._id) {
    // Not an event, or the projection didn't include what we need —
    // acknowledge so Sanity doesn't retry, there's nothing to do.
    res.status(200).json({ ok: true, note: "not an event doc, skipped" });
    return;
  }

  try {
    const existing = await sanityQuery(
      `*[_type=="socialPost" && event._ref==${JSON.stringify(doc._id)}][0]{_id}`
    );
    if (existing) {
      res.status(200).json({ ok: true, note: "socialPost already exists for this event, skipped" });
      return;
    }

    const content = buildSocialContent(doc);
    const imageBuffer = await renderShareImage(doc);
    const asset = await sanityUploadImage(imageBuffer, `social-${doc._id}.png`);

    const socialPostId = `social-post-${doc._id}`;
    await sanityMutate([
      {
        createIfNotExists: {
          _id: socialPostId,
          _type: "socialPost",
          event: { _type: "reference", _ref: doc._id },
          status: "Ready to send",
          shareImage: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
          instagramCaption: { _type: "localeText", ...content.instagramCaption },
          whatsappMessage: { _type: "localeText", ...content.whatsappMessage },
          newsletterBlurb: { _type: "localeText", ...content.newsletterBlurb },
          generatedAt: new Date().toISOString(),
        },
      },
    ]);

    res.status(200).json({ ok: true, socialPostId });
  } catch (err) {
    console.error("social-post-webhook: failed", err);
    // 200 anyway — same reasoning as calendar-webhook: don't let a
    // transient failure trigger a Sanity retry-storm. Errors are visible in
    // Vercel's function logs.
    res.status(200).json({ ok: false, error: String((err && err.message) || err) });
  }
}
