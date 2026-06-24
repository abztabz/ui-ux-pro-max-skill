# Open questions — the Verify ledger

What we *believe* but haven't *confirmed*, and decisions still pending. The Verify stage
exists so unverified assumptions don't masquerade as facts. Close these on future cycles;
move confirmed items into facts and resolved items out.

## Unverified (we assume it works; never confirmed live)
- **Netlify Forms actually capture submissions?** The forms post via AJAX, but no real
  submission has been verified in the Netlify dashboard, and **email notifications are not
  enabled**. Until tested live, lead capture is an assumption, not a fact. → Do a test
  submit, confirm it lands, enable Form notifications.
- **The assessment "personalised Leadership Profile" — does anyone receive it?** Today it
  only *captures* name/email/answers; there is no scoring or auto-email. Is manual
  follow-up the intent, or is automated scoring expected later?
- **SEO is actually indexing?** Per-page metadata, JSON-LD, and `sitemap.xml` exist, but
  the sitemap has **not** been submitted to Google Search Console — so indexing is
  unconfirmed. The whole "for SEO" rationale is untested until then.
- **Forms detection on deploy.** Netlify only registers forms it finds in static HTML at
  build. The fields exist statically, so it *should* work — but unverified.

## Decisions pending (the user to choose)
- **The 3 self-authored quiz questions** (Systems, Culture, Leadership) still need the
  exact reference versions — user said "revise later."
- **The 5 books** were dropped from Insights (reference uses essays). Separate Books page,
  fold back in, or leave out?
- **CTA model is split:** the gold "Book Consultation" → the contact page; in-page
  "Begin/Request a Consultation" → the Calendly popup. Intentional, or unify?
- **Insights essays are non-clickable cards** — no article pages exist. Real articles later?
- **Custom domain** (e.g. `amitshrestha.com`) — discussed, parked at $0.

## Known gaps (acknowledged, not yet addressed)
- Footer label drift was reconciled, but a full cross-page consistency pass hasn't been
  re-verified after the latest content swaps.
- Testimonials are still the original sample names (Dr. Sunita / Rajan / Priya), not
  confirmed-real quotes.
- No photo of Amit anywhere on the site yet.
