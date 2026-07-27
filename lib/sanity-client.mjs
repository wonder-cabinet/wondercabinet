// Minimal, dependency-free Sanity HTTP client used by the webhook/watch
// endpoints under /api. Deliberately kept separate from
// scripts/calendar-sync.mjs's own copy of these same two functions, so the
// webhook plumbing doesn't entangle with the calendar-sync internals.
const PROJECT_ID = "xdtj605l";
const DATASET = "production";
const API_VERSION = "v2024-01-01";

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
