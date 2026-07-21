# Wonder Cabinet — Next Phase Plan
**Status: DRAFT for Ibrahim's review — do not execute until approved.**
Prepared 21 Jul 2026. Intended executor: Claude Sonnet 5 in this same repo/session setup.

---

## Context for the executor

Static site, no build step: `index.html` (homepage, all JS inline), `event.html` (event page, also used inside the in-grid reader iframe via `?embed=1`), `assets/app.css` (shared, cache-busted via `?v=N` — bump on every CSS change, in BOTH html files).

Deploy: `git push origin dev` (preview) → merge to `main` (production, wondercabinet.space via Vercel, ~35s to go live). Always verify on production after deploy, in **English AND Arabic** (`localStorage.removeItem('twc-lang')` + reload to test the default path), and be aware Safari is the owner's daily browser — it has burned us before (see Pitfalls).

Data: Sanity project `xdtj605l`, dataset `production`, fetched client-side with GROQ in `_boot()` (~line 1860 of index.html). Globals: `ALL` (events), `PROJECTS`, `RESIDENCIES`, `ARTISTS` (currently only artists linked to this week's events), `SETTINGS`.

---

## Workstream 1 — Redesign "Artists" section on the homepage

### Current state
`#gs-artists-section` (~line 90) is a dark band titled "Artists this week": a scroll-linked parallax marquee of plain text cards (name + discipline), links disabled, only shows artists tied to this week's events. Populated in `renderFeatured()` (~line 1790).

### Proposed redesign — TYPE ONLY, per Ibrahim's reference
Pure typography, no photos, no grid, no cards. Reference: big white grotesque caps stacked one name per line (like a festival poster lineup).

- Full-width section keeping the **current dark background** (`gs-dark`), small section label "Artists this week" / "فنانو هذا الأسبوع" at top in the existing section-head style.
- Below it, **each artist name on its own line**, centered, uppercase, HUGE — display scale comparable to the timeline month names / "CURRENT EXHIBITIONS" heading (viewport-relative, e.g. `clamp`-ed ~7–9vw, so 3–5 lines fill a screen). Tight leading, no rules between lines, no discipline text, no other chrome — just the stacked names.
- Line color: the site light color on the dark bg (match existing gs-dark section text). No hover inversion blocks; hover can simply switch the line to the highlight color (`--highlight`) or underline — executor picks the quieter one.
- Each name is a link to the artist's inner page (Workstream 2).
- Arabic: same treatment with Arabic names, RTL, centered — verify the display font renders Arabic at this scale acceptably; if the current stack has no proper Arabic display cut, keep Arabic at a slightly smaller clamp so it doesn't overflow.
- Long names must wrap gracefully on mobile (allow wrap within a line, keep the scale down to ~10vw single-column).
- Show **only artists with an event this week** (the existing `ARTISTS` derivation from `relatedArtists` already does exactly this — keep it).
- After the last name, one smaller link line: "All artists →" / "← جميع الفنانين", pointing to the all-artists index page (see Workstream 2, `artists.html`). Same type family, clearly subordinate to the giant names (roughly the section-label scale).
- Keep the section hidden if there are zero artists this week. Remove the artists marquee + its parallax transform (keep the projects marquee untouched).

### Data prerequisite
Artist docs currently only have `name` + `slug` (verified live: 14 artists). That's enough for this section — names only. The schema additions (photo/bio/discipline/links) are only needed for Workstream 2's inner pages. The all-artists fetch (`"artists": *[_type == "artist"] | order(name.en asc) { … }`) is needed for the `artists.html` index page, not for this homepage section.

### Acceptance
Stacked giant type renders in EN + AR on the dark background, matches the poster-lineup reference feel, shows this week's artists only, every name links to its artist page, "All artists →" link at the bottom goes to the index page, wraps cleanly on mobile, marquee/parallax for artists removed.

---

## Workstream 2 — Artist pages (index + inner)

### Approach
Two pages, both mirroring the proven event page pattern:
- **`artists.html`** — the all-artists index. Same giant stacked-type treatment as the homepage section (Workstream 1), but listing **every** artist from Sanity, alphabetical. Dark background full-page, small back-to-home affordance consistent with event.html. Each name links to its inner page. This is the target of the homepage section's "All artists →" link.
- **`artist.html?id=<slug>`** — the single-artist template (like `event.html?id=<slug>`). No per-artist files. OG tags populated client-side like event.html does.

### Page structure (reader-mode, same design system as event.html)
1. **Header block**: artist name EN/AR large (event-title scale), discipline line, photo right-aligned (EN) / left (AR) — flat rectangle, site rules, no rounding.
2. **Bio**: localized paragraphs from `bio`. Hidden if empty.
3. **Links**: plain list of external links (portfolio, IG…), leader-dot style like event.html's meta rows. Hidden if empty.
4. **Events**: reverse GROQ lookup `*[_type == "event" && references(^._id)]` — split into **Upcoming** (top, full rows) and **Past** (below, collapsed behind a "Past events (n)" toggle — same interaction as Workstream 3 uses for exhibition past events, build it once and share the pattern). Each row links to `event.html?id=…`.
5. Language toggle + close/back affordance consistent with event.html (back goes to `index.html#gs-artists-section`).

### Data & shipping order (decided)
Photos, bios, disciplines, and links all come **from Sanity** (extend the `artist` schema with `photo`, `discipline`, `bio` en/ar, `links` if not already defined). **Ship the pages before the content exists**: they go live name-only, every optional field hidden cleanly while empty (no broken images, no empty labels, no layout holes), and light up automatically as Ibrahim populates the studio. Do not block or stub-wait on content.

### Wiring
- Homepage artist names (WS1) link here.
- `event.html`: artist names in the meta/related section become links to their artist pages (they're currently plain text).
- No topbar/nav on the page (same as event.html).

### Acceptance
`artists.html` lists all artists in the giant-type treatment and links through; direct `artist.html` URL loads and renders for every artist slug; empty-field artists render cleanly; EN/AR both correct incl. RTL; event lists split upcoming/past with working toggle; linked from the homepage section, the index page, and event pages.

---

## Workstream 3 — Current Exhibitions: redesign + scroll-lock programme rail

This is the big one. Current state: `#cx-section` + `renderCurrentExhibitions()` (~line 766) renders a text card per exhibition with a flat "Programme" list of ALL related events (`programmeEvents`) — no poster, no past/upcoming split, normal scrolling.

### 3a. Layout (per exhibition, desktop EN)
- **Left half of the screen (50vw): the poster.** One full rectangle, no internal padding games: exhibition cover image full-bleed, with date range, "On view now" tag, title (large, over image or in a solid band — executor picks whichever reads better against the covers, keep the flat/2px-rule language, no gradients/rounding). Clicking the poster opens the **in-grid reader** (same mechanism as hero cards: iframe `event.html?id=<exhibition>&embed=1`, click-nudge → wheel-driven expansion, body scroll lock, Escape/✕/edge-scroll to close — reuse/adapt `_gsOpenReader`; the expansion axis here is the poster growing over the rail's half, so the geometry needs its own variant but the interaction grammar, wheel forwarding, and teardown/resync must match exactly, including `_gsHardReset` coverage and the post-close 520ms remeasure delay). The poster is **sticky** (`top:54px`, below the topbar) for the whole time its programme rail is scrolling — it IS the left wall of the section.
- **Right half (50vw): the programme rail.** Related events stacked vertically, **each row 35% of the viewport height** (`35vh`), so ~2.85 rows visible at once. Row content: date, type tag, title EN/AR, time — event-row typography, 2px rules between rows. Rows click to `event.html?id=…`.
- **Arabic (RTL): mirrored** — poster right, rail left. Text RTL as usual.
- **Mobile (≤700px)**: no scroll-lock, no sticky — poster as a full-width block, then the rows stacked normally (natural heights, not 35vh). Same as the hero's mobile simplification.

### 3b. Past hidden / upcoming visible
- Rail shows **upcoming events only** (event end ≥ today) by default, soonest first.
- After the last upcoming row, one collapsed toggle row: "Past events (n) ↓" / "الفعاليات السابقة (n)". Click expands the past rows **in place** (newest first) and the rail's scroll runway extends accordingly (see 3c — recompute the runway on toggle). Click again collapses.
- If an exhibition has no upcoming events, the rail shows just the toggle row (auto-expand it in that case — an empty rail next to a poster looks broken).

### 3c. Scroll behavior — the same "one timeline, always go through" rule as the hero
Requirement (Ibrahim's words, adapted): scrolling down, when the exhibitions section reaches the viewport it pins; continued scrolling flips down through the programme rows until the **last row** is fully seen, then the page resumes scrolling. Scrolling up from below: it pins again, flips back up through the rows to the first, then releases into the content above. Fully symmetric, both directions, no dead zones.

**Implementation — copy the hero's proven machinery, rotated to vertical.** Do NOT invent a new mechanism:
- Wrapper `.cx-outer` with JS-computed height = `(100vh - 54px) + railRunway`, where `railRunway = totalRailHeight - visibleRailHeight` (rows × 35vh minus what fits beside the poster). Inner `.cx-sticky{ position:sticky; top:54px; }`.
- `onScroll` maps `outer.getBoundingClientRect().top` → `progress ∈ [0, railRunway]` → `railTrack.style.transform = translateY(-progress)`. Viewport-relative math only (`getBoundingClientRect`), exactly like the hero — this is what makes it work at any page depth and in both directions.
- Reuse the hero's **catch-up pattern verbatim**: `currentProgress`, `SNAP_THRESHOLD` (180), 260ms eased catch-up animation for big jumps, plus the **watchdog timeout** that force-lands the target if rAF stalls (this bug actually happened; see Pitfalls). Factor these into one shared helper used by both hero and exhibitions rather than copy-pasting if clean, but do not destabilize the hero while doing so.
- Recompute runway on: resize, past-toggle expand/collapse, language switch.
- **Multiple exhibitions**: currently 1 on view. Build for N by stacking one pinned poster+rail unit per exhibition (each its own `.cx-outer`). Verify with a mocked second exhibition before shipping.
- Guard interactions with existing systems: the in-grid reader freeze (`gs-reader-open` early-return in this onScroll too), and the archive (`viewing-past` needs NO guard — the math is viewport-relative; adding guards there is what broke the hero last time).

### Acceptance
Poster+rail layout matches spec in EN and mirrored AR; rows are 35vh; down-scroll pins and flips through every row incl. the last before releasing; up-scroll symmetric; past hidden behind working toggle, runway adjusts; mobile stacks normally; hero, archive, reader, and programme sections all still behave (regression-test the full homepage scroll end-to-end after integration).

---

## Suggested execution order

1. **WS3** (exhibitions) — self-contained in index.html/app.css, highest visual impact, no schema dependency.
2. **WS2 schema+query prep** — extend GROQ + Sanity schema check, so Ibrahim can start populating artist content while pages are built.
3. **WS2** artist.html.
4. **WS1** homepage artists grid (depends on WS2 for link targets).

One commit + deploy + live verification per workstream. Bump `app.css?v=` once per workstream that touches CSS.

## Known pitfalls (all real, all already happened in this codebase)

- **Never** use `offsetLeft`/`offsetTop` inside `flex-direction:row-reverse` containers — Safari returns wrong values (caused the Arabic blank-page bug). Use `getBoundingClientRect()` deltas.
- **Never** early-return scroll handlers on `viewing-past` — the archive is part of one continuous timeline and the viewport-relative math already handles it. Guards there caused the archive/hero freeze.
- rAF can stall mid-animation (backgrounded/throttled tabs) — any scroll-driven animation needs the watchdog pattern from the hero's `onScroll`.
- After closing the in-grid reader, `setup()` measurements must wait for the 500ms shrink transition (the hero uses 520ms) or `scrollWidth` reads inflated.
- The reader sets `body{position:fixed}` — any new wheel/scroll listeners must respect `gs-reader-open` and the sliding cooldown pattern (`_gsReaderClosedAt`).
- Test the language-default path with `localStorage.removeItem('twc-lang')` — EN is the default now; saved prefs mask regressions.

## Open questions for Ibrahim (answer before execution)

1. **Poster title placement**: text over the cover image, or in a solid color band below/beside it? (Executor will mock both if unanswered.)

*(Resolved: homepage artists section = this week only, giant type, "All artists →" link to `artists.html`. Exhibition poster click = opens the in-grid reader like hero cards. Artist photos/bios = from Sanity, pages ship before content is populated.)*
