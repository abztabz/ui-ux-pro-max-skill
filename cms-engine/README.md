# CMS Engine

A tiny, dependency-free content-management backend for static sites. It gives a
non-technical owner a password-protected dashboard to edit page text, blog
posts, photos, SEO tags, and forms — and commits every change straight to the
site's GitHub repo, which redeploys automatically.

No database, no CMS platform, no build step. One serverless function, one
config file, one HTML dashboard.

Extracted and generalised from a production client site; hardened over several
security and robustness passes (see "Security model" below).

## How it works

```
Owner → admin dashboard (admin/index.html)
          │  POST { action, password, … }
          ▼
     serverless function (functions/save-content.mjs)
          │  authenticates, then reads/writes files via
          ▼
     GitHub Contents API  →  commit to the repo  →  host redeploys the site
```

The site itself stays fully static. The function is the only moving part, and
it holds exactly two secrets (a GitHub token and the owner's password).

## What the owner can do

| Action | What it does |
|---|---|
| `save-pages` | Edit page text (headlines, paragraphs) stored in `data/pages.json` |
| `save-seo` | Rewrite `<title>`/description/keywords/OG tags directly in each page's HTML |
| `save-forms` | Edit form fields, and point every form at one Formspree ID |
| `upload-image` | Upload a photo (auto-resized in the browser) to the gallery |
| `save-gallery` | Reorder photos, edit captions, delete |
| `save-post` | Write/edit a blog post → generates a real HTML page + updates the sitemap |
| `delete-post` | Remove a post and its sitemap entry |

Three roles: **admin** (everything), **editor** (text/photos/blog, no SEO or
forms), **contributor** (write posts + upload photos only).

## Repurpose it for a new site

1. **Copy** this folder's pieces into your site repo:
   - `functions/save-content.mjs` → your serverless functions dir
     (e.g. `netlify/functions/`)
   - `cms.config.mjs` → one level above the function (so `../cms.config.mjs`
     resolves), or adjust the import path
   - `admin/index.html` → `admin/index.html` in your site (served at `/admin/`)
   - `templates/blog-post.template.html` → `blog/template.html` (only if you
     want a blog)
   - `netlify.toml.example` → `netlify.toml` (adjust `publish`)

2. **Edit `cms.config.mjs`** — set `repo`, `siteUrl`, your `pages` list, and any
   `formPages`. That's the backend.

3. **Edit the `CMS` block** at the top of `admin/index.html` — set `brandName`,
   `editorTitle`, `siteUrl`, `functionPath`, `pages`, and `formPages` to match.
   Recolour the editor via the CSS `:root{}` tokens if you like.

4. **Mark up your pages** so the editor can find things (see "Page conventions").

5. **Set secrets** in your host's environment (never in code):
   - `GITHUB_TOKEN` — a fine-grained PAT with **Contents: Read and write** on the repo
   - `ADMIN_PASSWORD` — the owner's login password
   - `CMS_USERS` — *(optional)* JSON array of extra users:
     `[{"name":"Editor","password":"…","role":"editor"}]`

6. **Deploy.** Visit `/admin/`, log in, edit.

## Page conventions

The editor discovers editable content by attribute, so your HTML opts in:

- **Editable text:** `<h1 data-edit="home.headline">…</h1>`. The `data-edit` key
  is where the value is stored in `data/pages.json`; your site reads that JSON
  to render the live value. The prefix (`home`) matches a page's `prefix` in
  the config.
- **A single editable photo:** `data-edit-img="about.portrait"`.
- **A pick-from-gallery photo strip:** `data-photo-strip="home.gallery"`.
- **A managed form:** `<form data-form="contact" data-formspree action="https://formspree.io/f/XXXX">…`.
  The field editor rewrites the fields inside; `data-formspree` marks it for the
  one-click Formspree ID update.
- **Blog posts** live at `blog/<slug>.html`, generated from `blog/template.html`
  (see that file for the placeholder contract). Indexed in `data/posts.json`.

Content files the engine manages: `data/pages.json`, `data/posts.json`,
`data/gallery.json`, `sitemap.xml`, `blog/*.html`, `assets/images/uploads/*`.

## Configuration

Everything in `cms.config.mjs`. Each value has a sensible default and an
environment-variable override (handy for staging vs. production, and for tests):

| Config | Env override | Purpose |
|---|---|---|
| `repo` | `CMS_REPO` | GitHub `owner/name` to commit to |
| `branch` | `CMS_BRANCH` | Branch the site deploys from |
| `dir` | `CMS_DIR` | Path prefix inside the repo (`""` = repo root) |
| `siteUrl` | `CMS_SITE_URL` | Absolute site URL (sitemap, OG tags) |
| `pages` | `CMS_PAGES` | Pages with editable SEO + sitemap entries |
| `formPages` | `CMS_FORM_PAGES` | Named forms → the page each lives on |
| `formspreePages` | `CMS_FORMSPREE_PAGES` | Pages whose forms share a Formspree ID |
| `defaultOgImage` | `CMS_DEFAULT_OG_IMAGE` | Fallback social image for posts |
| `formButtonClass` | `CMS_FORM_BUTTON_CLASS` | CSS class on generated submit buttons |
| `maxUploadBytes` | `CMS_MAX_UPLOAD_BYTES` | Upload size cap |

## Security model

- **Auth:** password-only, compared in constant time (SHA-256 + `timingSafeEqual`).
  The password *is* the identity, so keep each user's password unique.
- **Brute-force:** a per-IP throttle locks out after repeated failures. It's
  best-effort (in-memory per warm instance) — for a hard guarantee, back it with
  an external store keyed by IP.
- **Roles** are enforced **server-side** on every action; the dashboard only
  hides what a role can't use.
- **No injection:** blog bodies are HTML-escaped, re-enabling only the advertised
  `<em>`/`<strong>`, so even a low-trust contributor can't inject `<script>` into
  a public page. Titles, descriptions, captions, and form labels are all escaped.
- **No information leaks:** internal errors are logged server-side; the client
  only ever sees a friendly message (with a distinct "someone else just saved,
  reload" for write conflicts).
- **Fail-closed login:** a wrong password, a lockout, or an unreachable function
  never grants the dashboard.

## Testing

The backend has a zero-dependency test suite (Node's built-in runner) that
exercises every action against a fake in-memory GitHub API:

```bash
node --test cms-engine/tests/*.test.mjs
```

It sets a generic config via env vars, so it's fully hermetic. Add cases as you
extend the engine. For the dashboard UI, drive `admin/index.html` in a headless
browser against a mocked function (a full reference Playwright suite ships with
the originating site).

## Limitations (by design)

- Every save is one or more GitHub commits, then a redeploy — changes go live in
  ~a minute, not instantly. Fine for brochure/marketing/coach/portfolio sites;
  not for high-frequency or per-user content.
- Concurrent edits to the same file are detected (conflict → "reload and try
  again"), not merged.
- SEO/form editing is regex-based HTML rewriting: it now **reports** when a
  page's markup doesn't contain the expected tags instead of failing silently,
  but it still assumes reasonably conventional markup.
