# Lessons log — candidates & status

Status: `promoted` (in brain.md) · `held` (not yet proven / low value) · `retired`.

| ID | Lesson (general principle) | From | Occurrences | Status |
|----|----------------------------|------|-------------|--------|
| ENV-1 | Sandbox egress blocks external hosts (playwright CDN, *.github.io, *.netlify.app, calendly assets, reference URLs); can't load live/external pages. Rely on user to verify/paste; never retry a 403. | C4,C6,C11 | 6+ | **promoted** |
| ENV-2 | Check for pre-installed tooling before downloading. | C4 | 1 | **promoted** (high cost-of-relearning) |
| ENV-3 | This repo's Actions GITHUB_TOKEN is read-only → use no-token hosting (classic Pages /docs, Netlify). | C5 | 3 (runs) | **promoted** |
| ENV-4 | Live deploys from `main` via Netlify; never push main without explicit per-change permission. | C8 | every deploy | **promoted** |
| FE-1 | Content starts visible; animation is enhancement only; ship a `<noscript>` fallback. | C3 | 1 | **promoted** (high severity) |
| FE-2 | Verify UI in real runtime state (scroll/flow); static & desktop renders mislead. | C3,C13 | 2 | **promoted** |
| FE-3 | Generated design recs are input, not orders — override on brand/a11y conflict. | C2 | 1 | **promoted** (high cost) |
| FE-4 | Scope visual changes to the named viewport/element; confirm before global. | C9 | 1 | **promoted** (high severity — broke liked behaviour) |
| FE-5 | Multi-page helps SEO only with unique per-page metadata + JSON-LD + sitemap; share CSS/JS once. | C10 | 1 | **promoted** (high cost) |
| COLLAB-1 | Non-technical user: jargon-free, click-by-click, one step at a time; say what an action does & doesn't do. | C7,C5,C8 | 3+ | **promoted** |
| COLLAB-2 | Ambiguous request → one focused clarifying question before building. | C9,C11,(Color) | 3 | **promoted** |
| COLLAB-3 | Anchor on the literal task + constraints; don't drift to adjacent advice. | C1 | 1 | **promoted** (high severity early-miss) |
| COLLAB-4 | Replicating a reference = inherit its full scope; inventory pages + features up front. | C11,C12 | 2 | **promoted** |
| PROC-1 | Per change: render+verify → show preview → commit to feature branch → main only on approval. | C3–C12 | many | **promoted** |
| PROC-2 | Flag self-authored gap-fill content + features that only work once deployed (+ setup step); build fallbacks. | C12 | 1 | **promoted** (high severity — silent gaps) |
| PROC-3 | Name throwaway artifacts with an ignored prefix; check `git status` before commit. | C13 | 1 | held |
| FE-6 | Keep verification screenshots ≤2000px/side so they're re-readable. | C13 | 1 | held (tooling quirk, low cost) |

## Second-tier candidates (added C15)

Promoted (confirmed by ≥2 occurrences this project, or high-severity-obvious):

| ID | Lesson (general principle) | From | Occurrences | Status |
|----|----------------------------|------|-------------|--------|
| PROC-4 | Build a reusable QA harness (scripted screenshots + JSON-LD/link validation), not one-off manual checks. | C3,C9,C12,C13 | 4 | **promoted** |
| PROC-5 | Some features only work in production (Netlify Forms) or need a follow-up action (sitemap→Search Console, enable notifications). Ship a post-deploy checklist. | C6,C12 + SEO | 3 | **promoted** |
| PROC-6 | Deliver incrementally — small visible wins let the client steer and compound trust; ship-and-iterate over big-bang. | C8,C9,C11,C12 | 4 | **promoted** |
| PROC-7 | Time-box environment fights (≈2 tries) then pivot to the dependency-free path. | C5 | 1 | **promoted** (high severity — wasted cycles) |

Held (single occurrence — promote when a future project confirms the pattern):

| ID | Lesson (general principle) | From | Status |
|----|----------------------------|------|--------|
| D-1 | Copy is the moat — preserve strong client copy verbatim; don't dilute it to fit a layout. | C12 | held |
| D-2 | Lead capture is a design pattern — design value-first (free profile ⇄ email), ask second. | C12 | held |
| D-3 | Credibility-first ordering — trust signals (credentials, stats, testimonials) go high for service/coach brands. | C2,C12 | held |
| D-4 | Design CTAs around the brand's sales philosophy (low-pressure: "a diagnosis, not a sales call"). | C12 | held |
| D-5 | A repeated micro-pattern (eyebrow→headline→lede) creates cross-page rhythm and reads as "system." | C10,C12 | held |
| D-6 | Placeholder content (sample testimonials, missing headshot) silently undercuts a premium design — flag it. | C12 | held |
| D-7 | Progressive structure — ship one page first, split into pages later for SEO/scale; don't over-architect early. | C10 | held |
| S-1 | Compose free services into a real product (host+forms+scheduling+quiz) under a zero-budget constraint. | C5,C12 | held |
| S-2 | Think in a funnel, not pages — design routes visitors to a capture point (assessment/newsletter/contact/Calendly). | C12 | held |
| S-3 | "Minimum credible launch" beats "complete" — get a real link live early, then iterate. | C6,C8 | held |
| S-4 | Keep internal identifiers (model IDs, session internals) out of commits and page source. | standing | held |
| PROC-8 | Capture traces in-flight, not retrospectively — the "surprise" fades fast. | C14 | held |
| PROC-9 | Checkpoint/commit more often on large multi-file turns to ease rollback and review. | C12 | held |

## Added C16

| ID | Lesson | From | Occurrences | Status |
|----|--------|------|-------------|--------|
| ENV-5 | Custom skills run on desktop/web/CLI, never the Claude iOS app (monitoring only). Cross-device = user-scope plugin install (`~/.claude`); repo-committed skills auto-load in web sessions on that repo. | C16 | 1 | **promoted** (high cost-of-relearning; verified fact) |
| PROC-10 | Bulk scripted edits across near-identical files must handle every variant (e.g. the active-state element) and assert per-file change counts. | C16 | 1 | held |
