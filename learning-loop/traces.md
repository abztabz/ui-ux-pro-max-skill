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

---
C15 · Second-tier distillation (design / workflow / strategy)
Outcome: Surfaced ~18 additional learnings across design, workflow, and product-strategy. Promoted 4 workflow lessons confirmed by ≥2 occurrences this project (QA harness, production-only features, incremental delivery, time-box dead-ends); filed the rest as held candidates pending cross-project confirmation.
Surprise: Several "soft" process habits (incremental shipping, scripted verification) were actually used in many cycles — they were patterns hiding in plain sight, not one-offs.
Lesson candidate: Re-scan finished work for recurring habits you never named; recurring behaviour is a promotable pattern even when no single trace flagged it.

---
C16 · Events page + iOS skill-distribution verification
Outcome: Built an Events page (schedule pattern, sample events flagged for replacement; QA harness clean). Verified via official docs that the Claude iOS app cannot run custom skills/slash-commands (monitoring only); user-scope plugin install (~/.claude) persists across desktop + web; a repo-committed skill auto-loads in web sessions on that repo.
Surprise: (1) The iOS app has no skill/plugin support at all — a hard platform limit, not a config gap. (2) A bulk scripted nav-edit across 8 files silently skipped insights.html's active-variant link (the regex didn't cover the active class format) — the QA harness caught it.
Lesson candidate (significant): Custom skills are desktop/web/CLI only; iOS can't invoke them. Cross-device availability = user-scope plugin install; repo-committed skills auto-load in web sessions on that repo. (Minor): bulk scripted edits across near-identical files must handle every variant and assert per-file change counts.

---
C17 · Hand-coded CMS (Netlify Identity is gone)
Outcome: Built a Decap+Netlify-Identity admin; on setup the user's Netlify dashboard had NO Identity option — Netlify retired Identity for new sites. Pivoted to a hand-coded CMS: a password-protected /admin editor + a Netlify Function that commits the content JSON via the GitHub API (token in an env var). Editor logs in with just a password — no GitHub/Identity account.
Surprise: The long-standard "free static-site CMS login" (Netlify Identity) simply doesn't exist for new sites anymore; designing around it was a dead end.
Lesson candidate (significant): Don't assume a third-party feature still exists — verify before designing around it. Netlify Identity is deprecated for new sites; for a no-account free editor login, hand-code a Netlify Function (password + GitHub API commit, or Netlify Blobs).

---
C18 · CMS env-var setup with a non-technical owner
Outcome: Walked the owner through Netlify env vars (ADMIN_PASSWORD, GITHUB_TOKEN). Stumbles: key/value swapped on first try; "Server not configured" (a var empty/unscoped) vs "Incorrect password" (value mismatch) are distinct failures; the password mismatch surfaced only on Save because login was client-side only — owner got in, then lost the edit.
Surprise: A login that never checks the password hides a credential mismatch until the first write, which reads as "it deleted my work."
Lesson candidate (significant): For a secret checked server-side, verify it at login too (call the backend with a lightweight verify action) so wrong credentials fail fast and visibly. Return per-variable "which one is missing" errors, not one generic message.

---
C19 · Secret leaked in chat
Outcome: Owner pasted their real GitHub PAT into the conversation. Advised immediate revoke + regenerate; reiterated the token lives only in the host's env var, never in chat or committed code.
Surprise: none — but a genuine exposure.
Lesson candidate: Never solicit secrets in chat; if one is pasted, treat it as compromised, have the user revoke/rotate at once, and keep secrets only in host env vars.

---
C20 · Extending the hand-coded CMS (images, SEO, whole-site text)
Outcome: Added image upload (browser-side resize/compress → function commits the file to the repo), a per-page SEO tab (title/description/keywords/alt/schema, applied client-side only when non-empty), per-page dropdowns for Page Text and SEO, and made nearly all page copy editable via a `data-edit` attribute seeded from pages.json.
Surprise: Client-side-applied SEO is fine for Google (it renders JS) but social-link scrapers read raw HTML — so the baked-in tags must stay as the fallback.
Lesson candidate: One `data-edit` attribute + a JSON store scales to whole-site editability; seed every key from the current HTML so a blank field never overwrites, and apply overrides only when non-empty so built-in defaults survive.

---
C21 · Whole-site editability via scripted, self-validating edits
Outcome: Wired 150+ editable fields across six pages with a Python script doing exact-string matches (assert each match is unique, write nothing if any miss) instead of dozens of hand edits.
Surprise: Exact-match-or-abort turns transcription into validation — a typo fails loudly rather than silently corrupting a file.
Lesson candidate: For large repetitive edits, drive them from a script that requires one unique match per change and refuses to write on any miss.

---
C22 · JS-array content needs a different path than data-edit
Outcome: The assessment quiz lived in a JS `QUESTIONS` array, unreachable by DOM-text editing. Moved it to quiz.json, loaded at runtime with the inline array kept as fallback, and exposed it as a list collection (its own admin tab).
Surprise: none.
Lesson candidate: Content rendered from a JS array can't be edited via DOM attributes; externalize it to JSON (with an inline fallback so it can never be blank) and edit it as a list.

---
C23 · DNS: owner landed on Netlify DNS, not the records method
Outcome: Guided GoDaddy A/CNAME records, but the owner switched nameservers to Netlify DNS ("using custom nameservers"). That is Netlify's recommended path and works automatically; the manual records become moot. Confirmed by reading the actual nameservers rather than assuming.
Surprise: The non-technical owner took the "Use Netlify DNS" option mid-flow, which looked alarming ("custom nameservers") but was correct.
Lesson candidate: When DNS "looks wrong," read the actual nameservers before judging. Netlify-DNS (nameservers) and external-DNS (A/CNAME at the registrar) are both valid and mutually exclusive — don't mix the two sets of instructions.

---
C24 · Free-tier deploy budget is exhaustible — and silently froze the site
Outcome: Many small commits each auto-deployed; the Netlify free team "ran out of credits," disabling production deploys and warning the live site could go offline. Recent fixes never went live — the login fix appeared to "log in no matter what" because the new code had never deployed. Chose Cloudflare Pages (more generous free tier, supports the function); ported the backend to a Pages Function (onRequestPost, env bindings, Workers-safe base64) and pointed /admin at /save-content.
Surprise: The symptom ("wrong password still works") was a stale deploy, not a code bug — a platform quota masquerading as a logic error.
Lesson candidate (significant): Free hosting has a build/deploy budget; rapid iterative auto-deploys can exhaust it and freeze the site on old code. Batch deploys to conserve it, and when "my latest fix isn't taking effect," confirm the deploy actually shipped before debugging the code. Note: Netlify Forms are Netlify-only — changing hosts breaks form capture, so plan a replacement (e.g. a Pages Function or a free form service) as part of any migration.
