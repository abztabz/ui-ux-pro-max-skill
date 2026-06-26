# 108 Media — Website

Marketing site for **108 Media FZE LLC**, a creative studio & production house based in
Amber Gem Tower, Ajman, UAE.

## Stack
Plain static site — hand-written HTML, CSS and vanilla JS. No build step, no dependencies.

## Pages
- `index.html` — home (hero, work, services, stats, studio, contact)
- `case-study.html` — detailed case study (Aura Skincare Launch)
- `brand.html` — brand kit: logo system, color, gradient, typography

## Files
- `styles.css` — shared design system + home layout
- `case.css` — case-study-specific styles
- `brand.css` — brand-kit-specific styles
- `script.js` — preloader, scroll reveals, counters, custom cursor, magnetic buttons, parallax (shared across pages)

## Brand assets (`assets/`)
- `logo-mark.svg` — aperture mark (gradient). The mark reads as a camera iris — a nod to film, photography and media.
- `logo-mono.svg` — single-color mark (uses `currentColor`)
- `logo-full.svg` — horizontal lockup (mark + 108 MEDIA wordmark)
- `favicon.svg` — app icon / favicon
- `work/*.svg` — art-directed cover art for work samples + case-study visuals

## Run locally
Open `index.html` in a browser, or serve it:
```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Notes
- The contact form is wired for **Netlify Forms** (`data-netlify="true"`); it captures
  submissions only once deployed to Netlify.
- Work samples (Aura, Desert Bloom, Lumen, Pulse) are representative placeholders pending
  real client assets. Swap the SVGs in `assets/work/` (or replace with photos/video) to
  feature real projects.
- Fonts are loaded from Google Fonts (Sora, Inter, Instrument Serif).
