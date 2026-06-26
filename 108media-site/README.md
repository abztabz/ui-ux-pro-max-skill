# 108 Media — Website

Marketing site for **108 Media FZE LLC**, a creative studio & production house based in
Amber Gem Tower, Ajman, UAE.

## Stack
Plain static site — hand-written HTML, CSS and vanilla JS. No build step.

- `index.html` — single-page site (hero, work, services, stats, studio, contact)
- `styles.css` — design system + layout
- `script.js` — preloader, scroll reveals, counters, custom cursor, magnetic buttons, parallax

## Run locally
Open `index.html` in a browser, or serve it:
```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Notes
- The contact form is wired for **Netlify Forms** (`data-netlify="true"`). It needs a
  Netlify deploy to actually capture submissions.
- Work samples are placeholders pending real project assets.
