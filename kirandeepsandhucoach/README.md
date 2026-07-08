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
blog.html            Blog index (renders data/posts.json)
blog/template.html   Template each published post's HTML page is generated from
blog/<slug>.html     Generated post pages (committed by the admin's Publish)
gallery.html         Photo gallery (renders data/gallery.json)
admin/index.html     Password-protected site editor (text, blog, photos)
data/pages.json      Edited page text; pages load it at runtime
data/posts.json      Blog post index; data/gallery.json — photo manifest
assets/images/uploads/  Photos uploaded from the admin
netlify/functions/   Netlify Function backing all admin saves
netlify.toml         Netlify build config (publish dir + functions dir)
```

## Design

Ink charcoal + deep teal + warm brass on a warm bone ground. Fraunces (display,
with an italic cut for emphasis) paired with Manrope (body/UI). The nav carries a
thin gradient accent bar and a gradient-filled primary button. Buttons are
rectangular with a small radius, not pills — see `styles/tokens.css` for the
full palette and `styles/main.css` for components.

## The admin (`/admin`) — text, blog, and photos without touching code

One password, three sections, WordPress-style dashboard:

- **Page text** — every heading and paragraph on every page is an editable
  block (tagged `data-edit` in the HTML; the admin builds its form by fetching
  the live pages and collecting those tags, so new tagged elements appear
  automatically). Saves commit `data/pages.json`; pages apply it at load time
  and fall back to their HTML defaults if the fetch fails.
- **Blog posts** — write, edit, delete. Publishing generates a real standalone
  HTML page at `blog/<slug>.html` from `blog/template.html` (title/description
  meta, OpenGraph, JSON-LD BlogPosting) and updates `data/posts.json` +
  `sitemap.xml` in the same save — that per-post static page is what makes the
  blog genuinely SEO-indexable. Body format: blank line = paragraph, a line
  starting `## ` = subheading, inline `<em>`/`<strong>` allowed.
- **Photos** — upload from a phone (browser resizes to ≤1600px JPEG before
  upload, so multi-MB camera shots become ~300 KB), captions, remove. Feeds
  the public Gallery page; any uploaded photo can be a blog post's cover.
- **SEO** — per-page control of the title tag, meta description, and keywords
  for all 9 static pages, with character counters and a Google-result preview.
  Saves rewrite the tags inside the HTML files themselves (via `save-seo` in
  the function), so crawlers see the edits statically — no JS involved. Blog
  posts get their SEO from the post editor instead.

All saves go through the one Netlify Function
(`netlify/functions/save-content.mjs`), which checks the password and commits
the changes to this repo via the GitHub API; Netlify then redeploys, so edits
go live in about a minute.

**⚠️ This repo already runs a different Netlify site.** `ui-ux-pro-max-skill`
also hosts an unrelated client's site at `/docs`, with its own `netlify.toml` at
the repo root (`publish = "docs"`). Do **not** reuse that Netlify site for this
one — connect this repo again as a **second, separate** Netlify site, and in
that new site's build settings set **Base directory** to `kirandeepsandhucoach`.
That scopes it to this folder's own `netlify.toml` (`publish = "."`,
`functions = "netlify/functions"`) without touching the other site's config.

**One-time setup on Netlify:**

1. Netlify → Add new site → Import from Git → this repo → set **Base
   directory** to `kirandeepsandhucoach` (see warning above — skipping this
   is the single easiest way to break the other client's site or this one).
2. Site settings → Environment variables, add:
   - `ADMIN_PASSWORD` — whatever password you want to log in with at `/admin`
   - `GITHUB_TOKEN` — a fine-grained GitHub PAT scoped to **Contents: Read and
     write** on `abztabz/ui-ux-pro-max-skill` only
3. `netlify/functions/save-content.mjs` already points `REPO` at
   `abztabz/ui-ux-pro-max-skill` and `PATH` at `kirandeepsandhucoach/data/pages.json`
   — that's correct as long as this stays nested here. `BRANCH` is set to
   `"main"`; change it if this Netlify site deploys from a different branch,
   or edits will commit somewhere nothing actually serves.
4. Visit `yoursite.com/admin`, log in with `ADMIN_PASSWORD`, edit, Save.

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
