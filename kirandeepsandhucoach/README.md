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
scripts/main.js      Mobile nav toggle + AJAX form submit
sitemap.xml          All 7 pages, for search engines
robots.txt           Allows all crawling, points to sitemap.xml
```

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

4. **Confirm the domain.**
   `sitemap.xml`, `robots.txt`, and every page's `<link rel="canonical">` / Open Graph
   tags assume the site stays at `https://kirandeepsandhucoach.com/`. If the domain
   changes, update those.

## Deploying (pick one)

- **Netlify**: drag-and-drop this folder at [app.netlify.com/drop](https://app.netlify.com/drop),
  or connect this GitHub repo (Netlify → Add new site → Import from Git) and set the
  publish directory to the repo root.
- **GitHub Pages**: repo Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
- **Any other static host** (cPanel, S3, etc.): upload every file in this repo as-is —
  there's no build step.

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
