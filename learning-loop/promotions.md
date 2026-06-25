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

## Added C15 (second-tier)
- PROC-4 "Reusable QA harness" — promoted; pattern across C3, C9, C12, C13.
- PROC-5 "Production-only features + post-deploy checklist" — promoted; pattern across C6, C12, and pending SEO indexing.
- PROC-6 "Incremental delivery / momentum" — promoted; pattern across C8, C9, C11, C12 (a habit hiding in plain sight).
- PROC-7 "Time-box environment fights" — promoted on C5 under the high-severity exception (the Actions/Pages dead-end cost several cycles).

Held (single occurrence, await cross-project confirmation): D-1..D-7 (design), S-1..S-4 (strategy), PROC-8 (capture in-flight), PROC-9 (checkpoint big turns). See lessons.md.

## Added C16
- ENV-5 "Skills are desktop/web/CLI only; not iOS" — promoted on one occurrence under the high-cost-of-relearning + verified-fact exception (checked official docs; clearly generalizes; easy to guess wrong otherwise).
- Held: PROC-10 (bulk scripted edits must handle all variants) — single occurrence, caught by the QA harness, low cost; promote if it recurs.

## Added C17
- ENV-6 "Netlify Identity is deprecated; hand-code a Function-based admin" — promoted on one occurrence under the verified-fact + high-cost exception (a built dead end). Instance of M-1: verify a third-party feature exists before designing around it.
