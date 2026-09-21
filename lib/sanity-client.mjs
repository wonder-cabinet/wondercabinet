// Minimal, dependency-free Sanity HTTP client used by the webhook/watch
// endpoints under /api. Deliberately kept separate from
// scripts/calendar-sync.mjs's own copy of these same two functions, so the
// webhook plumbing doesn't entangle with the calendar-sync internals.
const PROJECT_ID = "xdtj605l";
const DATASET = "production";
const API_VERSION = "v2024-01-01";

// Both generate-*.mjs endpoints are called via fetch() directly from the
// Sanity Studio's own browser tab (studio/actions/*.tsx), which runs on a
// different origin (the hosted Studio, e.g. wonder-cabinet.sanity.studio)
// than this API (www.wondercabinet.space). A POST with an Authorization
// header triggers a CORS preflight (OPTIONS) that the browser sends before
// the real request -- without these headers the preflight gets rejected
// and the browser never even sends the POST, which surfaces to the editor
// as an opaque "Load failed" / "Failed to fetch" with no server-side error
// to look at (found 2026-09-21: neither endpoint had ever actually
// completed a real Studio-triggered call before this). `*` is fine here
// since the actual gate is the shared-secret Bearer token, not cookies/
// credentialed CORS.
export function applyCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true; // caller should return immediately
  }
  return false;
}

export async function sanityQuery(query) {
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.result;
}

export async function sanityMutate(mutations) {
  const token = process.env.SANITY_TOKEN;
  if (!token) throw new Error("SANITY_TOKEN env var is not set");
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/mutate/${DATASET}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mutations }),
  });
  if (!res.ok) throw new Error(`Sanity mutate failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Uploads a binary image and returns its asset document (so the caller can
// reference asset._id from a subsequent mutation). Separate from
// sanityMutate because asset uploads go through Sanity's dedicated Assets
// HTTP API, not the regular mutate endpoint.
export async function sanityUploadImage(buffer, filename) {
  const token = process.env.SANITY_TOKEN;
  if (!token) throw new Error("SANITY_TOKEN env var is not set");
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/assets/images/${DATASET}?filename=${encodeURIComponent(filename)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "image/png",
      Authorization: `Bearer ${token}`,
    },
    body: buffer,
  });
  if (!res.ok) throw new Error(`Sanity image upload failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.document; // { _id, _type: 'sanity.imageAsset', ... }
}

// Uploads a non-image binary (e.g. a print-poster PDF) and returns its
// asset document. Sanity's Assets HTTP API has a separate endpoint for
// generic files vs. images (sanityUploadImage above).
export async function sanityUploadFile(buffer, filename, contentType) {
  const token = process.env.SANITY_TOKEN;
  if (!token) throw new Error("SANITY_TOKEN env var is not set");
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/assets/files/${DATASET}?filename=${encodeURIComponent(filename)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      Authorization: `Bearer ${token}`,
    },
    body: buffer,
  });
  if (!res.ok) throw new Error(`Sanity file upload failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.document; // { _id, _type: 'sanity.fileAsset', ... }
}
