# Amit's site — Admin (content editor) setup

Amit edits the site at **`/admin`** with a **password** (no GitHub or Netlify account needed).
He fills in forms, clicks Save, and the site updates in ~1 minute. $0/month.

This is a **hand-coded CMS**: a small Netlify Function checks the password and saves the
change by committing the content file in the repo. The site reads those files.

## One-time setup (do this once, in Netlify)

> Done by the Netlify account owner. ~5 minutes.

### 1. Create a GitHub access token (so the function may save changes)
1. Go to **https://github.com/settings/tokens?type=beta** (Fine-grained tokens) → **Generate new token**.
2. Name: `amit-cms`. Expiration: 1 year (or No expiration).
3. **Repository access** → **Only select repositories** → choose **abztabz/ui-ux-pro-max-skill**.
4. **Permissions** → **Repository permissions** → **Contents** → **Read and write**.
5. Generate, then **copy the token** (starts with `github_pat_…`). You won't see it again.

### 2. Add two environment variables in Netlify
Netlify → your site → **Site configuration** → **Environment variables** → **Add a variable** (add both):
- `ADMIN_PASSWORD` = a strong password you choose (this is what Amit types to log in).
- `GITHUB_TOKEN` = the token you copied in step 1.

### 3. Redeploy
Netlify → **Deploys** → **Trigger deploy** → **Deploy site** (so the function picks up the variables).

## How Amit edits the site
1. Go to **https://amitshresthaleadershipcoach.netlify.app/admin/**
2. Type the password → **Log in**.
3. Edit **Events**, **Testimonials**, or **Insights (Essays)** — add, edit, or remove entries.
4. Click **Save [section]**. The site updates in ~1 minute.

## Security note (honest)
This is a simple password gate for a single trusted editor — good enough for a small site,
not enterprise-grade (no "forgot password", no lockout). Use a strong, unique password.
The GitHub token lives only in Netlify's settings (server-side) and is never shown on the site.

## Editable now
- **Events, Testimonials, Insights essays** (add / edit / remove).
- **Page Text** — every page's headline + intro paragraph, plus the About story and pull-quote.
  (Tip: wrap a word in `<em>…</em>` to make it gold, like the headlines.)
- More fields (program/service body text, credentials, etc.) can be added on request —
  each is a quick tag-and-label.

## Files
- Content: `docs/data/events.json`, `testimonials.json`, `essays.json` (also editable by hand).
- Backend: `netlify/functions/save-content.mjs`. Admin UI: `docs/admin/index.html`.
