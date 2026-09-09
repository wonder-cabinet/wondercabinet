// Manual "regenerate" endpoint, called from a Sanity Studio document action
// (studio/actions/generateSocialAssets.tsx) so an editor can generate or
// refresh an event's share image + A3 print poster on demand, instead of
// waiting for the auto-on-publish webhook (api/social-post-webhook.mjs).
//
// Deliberately different write behavior from the webhook: this only ever
// touches the shareImage / printPoster / generatedAt fields. If a socialPost
// doc already exists, its captions and status are left alone -- an editor
// may have hand-edited them, and a manual "regenerate images" click
// shouldn't silently stomp that text. (Regenerating captions is a
// separate, not-yet-built action -- see the comment in lib/social-content.mjs.)
//
// Auth: a shared secret, not a full user-auth system. Set the SAME value as
// STUDIO_GENERATE_TOKEN (Vercel project env, this function reads it) and
// SANITY_STUDIO_GENERATE_TOKEN (Studio env -- gets bundled into the Studio's
// client JS since it's prefixed SANITY_STUDIO_, so this is not secret from
// anyone who can open Studio's devtools; acceptable for a small in-house
// tool used only by the Wonder Cabinet team, not a public surface).
import { sanityQuery, sanityMutate, sanityUploadImage, sanityUploadFile } from "../lib/sanity-client.mjs";
import { renderShareImage } from "../lib/social-image.mjs";
import { renderPrintPosterPdf } from "../lib/social-print.mjs";

export const config = {
  maxDuration: 60, // poster render (satori + resvg + pdf-lib) can take a few seconds
};

const EVENT_PROJECTION = `{
  _id, _type, title, subtitle, eventType, startDateTime, endDateTime,
  "location": location->{name}, "slug": slug.current, shortDescription, body
}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = process.env.STUDIO_GENERATE_TOKEN;
  const auth = req.headers["authorization"];
  if (!token || auth !== `Bearer ${token}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { eventId } = req.body || {};
  if (!eventId || typeof eventId !== "string") {
    res.status(400).json({ error: "eventId is required" });
    return;
  }

  try {
    const doc = await sanityQuery(`*[_id==${JSON.stringify(eventId)}][0]${EVENT_PROJECTION}`);
    if (!doc || doc._type !== "event") {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const [imageBuffer, pdfBuffer] = await Promise.all([
      renderShareImage(doc),
      renderPrintPosterPdf(doc),
    ]);

    const [imageAsset, pdfAsset] = await Promise.all([
      sanityUploadImage(imageBuffer, `social-${doc._id}.png`),
      sanityUploadFile(pdfBuffer, `poster-${doc._id}.pdf`, "application/pdf"),
    ]);

    const socialPostId = `social-post-${doc._id}`;
    const existing = await sanityQuery(`*[_id==${JSON.stringify(socialPostId)}][0]{_id}`);

    if (existing) {
      await sanityMutate([
        {
          patch: {
            id: socialPostId,
            set: {
              shareImage: { _type: "image", asset: { _type: "reference", _ref: imageAsset._id } },
              printPoster: { _type: "file", asset: { _type: "reference", _ref: pdfAsset._id } },
              generatedAt: new Date().toISOString(),
            },
          },
        },
      ]);
    } else {
      const { buildSocialContent } = await import("../lib/social-content.mjs");
      const content = buildSocialContent(doc);
      await sanityMutate([
        {
          createIfNotExists: {
            _id: socialPostId,
            _type: "socialPost",
            event: { _type: "reference", _ref: doc._id },
            status: "Ready to send",
            shareImage: { _type: "image", asset: { _type: "reference", _ref: imageAsset._id } },
            printPoster: { _type: "file", asset: { _type: "reference", _ref: pdfAsset._id } },
            instagramCaption: { _type: "localeText", ...content.instagramCaption },
            whatsappMessage: { _type: "localeText", ...content.whatsappMessage },
            newsletterBlurb: { _type: "localeText", ...content.newsletterBlurb },
            generatedAt: new Date().toISOString(),
          },
        },
      ]);
    }

    res.status(200).json({ ok: true, socialPostId });
  } catch (err) {
    console.error("generate-social-assets: failed", err);
    res.status(500).json({ ok: false, error: String((err && err.message) || err) });
  }
}
