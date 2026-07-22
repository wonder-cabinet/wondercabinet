// Shared helper: obtain a short-lived Google OAuth2 access token via the
// service-account JWT-Bearer flow (RFC 7523), using only Node's built-in
// `crypto` module — no googleapis/google-auth-library dependency, matching
// this repo's zero-dependency ethos (see scripts/calendar-sync.mjs).
//
// Requires the GOOGLE_SERVICE_ACCOUNT_KEY env var to contain the full JSON
// key contents for the `calendar-sync@...iam.gserviceaccount.com` service
// account (Vercel → Project → Settings → Environment Variables).
import { createSign } from "node:crypto";

function base64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function getGoogleAccessToken(scope) {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY env var is not set");
  const key = JSON.parse(raw);

  const nowSec = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: key.client_email,
    scope,
    aud: key.token_uri,
    iat: nowSec,
    exp: nowSec + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(key.private_key);
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch(key.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.access_token;
}
