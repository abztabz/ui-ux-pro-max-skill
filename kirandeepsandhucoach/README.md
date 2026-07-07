# kirandeepsandhucoach-site

Redesigned website for Kiran Deep Sandhu / Leadership KARD — executive leadership and
communication coaching. Plain static HTML/CSS/JS, no build step, so it works on any
static host.

## Structure

```
index.html          Home
about.html           About
coaching.html        1:1 Leadership Coaching
training.html        Corporate Training & Team Workshops
speaking.html        Speaking Engagements & Keynotes
testimonials.html    All client testimonials
contact.html         Lead-capture form + contact info
styles/tokens.css    Design tokens (colors, type, spacing) — edit here to re-theme
styles/main.css      Layout and components
scripts/main.js      Mobile nav toggle + AJAX form submit + CMS content loader
sitemap.xml          All 7 pages, for search engines
robots.txt           Allows all crawling, points to sitemap.xml
admin/index.html     Password-protected editor for headlines/subheadings
data/pages.json      Content the admin editor reads/writes; pages load it at runtime
netlify/functions/   Netlify Function backing the admin editor's Save button
netlify.toml         Netlify build config (publish dir + functions dir)
```

## Design

Ink charcoal + deep teal + warm brass on a warm bone ground. Fraunces (display,
with an italic cut for emphasis) paired with Manrope (body/UI). The nav carries a
thin gradient accent bar and a gradient-filled primary button. Buttons are
rectangular with a small radius, not pills — see `styles/tokens.css` for the
full palette and `styles/main.css` for components.

## Editing headlines without touching code (the CMS)

Every page's headline and subheading (plus the About page's intro line) can be
edited from `/admin` without git — no separate CMS account, just one password.

**How it works:** `admin/index.html` is a password-gated form. Saving posts to
a Netlify Function (`netlify/functions/save-content.mjs`), which checks the
password and commits the edited text to `data/pages.json` via the GitHub API.
Every page reads that file at load time (see the bottom of `scripts/main.js`)
and swaps in any edited text over the HTML defaults. If the fetch fails for any
reason, the page just shows the original HTML — there's no broken state.

**One-time setup on Netlify** (after connecting this repo as a Netlify site):

1. Site settings → Environment variables, add:
   - `ADMIN_PASSWORD` — whatever password you want to log in with at `/admin`
   - `GITHUB_TOKEN` — a fine-grained GitHub PAT scoped to **Contents: Read and
     write** on this one repo only
2. Open `netlify/functions/save-content.mjs` and confirm `REPO` and `BRANCH`
   at the top match where this site actually lives and deploys from — they're
   set assuming this becomes its own repo (`kirandeepsandhucoach-site`) on
   `main`. If it stays nested inside a larger repo instead, add that folder
   prefix to the `PATH` constant too.
3. Visit `yoursite.com/admin`, log in with `ADMIN_PASSWORD`, edit, Save.

No Netlify Identity, no Decap CMS — both have been deprecated/discontinued for
new sites, so this hand-coded version avoids that dead end entirely.

## Required setup before launch

1. **Wire up the lead-capture form (Formspree).**
   Every `<form data-formspree>` currently points to
   `https://formspree.io/f/REPLACE_WITH_FORMSPREE_ID` (in `index.html`, `contact.html`,
   and the footer newsletter form on every page). Create a free form at
   [formspree.io](https://formspree.io), and replace `REPLACE_WITH_FORMSPREE_ID` with
   your real form ID everywhere it appears.

2. **Swap placeholder photos.**
   No real photos were supplied for this build. The hero portrait (home + about pages)
   currently shows a "KS" monogram on a dark card, clearly labeled as a placeholder.
   Replace `.hero-portrait` with a real `<img>` of Kiran before launch, and consider
   real headshots for testimonials (currently text-initial avatars).

3. **Review the About page bio.**
   The About page copy was drafted from facts already on the homepage (certifications,
   "two decades" of experience) — it was not sourced from an existing About page. Please
   review and edit for accuracy before publishing.

4. **Set up the admin editor's environment variables** — see "Editing headlines
   without touching code" below. Without `ADMIN_PASSWORD` and `GITHUB_TOKEN` set in
   Netlify, `/admin` will log in fine but Save will fail with a config error.

5. **Confirm the domain.**
   `sitemap.xml`, `robots.txt`, and every page's `<link rel="canonical">` / Open Graph
   tags assume the site stays at `https://kirandeepsandhucoach.com/`. If the domain
   changes, update those.

## Deploying (pick one)

- **Netlify (required for the admin editor to work)**: connect this repo (Netlify →
  Add new site → Import from Git). `netlify.toml` already points Netlify at the right
  publish and functions directories. Drag-and-drop at
  [app.netlify.com/drop](https://app.netlify.com/drop) also works for the static pages,
  but the admin editor needs a real Git-connected site so its function can commit back.
- **GitHub Pages**: repo Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
  The static pages work fine here; the admin editor won't, since Pages can't run
  serverless functions — either skip the CMS or point `admin`'s save requests at a
  Netlify Function hosted separately.
- **Any other static host** (cPanel, S3, etc.): upload every file in this repo as-is —
  there's no build step. Same caveat as GitHub Pages re: the admin editor.

## Post-deploy checklist

- [ ] Submit a real test through the Contact form and the newsletter form; confirm both
      arrive in your Formspree inbox; enable Formspree email notifications.
- [ ] Submit `sitemap.xml` to Google Search Console and Bing Webmaster Tools; request
      indexing.
- [ ] Replace the placeholder photos (see above).
- [ ] Update the social links in the header/footer (`#` placeholders) to real LinkedIn,
      YouTube, Instagram, and Facebook URLs.
- [ ] View the live site on a real phone to confirm layout and forms work end-to-end.

## Scope not included in this build

- **Books / Resources** pages — the current site's footer lists these, but no content
  was provided, so they're left out for now. Add them the same way as any other page
  once there's real content.
- **"Find Your Leadership Style Now"** currently links to the Contact form. The name
  implies an interactive quiz/assessment — building that properly would need the real
  quiz questions and scoring logic, which wasn't part of this build.
