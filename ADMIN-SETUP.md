# Amit's site — Admin (content editor) setup

Amit can edit the site himself at **`/admin`** — a private login where he fills in simple
forms and hits Publish; the site updates automatically in ~1 minute. No coding, $0/month.

This is built with **Decap CMS + Netlify Identity** (email + password login). It edits the
content files in `docs/data/*.json`; the site reads those, so the live pages update on save.

## One-time setup (do this once, in Netlify)

> Must be done by whoever owns the Netlify account. Takes ~3 minutes.

1. Open your site in **Netlify** → **Identity** tab → click **Enable Identity**.
2. Still in Identity → **Registration preferences** → set to **Invite only**
   (so only people you invite can log in).
3. Identity → **Services** → **Git Gateway** → click **Enable Git Gateway**.
   *(This is what lets the admin save changes back to the site.)*
4. Identity → **Invite users** → enter **Amit's email** → Send.
   Amit gets an email → clicks **Accept the invite** → sets his password.

## How Amit edits the site (every time)

1. Go to **https://amitshresthaleadershipcoach.netlify.app/admin/**
2. Log in with his email + password.
3. Pick a section in the left menu:
   - **Events** — add/edit/remove upcoming events (date, title, venue, button).
   - **Testimonials** — the quotes on the Home page.
   - **Insights (Essays)** — the article cards on the Insights page.
4. Make changes → click **Publish**.
5. Wait ~1 minute, refresh the site — the change is live.

## What's editable today vs. coming next

- **Editable now:** Events, Testimonials, Insights essays.
- **Next (on request):** the rest of the page text (hero, About, Programs, Services). These
  are kept as fixed HTML for now because they change rarely and it keeps SEO strongest; they
  can be made editable the same way whenever you want.

## Notes
- The `/admin` page is hidden from Google (`noindex`) and login-protected.
- If Netlify's **Identity** option isn't available on your plan, tell me and I'll switch the
  login to **GitHub** instead (Amit would need a free GitHub account).
- Content lives in `docs/data/events.json`, `testimonials.json`, `essays.json` — editable by
  hand too, if ever needed.
