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
