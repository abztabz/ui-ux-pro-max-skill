# Design — making it genuinely professional

## Brand-fit beats trend

- **Match the audience, not the showcase.** An authoritative/professional brand wants
  editorial restraint (a serious palette, classic type), not whatever a generator ranks
  first. Treat generated design recommendations as *input, not orders* — override anything
  that clashes with brand, audience, accessibility, or performance.
- **Define tokens once.** Colours, type, spacing, radii as CSS variables. Re-theming the
  whole site then becomes a handful of token edits, not a rewrite.
- **One accent, held consistently.** A single accent colour used the same way across every
  page reads as "designed system." Navy + a warm gold is a reliable, premium pairing for
  authority brands; pick the pairing that fits, then be disciplined about it.
- **One primary action per page.** Give the single most important CTA a distinct treatment
  (e.g. a gold button) so it pops; keep secondary actions subordinate.

## Layout & hierarchy

- **Credibility-first ordering.** For coaches / consultants / services, put trust signals
  (credentials, stats, testimonials, logos) high — before the pitch. People buy proof.
- **A repeated micro-pattern creates rhythm.** Reusing an `eyebrow → headline → lede` block
  at the top of every section/page makes a multi-page site feel cohesive.
- **Whitespace and a consistent container width** do more for "premium" than effects.
- **Progressive structure.** Ship a single strong scrolling page first; split into separate
  pages later when SEO or breadth justifies it. Don't over-architect before there's a reason.

## Copy

- **Copy is the moat.** Strong client copy ("a diagnosis, not a sales call") outperforms
  any visual flourish. Preserve it verbatim; never dilute sharp lines to fit a layout.
- **Design CTAs around the brand's sales philosophy** — low-pressure framing for a
  relationship-led brand, urgency for a transactional one.

## Conversion design

- **Lead capture is a design pattern.** Offer value first, ask second — e.g. a free
  assessment/quiz that returns a "profile" in exchange for an email. Style capture states
  (empty, loading, success, error), not just the form.
- **Think funnel, not pages.** Every page should route the visitor toward one capture point
  (book a call / take the assessment / subscribe / contact).

## Accessibility & robustness (non-negotiable)

- **Content must start visible.** Scroll-reveal and other animations are enhancement only;
  ship a `<noscript>` fallback so the page is never blank without JS.
- **Contrast ≥ 4.5:1**, visible focus states, semantic headings, real labels on inputs.
- **Respect `prefers-reduced-motion`.** Keep motion 150–300ms, meaningful, and skippable.
- **Scope visual changes to the breakpoint asked.** Confirm "all screens or just this one?"
  before applying a change globally; preserve states the owner has said they like.
- **Flag placeholder content.** Sample testimonials or a missing headshot quietly undercut a
  premium design — call them out rather than letting them ship as if real.

## Verify like a user
Check the design in its real runtime state and on real widths (375 / 768 / 1440), in
reduced-motion, and with JS off — not just one desktop screenshot.
