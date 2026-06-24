# Traces — append-only

Atomic log of each cycle. Format: Outcome / Surprise / Lesson candidate. Never edit past entries.

---
C1 · Initial plan
Outcome: Gave a go-to-market/phasing plan; user redirected: "stick to building the website."
Surprise: User wanted the literal deliverable, not adjacent strategy advice.
Lesson candidate: Anchor on the user's stated task + constraints; don't pivot to neighbouring advice.

---
C2 · First build (ui-ux-pro-max skill)
Outcome: Generated design system recommended "Liquid Glass" + pink accent, flagged ⚠ a11y/perf. Built editorial navy/gold instead.
Surprise: The skill's top pick was wrong for an authoritative leadership brand and carried warnings.
Lesson candidate: Treat generated design recs as input, not orders; override on brand/a11y conflict.

---
C3 · First render
Outcome: Above-the-fold screenshot looked blank; full-page render was fine. Added <noscript> fallback.
Surprise: Blank shot was a capture-timing artifact (scroll-reveal opacity:0), but it exposed a real no-JS failure.
Lesson candidate: Content must start visible; verify by triggering real runtime state (scroll), not a single static shot.

---
C4 · Headless browser
Outcome: `npx playwright install chromium` blocked (cdn.playwright.dev 403). Found pre-installed Chromium at /opt/pw-browsers and used it.
Surprise: Download host blocked by egress proxy.
Lesson candidate: Check for pre-installed tooling before downloading; external hosts are often blocked.

---
C5 · GitHub Pages via Actions
Outcome: Workflow failed at "Configure Pages" — "Create Pages site failed: Resource not accessible by integration," even with enablement:true. Pivoted to classic branch deploy from /docs.
Surprise: The repo's Actions GITHUB_TOKEN is read-only; no workflow flag fixes it.
Lesson candidate: On this repo, Actions token is read-only → use no-token hosting (classic Pages /docs, Netlify).

---
C6 · Verifying live site
Outcome: Couldn't load github.io or netlify.app from sandbox (proxy 403). Relied on user to confirm in Safari.
Surprise: Even the user's own live URL is unreachable from here.
Lesson candidate: Can't load live/external URLs from sandbox; rely on the user to verify.

---
C7 · PR / merge explainer
Outcome: User (non-technical) asked what a PR is, what merging does, why delete a branch. Explained plainly, one concept at a time.
Surprise: none — consistent with earlier non-technical signals.
Lesson candidate: This user needs jargon-free, click-by-click, one-step-at-a-time guidance.

---
C8 · Navy re-theme + deploy
Outcome: Re-themed to navy/gold; deploy required main (Netlify deploys from main). Asked permission before each push to main.
Surprise: none.
Lesson candidate: Live = main via Netlify; never push main without explicit per-change permission.

---
C9 · Desktop menu bar
Outcome: Made nav a solid always-visible bar; applied globally; user then said "keep mobile as is." Re-scoped to ≥981px only.
Surprise: A global CSS change silently changed the mobile nav the user liked.
Lesson candidate: Scope changes to the viewport/element asked; confirm before going global.

---
C10 · Multi-page split "for SEO"
Outcome: Split one-pager into pages; extracted shared styles.css/script.js; added per-page title/meta/canonical/OG + JSON-LD + sitemap/robots.
Surprise: none.
Lesson candidate: Multi-page only helps SEO with unique per-page metadata + structured data; share CSS/JS once.

---
C11 · "Reference this site"
Outcome: Assumed "this site" = current site; user meant an external reference for content. Tried to fetch it → proxy 403. User pasted content page by page.
Surprise: Two-layer miss: ambiguous referent + unfetchable reference.
Lesson candidate: Clarify ambiguous references first; external fetch is blocked, so ask the user to paste content.

---
C12 · Reference scope grew
Outcome: Reference had an 8-Q Assessment quiz, a Consultation contact form, a gold Book Consultation button, essays+newsletter — beyond the agreed "5 pages." Built incrementally; flagged 3 self-authored quiz questions; used Netlify Forms with AJAX fallback.
Surprise: True scope only emerged as the user sent more screenshots.
Lesson candidate: When replicating a reference, its full contents are the scope — inventory pages + interactive features up front. Backend features (forms) need fallbacks + a "works only once deployed" note.

---
C13 · Verification artifacts
Outcome: A 2160px screenshot couldn't be re-read; some v-*.png got committed (gitignore only matched preview-*).
Surprise: none.
Lesson candidate: Keep verification shots ≤2000px/side; name throwaways with an ignored prefix and check git status before commit.

---
C14 · Deeper distillation (meta-cycle)
Outcome: Re-read all 13 traces looking across them for root causes rather than fixes. Found that ~5 of the costliest cycles share one root (unverified assumptions), and that the loop had only captured agent-execution tactics — not the human/brand model or the open unknowns.
Surprise: The single biggest lever wasn't any one fix; it was that distinct failures (blocked network, read-only token, render≠truth, ambiguous "this site", ballooning scope) were the *same mistake* wearing different costumes.
Lesson candidate: Distill to root causes (meta-principles) that subsume many tactical lessons; also distill the people and the unknowns, not just the work.
