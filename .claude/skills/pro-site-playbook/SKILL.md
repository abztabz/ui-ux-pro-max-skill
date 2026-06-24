---
name: pro-site-playbook
description: >-
  Design, build, and ship a professional client website on a zero-budget,
  no-code-friendly stack — with the workflow discipline that prevents rework.
  Use whenever the user wants to build, design, or launch a website for a client,
  business, coach, consultant, portfolio, agency, or service; wants a marketing /
  landing / multi-page site; needs free hosting plus lead capture (contact forms,
  scheduling, an assessment/quiz, a newsletter); is replicating or matching a
  reference site; or asks how to take a site from idea to a live, shareable URL.
  Covers brand-fit design decisions, the preview-driven build loop, free hosting
  (Netlify / GitHub Pages), forms + scheduling, SEO for multi-page sites, and a
  pre-launch QA checklist. Distilled from real client builds.
---

# Pro Site Playbook

A field-tested method for taking a professional website from idea to a live,
credible URL — cheaply, quickly, and without the rework that usually eats these
projects. It encodes two things that are easy to get wrong: **design taste**
(making it look genuinely professional and on-brand) and **workflow discipline**
(shipping safely when you often can't directly observe the result and the client
can't read code).

Optimised for **zero-budget, no-code-friendly** builds (a non-technical owner,
free hosting), but the principles hold for any stack.

## When you're using this skill, place the request first

- **New build** — "Build a site for X", "make a landing page", "launch a website."
  → Run the full process below, starting at **Phase 0**.
- **A change to a live site** — "make it navy", "add a contact page." → Jump to the
  **build loop** (Probe → Build → Preview → Approve → Deploy). Don't re-architect.
- **Replicating a reference** — "make it like this site." → Read
  `references/workflow.md` § *Replicating a reference* first; inventory scope before building.
- **Hosting / launch trouble** — "why won't it deploy", "how do I put it online for free."
  → `references/stack.md`.

## The five operating principles (read these first)

These prevent the costliest failures. Everything else is detail.

1. **Probe before you build.** Most dead-ends are unverified assumptions — about the
   environment, your permissions, the meaning of a request, or the true scope. Spend
   one cheap check or one clarifying question *before* committing to a path. Verifying
   costs seconds; reworking costs the whole cycle.

2. **The preview is the shared truth.** You often can't see the deployed result, and a
   non-technical owner can't read code. The **rendered screenshot** is the one artifact
   you both can read — so make it the contract: render → show → agree → only then ship.

3. **Spend caution only at the irreversible boundary.** Editing, rendering, and committing
   to a working branch are cheap and reversible — move fast and unattended. Exactly one
   act is public and hard to undo: **deploying to production.** Require explicit human
   approval only there; never skip it there.

4. **Front-load discovery; deliver incrementally.** Surface intent, scope, brand, and
   constraints early — late discovery forces rework on finished work. Then ship in small,
   visible increments; momentum lets the client steer and compounds trust.

5. **Match the work to the people.** Design for the *audience and brand*, not the trend;
   communicate for the *owner* (non-technical ⇒ jargon-free, one decision at a time,
   preview before acting, flag limits and gaps honestly). Do the literal task asked.

## The build process

**Phase 0 — Discover (probe).** Confirm: who's the audience, what's the brand
(voice, colours, type), what's the single primary action (book? buy? subscribe?), the
budget, and the hosting target. If replicating a reference, inventory **every** page and
interactive feature up front. One round of questions here saves days. Use
`AskUserQuestion` for genuine forks; recommend a default.

**Phase 1 — Design system.** Pick a style that fits the *audience*, not what a generator
ranks first — override tool defaults that clash with brand, accessibility, or performance.
Lock tokens (colours, type, spacing) as CSS variables so re-theming is a one-place edit.
See `references/design.md`.

**Phase 2 — Build (the loop).** For each change:
Probe → Build → **Render & self-verify** → **Show the owner a screenshot** → Commit to a
working branch → Deploy to production only on approval. Scope each change to the exact
element/breakpoint asked; never let a global change silently alter something the owner liked.

**Phase 3 — Wire up capture.** Lead capture *is* the point of most client sites. Add the
funnel: contact form, scheduling, optional assessment/quiz, newsletter — all on free
services. See `references/stack.md`. Build graceful fallbacks; flag anything that only
works once deployed.

**Phase 4 — SEO & launch.** If multi-page, give each page unique title/meta/canonical/OG +
JSON-LD, and add `sitemap.xml` + `robots.txt`. Run the pre-launch checklist, deploy, and
hand the owner a **post-deploy checklist** (the things that only work in production).

## Design, in one breath

Credibility-first ordering · copy is the moat (preserve strong client copy verbatim) ·
one accent held consistently · content visible without JS · responsive + reduced-motion ·
a repeated micro-pattern (eyebrow → headline → lede) for rhythm · flag placeholder content.
Full detail in `references/design.md`.

## Pitfalls this skill exists to prevent

- Building on an **assumption** (network, permissions, the meaning of "this site", scope)
  instead of a 5-second probe.
- A **global change** that breaks something the owner liked (scope to the element/breakpoint).
- Treating a **static render as truth** — verify in the real runtime state (scroll, run the flow).
- Fighting a blocked environment too long — **time-box (~2 tries), then pivot** to the
  dependency-free path.
- Shipping **placeholder content** (sample testimonials, missing photo) as if it were real.
- Assuming production-only features (forms, indexing) work without a **post-deploy check**.

## References
- `references/workflow.md` — the build loop, replicating a reference, QA harness, the
  irreversible-boundary rule, and a pre-launch + post-deploy checklist.
- `references/design.md` — brand-fit, layout, accessibility, and conversion-design principles.
- `references/stack.md` — the zero-budget free-tool stack (hosting, forms, scheduling) and
  its known gotchas.
