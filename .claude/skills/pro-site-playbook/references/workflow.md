# Workflow — the build loop, scope control, and launch

## The build loop (every change goes through it)

```
Probe → Build → Render & self-verify → Show owner a screenshot → Commit (working branch)
      → Deploy to production ONLY on explicit approval
```

- **Probe.** Before building, close the biggest unknown: environment capability, your
  permissions, the meaning of the request, the true scope. A cheap check or one question.
- **Build.** Make the change. Scope it to the **exact element/breakpoint** named — use
  media queries to contain visual changes; never let "make the desktop nav solid" silently
  change the mobile nav.
- **Render & self-verify.** Don't trust a single static screenshot — exercise the real
  runtime state (scroll the page, run the interactive flow, test at 375 / 768 / 1440,
  reduced-motion, and with JS disabled). Desktop/headless/above-the-fold renders mislead.
- **Show the owner.** The screenshot is the contract. A non-technical owner approves by
  *seeing*, not by reading code. Send the preview; get a yes.
- **Commit** to a working/feature branch with a descriptive message. This is your free
  staging environment.
- **Deploy** to production only with explicit, per-change permission (see boundary rule).

## The irreversible-boundary rule

Classify every action as **reversible** (edit, render, commit to a branch — move fast,
unattended) or **irreversible/public** (deploy to production, send to a third party,
post publicly — require explicit human approval). Don't burn the owner's attention asking
about cheap things; never skip approval at the irreversible boundary.

## Replicating a reference site

1. **Inventory first.** Get the *complete* list of pages **and** interactive features
   (quizzes, forms, scheduling, newsletter, special buttons) before estimating or building.
   Scope discovered piecemeal causes rework.
2. **You may not be able to fetch it** (sandboxes often block outbound web). Ask the owner
   to **paste the content** page by page, and to send screenshots of any interactive piece.
3. **Reproduce structure and content faithfully**, but keep your own clean implementation
   (shared stylesheet/script, tokens). Match the look; don't copy brittle markup.
4. **Flag anything you author to fill a gap** (e.g. quiz questions you invented because the
   reference only showed some) so the owner can replace them.

## A reusable QA harness

Make verification a repeatable script, not manual eyeballing. For a static site:
- Headless-render each page (and any interactive flow) to screenshots.
- Validate: exactly one `<h1>`, a `<title>`, a canonical tag, and **valid JSON-LD** per page.
- Check every internal link resolves to a real file.
- Confirm no console/page errors during the interactive flow.
Re-run after every change. (Look for a **pre-installed** headless browser before downloading
one — downloads are often blocked.)

## Pre-launch checklist

- [ ] Responsive at 375 / 768 / 1024 / 1440; no horizontal scroll on mobile.
- [ ] Content visible with JavaScript disabled (`<noscript>` fallback for animations).
- [ ] Contrast ≥ 4.5:1; visible focus states; reduced-motion respected.
- [ ] One `<h1>`, unique `<title>` + meta description, canonical, OG tags per page.
- [ ] `sitemap.xml` + `robots.txt` present (multi-page).
- [ ] All nav, footer, and CTA links resolve; active page highlighted.
- [ ] No placeholder content shipped as real (sample testimonials, missing photo) — or it's
      flagged to the owner.
- [ ] Primary action (book / buy / subscribe) works end-to-end.

## Post-deploy checklist (hand this to the owner)

Some things only exist in production. After the first deploy:
- [ ] Submit a real test through each form; confirm it's captured; **enable form notifications.**
- [ ] Submit `sitemap.xml` to the search console; request indexing.
- [ ] Verify the live URL on a real phone (the owner's eyes, if you can't reach it).
- [ ] Swap any remaining placeholders for real content.

## Time-box environment fights
If a path is blocked (read-only token, blocked host, missing permission), give it ~2 tries,
then **pivot to the dependency-free approach** rather than grinding. Report the blocker;
don't retry a policy denial (403/407).
