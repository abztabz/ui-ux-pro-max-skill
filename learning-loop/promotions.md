# Promotion record

One line per promotion: what, why, which cycle(s) confirmed it.

- ENV-1 "Sandbox can't reach external web" — promoted; confirmed repeatedly (C4 playwright CDN, C6 github.io/netlify, C11 reference URL). Cost of relearning: high (wasted fetch/verify attempts).
- ENV-2 "Check pre-installed tooling first" — promoted on C4; high cost-of-relearning (unblocked all screenshots).
- ENV-3 "Repo Actions token is read-only → no-token hosting" — promoted; confirmed across 3 failed runs (C5). High severity (blocked launch until pivot).
- ENV-4 "Live=main; never push main without permission" — promoted; standing workflow constraint, exercised every deploy (C8+).
- FE-1 "Content starts visible; noscript fallback" — promoted on one occurrence (C3) under the high-severity exception: blank page is catastrophic and clearly generalizes.
- FE-2 "Verify in real runtime state" — promoted; pattern across C3 (blank-hero artifact) and C13 (render limits).
- FE-3 "Design recs are input, not orders" — promoted on C2; high cost-of-relearning (brand integrity).
- FE-4 "Scope changes to named viewport" — promoted on C9 under severity exception: it broke behaviour the user explicitly liked.
- FE-5 "Multi-page needs per-page SEO" — promoted on C10; high cost (the whole point of the split was SEO).
- COLLAB-1 "Non-technical user" — promoted; pattern across C5, C7, C8.
- COLLAB-2 "Clarify ambiguity first" — promoted; pattern across the "Color", menu-bar (C9), and reference (C11) asks.
- COLLAB-3 "Anchor on literal task" — promoted on C1 under severity exception: a full wrong-direction response.
- COLLAB-4 "Reference = full scope" — promoted; pattern across C11 and C12.
- PROC-1 "verify→preview→branch→approve→deploy" — promoted; the dominant successful pattern across C3–C12.
- PROC-2 "Surface gaps & deploy-only features" — promoted on C12 under severity exception: silent gaps erode trust.

Held (not promoted): PROC-3 (gitignore naming) and FE-6 (≤2000px screenshots) — single, low-cost occurrences; promote if they recur.
