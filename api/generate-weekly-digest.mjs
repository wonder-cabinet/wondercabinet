// Manual "generate weekly digest" endpoint, called from a Sanity Studio
// document action (studio/actions/generateWeeklyDigest.tsx) on a
// weeklyIssue document. Renders the three digest slides (cover/EN/AR) plus
// a combined EN-over-AR A3 print PDF using lib/weekly-digest-render.mjs (a
// real SVG/HTML rebuild -- see lib/weekly-digest/weekly-svg.mjs for why --
// replacing the old satori-based lib/social-weekly.mjs), and writes them
// onto the weeklyIssue doc itself (digestCoverImage / digestEnImage /
// digestArImage / digestPdf / digestGeneratedAt) -- additive, separate
// from the per-event generate-social-assets.mjs pipeline.
//
// Auth: same shared-secret pattern as generate-social-assets.mjs -- reuses
// STUDIO_GENERATE_TOKEN / SANITY_STUDIO_GENERATE_TOKEN, no need for a
// second token pair.
import { sanityQuery, sanityMutate, sanityUploadImage, sanityUploadFile, applyCors } from "../lib/sanity-client.mjs";
import {
  sanityDocToWeekly,
  renderWeeklyCoverPng,
  renderWeeklyEnPng,
  renderWeeklyArPng,
  renderWeeklyDigestPdfCombined,
  DEFAULT_THEME,
  PRINT_THEME,
} from "../lib/weekly-digest-render.mjs";

export const config = {
  maxDuration: 60,
};

const EVENT_FIELDS = `{title, eventType, startDateTime, endDateTime, "location": location->{name}, shortDescription}`;
// digestThemeBg/digestThemeFg are @sanity/color-input "color" fields (an
// object with hex/hsl/rgb/alpha) now that the Studio has a real color-swatch
// picker for them -- pull out just the hex string here so the rest of this
// file (and lib/weekly-digest-render.mjs) can keep treating theme.bg/fg as
// plain hex strings.
const WEEKLY_PROJECTION = `{
  _id, _type, weekStart, weekEnd,
  "digestThemeBg": digestThemeBg.hex, "digestThemeFg": digestThemeFg.hex,
  "events": events[]->${EVENT_FIELDS}
}`;

// Every successful generation "uses" its theme pair for real, so this
// records it on a small singleton document (digestColorHistory) that the
// Studio's color-picker component (DigestThemeTools.tsx) reads to offer
// one-click reuse of past weeks' pairs -- an auto-growing preset list
// instead of a fixed one someone has to maintain by hand. Most-recent-first,
// deduped, capped so it doesn't grow forever. Never lets a hiccup here fail
// the actual digest generation, which has already succeeded by this point.
async function registerColorPair(bg, fg) {
  try {
    const existing = await sanityQuery(`*[_id == "digestColorHistory"][0]{pairs}`);
    const pairs = (existing && existing.pairs) || [];
    const filtered = pairs.filter((p) => !(p.bg === bg && p.fg === fg));
    const next = [{ _key: `pair-${Date.now()}`, bg, fg }, ...filtered].slice(0, 16);
    await sanityMutate([
      { createIfNotExists: { _id: "digestColorHistory", _type: "digestColorHistory", pairs: [] } },
      { patch: { id: "digestColorHistory", set: { pairs: next } } },
    ]);
  } catch (err) {
    console.error("registerColorPair: failed (non-fatal)", err);
  }
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
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

    const weekly = sanityDocToWeekly(doc);
    if (weekly.totalCount === 0) {
      res.status(400).json({ error: "This weekly issue has no Highlighted events to put in the digest" });
      return;
    }

    const theme = {
      bg: doc.digestThemeBg || DEFAULT_THEME.bg,
      fg: doc.digestThemeFg || DEFAULT_THEME.fg,
    };

    const [coverBuf, enBuf, arBuf, pdfBuf] = await Promise.all([
      renderWeeklyCoverPng(weekly, theme),
      renderWeeklyEnPng(weekly, theme),
      renderWeeklyArPng(weekly, theme),
      renderWeeklyDigestPdfCombined(weekly, PRINT_THEME),
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

    await registerColorPair(theme.bg, theme.fg);

    res.status(200).json({
      ok: true,
      weeklyIssueId: doc._id,
      eventCount: weekly.totalCount,
      missingArCount: weekly.missingArCount,
    });
  } catch (err) {
    console.error("generate-weekly-digest: failed", err);
    res.status(500).json({ ok: false, error: String((err && err.message) || err) });
  }
}
