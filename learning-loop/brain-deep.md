# Brain — deep layer (meta-principles)

The tactical lessons in `brain.md` are *symptoms*. These five meta-principles are the
*root causes* — each one explains a whole cluster of the tactical lessons and would have
pre-empted them. Read these first; they transfer to any project, not just this one.

---

## M-1 — Assumption is the root failure mode. Probe before you build.
**Subsumes:** ENV-1, ENV-2, ENV-3, FE-2, COLLAB-2, COLLAB-4.

Five of the costliest cycles were the *same* mistake in different costumes: I assumed
network access (C4), assumed a writable token (C5), assumed a static render equalled
runtime truth (C3), assumed "this site" meant the obvious site (C11), and assumed the
scope was what was first stated (C12). Each assumption turned into a multi-step dead-end.

The counter-practice is cheap: before committing to a path, run the smallest possible
probe of **environment, permission, and intent** — a `curl`/status check, a dry-run, or
one clarifying question. A 5-second probe routinely prevents a 5-tool-call reversal.
**The cost asymmetry is enormous: verifying is seconds; reworking is the whole cycle.**

## M-2 — Observability is clipped at both ends; the preview is the shared truth.
**Subsumes:** ENV-1, ENV-4, PROC-1, COLLAB-1.

Two independent blind spots defined this project: *I* can't see the deployed site (egress
blocked), and the *user* can't read code. Neither party can independently confirm the
work is right. The only artifact we both can read is the **rendered screenshot** — so it
became the contract. Render → show → agree → only then deploy.

Generalizes: when two collaborators have disjoint observability, find the **narrowest
representation both can read** and route every decision through it. Don't argue in a
language only one side speaks (code for them; the live URL for me).

## M-3 — Spend caution only at the irreversible boundary.
**Subsumes:** ENV-4, PROC-1, the branch/PR discipline.

Almost everything here was cheap and reversible: edit, render, commit to a feature
branch. Exactly **one** action was effectively irreversible and public — deploying to
`main` (Netlify auto-publishes; the user shares the link). The working model that emerged:
move fast and unattended everywhere reversible; require explicit human approval **only**
at that one boundary. Asking permission for cheap things is friction; skipping it at the
irreversible boundary is recklessness. Know which boundary you're at.

## M-4 — Late discovery compounds; front-load intent, scope, and constraints.
**Subsumes:** C1, C11, C12, COLLAB-3, COLLAB-4.

The expensive surprises were *discovery arriving mid-build*: the real task (build, not
strategize), the real meaning of "reference," the real scope (a quiz + forms + newsletter,
not "5 pages"). Each forced rework on top of finished work. So **Capture must also capture
what we don't yet know**, and a cycle should open by closing its biggest unknown — not by
building the most obvious piece. Cheapest question first, most-obvious code later.

## M-5 — Distill the people, not just the work.
**Subsumes:** COLLAB-1, COLLAB-2, COLLAB-3, and all of `user-profile.md`.

The most reusable knowledge isn't "add a `<noscript>` tag." It's a durable model of *who
you're building with and for*: a non-technical, design-led owner who iterates by feeding
content in chunks and judges by look-and-feel — building for a brand (Amit) that is
authoritative, systems-led, navy-and-gold, "a diagnosis, not a sales call." That profile
pre-loads dozens of micro-decisions every future cycle (tone of explanations, default
aesthetic, how to present choices). A work-only brain forgets the most leveraged context.

---

## If you keep only three
**M-1, M-2, M-3.** They guard the three costliest failure classes: dead-end rabbit holes
(assumption), talking past each other (observability), and irreversible mistakes
(boundary). M-4 and M-5 make the loop faster and warmer; M-1–M-3 keep it from breaking.

## A note on the loop's own depth
The first distillation pass produced only agent-execution tactics. "Learn deeper" exposed
that the loop had **three missing dimensions**: root-cause synthesis (this file), a model
of the humans (`user-profile.md`), and an honest ledger of what's still unverified
(`open-questions.md`). A loop that logs only fixes will keep relearning *why* the fixes
were needed. Distill causes, people, and unknowns — not just fixes.
