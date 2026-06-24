# Brain — promoted lessons (read before any new work)

Standing rules proven on this project. Scarce by design: each one earned its place.
If a lesson stops being true, retire it in `lessons.md` (don't silently leave it).

## Environment & Hosting

**ENV-1 — The sandbox can't reach the outside web; the user is your eyes.**
Outbound requests to external hosts are blocked at the proxy (403): the Playwright
CDN, `*.github.io`, `*.netlify.app`, `assets.calendly.com`, and arbitrary reference
URLs all failed. You **cannot load the live site or fetch a reference/competitor URL**
from here. → Ask the user to verify live pages in their browser, and to **paste**
external content rather than expecting a fetch. Never retry a 403 policy denial.

**ENV-2 — Look for pre-installed tools before downloading.**
When the Playwright Chromium download was blocked, a usable Chromium already existed
at `/opt/pw-browsers/...`. Check the image first.

**ENV-3 — This repo's GitHub Actions token is read-only.**
Actions-based GitHub Pages enablement/deploy fails with *"Resource not accessible by
integration"* — even with `enablement: true`. Use hosting that needs **no write token**:
classic Pages "deploy from a branch" (`/docs`), or Netlify. Don't burn cycles trying to
make the Actions token work.

**ENV-4 — Live = `main` via Netlify; the working branch is `claude/amit-...`.**
Changes only go live after merging to `main`. **Never push to `main` without explicit,
per-change permission.** Develop and preview on the feature branch.

## Frontend & Design

**FE-1 — Content must start visible; animation is enhancement only.**
Scroll-reveal that defaults to `opacity:0` makes the page blank if JS fails. Always
ship a `<noscript>` fallback that forces content visible. A blank page is catastrophic;
this generalizes to any JS-gated content.

**FE-2 — Verify in the real runtime state, not a single static shot.**
A "blank hero" was a screenshot-timing artifact (reveal fires on scroll); desktop and
headless renders can mislead. Exercise the actual flow (scroll the page, click through
the quiz) before concluding a change works.

**FE-3 — Generated design recommendations are input, not orders.**
The design-system tool's top pick ("Liquid Glass" + pink, with a11y/perf warnings) was
wrong for an authoritative leadership brand. Override generated defaults when they clash
with brand, audience, accessibility, or performance.

**FE-4 — Scope a change to the exact viewport/element the user named.**
A global nav change unintentionally altered the mobile nav the user wanted untouched.
Confirm "all screens or just this one?" before applying a change globally; use media
queries to contain it.

**FE-5 — Multi-page only helps SEO if each page is individually optimized.**
Splitting a one-pager pays off only with unique per-page `<title>`/meta/canonical/OG +
JSON-LD structured data + `sitemap.xml`/`robots.txt`. Extract shared CSS/JS into one
file each so pages can't drift apart.

## Collaborating with this user

**COLLAB-1 — The user is non-technical.**
Give jargon-free, click-by-click, **one-step-at-a-time** instructions. State what an
action *does and doesn't* do (e.g. "merging won't break the live site"). Don't assume
they'll infer intermediate steps.

**COLLAB-2 — Resolve ambiguity with one focused question before building.**
One-word or vague asks ("Color", "menu bar", "reference this site") have cost a wrong
guess. Ask a single clarifying question (AskUserQuestion) first — a wrong assumption
wastes a whole build cycle.

**COLLAB-3 — Anchor on the literal task and constraints.**
Early on, a go-to-market plan was offered when the user wanted the site built. Build
exactly what's asked under the stated constraints; offer adjacent advice only if invited.

**COLLAB-4 — Replicating a reference means inheriting its full scope.**
The reference site contained an interactive assessment quiz, a contact form, a gold CTA,
and a newsletter — well beyond the agreed "5 pages," discovered piecemeal. Up front, ask
for the complete inventory (all pages **and** interactive features) before estimating scope.

## Process / loop hygiene

**PROC-1 — The delivery loop that worked: verify → preview → branch → approve → deploy.**
For every change: render and self-verify → show the user a preview screenshot →
commit to the feature branch → merge/deploy to `main` only on explicit approval.

**PROC-2 — Surface gaps; don't hide them.**
Flag any content you authored to fill a gap (e.g. the 3 invented quiz questions) and any
feature that only works once deployed (Netlify Forms), with its required setup step
(enable form notifications). Build graceful fallbacks for backend-dependent features so
local previews still behave.
