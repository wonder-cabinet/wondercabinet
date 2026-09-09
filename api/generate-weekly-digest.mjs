// Manual "generate weekly digest" endpoint, called from a Sanity Studio
// document action (studio/actions/generateWeeklyDigest.tsx) on a
// weeklyIssue document. Renders the three digest slides (cover/EN/AR,
// lib/social-weekly.mjs — a faithful rebuild of the Figma
// "Weekly -Sep-WKxx" reference frames driven by that week's real events)
// plus a combined A3 print PDF, and writes them onto the weeklyIssue doc
// itself (digestCoverImage / digestEnImage / digestArImage / digestPdf /
// digestGeneratedAt) — additive, separate from the per-event
// generate-social-assets.mjs pipeline.
//
// Auth: same shared-secret pattern as generate-social-assets.mjs — reuses
// STUDIO_GENERATE_TOKEN / SANITY_STUDIO_GENERATE_TOKEN, no need for a
// second token pair.
import { sanityQuery, sanityMutate, sanityUploadImage, sanityUploadFile } from "../lib/sanity-client.mjs";
import { renderWeeklyCoverPng, renderWeeklyEnPng, renderWeeklyArPng, renderWeeklyDigestPdf } from "../lib/social-weekly.mjs";

export const config = {
  maxDuration: 60,
};

const EVENT_FIELDS = `{title, eventType, startDateTime, endDateTime, "location": location->{name}, shortDescription}`;
const WEEKLY_PROJECTION = `{
  _id, _type, weekStart, weekEnd,
  "events": events[]->${EVENT_FIELDS},
  "secondaryEvents": secondaryEvents[]->${EVENT_FIELDS}
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

  const { weeklyIssueId } = req.body || {};
  if (!weeklyIssueId || typeof weeklyIssueId !== "string") {
    res.status(400).json({ error: "weeklyIssueId is required" });
    return;
  }

  try {
    const doc = await sanityQuery(`*[_id==${JSON.stringify(weeklyIssueId)}][0]${WEEKLY_PROJECTION}`);
    if (!doc || doc._type !== "weeklyIssue") {
      res.status(404).json({ error: "Weekly issue not found" });
      return;
    }
    if (!doc.weekStart) {
      res.status(400).json({ error: "This weekly issue has no Week start date set" });
      return;
    }

    const [coverBuf, enBuf, arBuf, pdfBuf] = await Promise.all([
      renderWeeklyCoverPng(doc),
      renderWeeklyEnPng(doc),
      renderWeeklyArPng(doc),
      renderWeeklyDigestPdf(doc),
    ]);

    const [coverAsset, enAsset, arAsset, pdfAsset] = await Promise.all([
      sanityUploadImage(coverBuf, `weekly-${doc._id}-cover.png`),
      sanityUploadImage(enBuf, `weekly-${doc._id}-en.png`),
      sanityUploadImage(arBuf, `weekly-${doc._id}-ar.png`),
      sanityUploadFile(pdfBuf, `weekly-${doc._id}-a3.pdf`, "application/pdf"),
    ]);

    await sanityMutate([
      {
        patch: {
          id: doc._id,
          set: {
            digestCoverImage: { _type: "image", asset: { _type: "reference", _ref: coverAsset._id } },
            digestEnImage: { _type: "image", asset: { _type: "reference", _ref: enAsset._id } },
            digestArImage: { _type: "image", asset: { _type: "reference", _ref: arAsset._id } },
            digestPdf: { _type: "file", asset: { _type: "reference", _ref: pdfAsset._id } },
            digestGeneratedAt: new Date().toISOString(),
          },
        },
      },
    ]);

    res.status(200).json({ ok: true, weeklyIssueId: doc._id });
  } catch (err) {
    console.error("generate-weekly-digest: failed", err);
    res.status(500).json({ ok: false, error: String((err && err.message) || err) });
  }
}
