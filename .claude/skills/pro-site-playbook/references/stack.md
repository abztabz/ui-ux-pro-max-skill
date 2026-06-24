# Stack — a zero-budget, no-code-friendly toolkit

A professional, lead-capturing site for **$0/month** by composing free services. The only
thing worth paying for is a custom domain (~$10–15/yr).

## Hosting (free)

| Option | Get | Best when |
|--------|-----|-----------|
| **Netlify** (recommended) | drag-drop a folder, or connect a GitHub repo; pick a branch + publish dir; free branded subdomain (`name.netlify.app`) | You want auto-deploy on push, free forms, and a clean URL you can name. |
| **GitHub Pages (classic, deploy-from-branch)** | repo → Settings → Pages → deploy from a branch, folder `/docs` | Already in GitHub; want no extra account. URL is `user.github.io/repo/`. |

**Gotchas (learned the hard way):**
- **Don't rely on a CI token to deploy.** A repo's GitHub **Actions token can be read-only**,
  so Actions-based Pages deploys fail with *"Resource not accessible by integration"* — even
  with `enablement: true`. Use **no-token** hosting: classic Pages "deploy from a branch", or
  Netlify (its own app has the right scope).
- **Publish from `/docs` or repo root** for classic Pages — those are the only allowed folders.
- **A connected host deploys from ONE branch.** Develop on a feature branch; merge to the
  deploy branch (usually `main`) only when approved. Switching the work onto `main` makes the
  live site permanent instead of depending on a temporary branch.
- A sandbox often **can't load the live URL** (egress blocked) — rely on the owner to verify
  in their browser.

## Lead capture (free)

- **Forms → Netlify Forms.** Add `data-netlify="true"`, a `name`, a hidden `form-name` input,
  and a honeypot; Netlify captures submissions with no backend. Submit via AJAX to show a
  custom thank-you. **Caveats:** forms are only detected at deploy and only capture **in
  production** — and you must **enable form notifications** to actually receive them. Build a
  graceful fallback so local previews still behave.
- **Scheduling → Calendly (free).** Use the popup widget (`Calendly.initPopupWidget`) with the
  event URL as the link's `href` fallback, so it still works if the script doesn't load.
- **Quiz / assessment.** A multi-step quiz (progress bar, selectable cards) ending in an
  email-gated "profile" is a strong lead magnet — build it as plain JS posting answers (as
  hidden fields) into a Netlify form. **Forms / Google Forms / Tally** also work for simpler
  cases.
- **Newsletter.** A Netlify form, or a free Substack / beehiiv / Mailchimp embed.

## SEO (free, but a process)

Per page: unique `<title>` + meta description, `<link rel="canonical">`, Open Graph tags,
exactly one `<h1>`, semantic structure, and **JSON-LD structured data** (Person /
ProfessionalService / Course / Book / BreadcrumbList as relevant). Site-wide: `sitemap.xml`
+ `robots.txt`. **This only pays off once you submit the sitemap to the search console** —
that's a post-deploy step, not a one-time file.

## Custom domain (the one optional cost)
~$10–15/yr at a registrar (Porkbun, Namecheap, Cloudflare). Point DNS at the host and add
the domain in the host's settings; the host issues free HTTPS. Until then, a named
`*.netlify.app` subdomain is a clean, free address.

## A composed example
Static HTML/CSS/JS in `/docs` → Netlify (host + forms) → Calendly (scheduling) →
JS assessment quiz (lead magnet) → Netlify form (newsletter). Four capture points, $0/month.
