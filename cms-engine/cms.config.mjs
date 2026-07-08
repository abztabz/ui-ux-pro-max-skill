// CMS Engine — site configuration.
//
// This is the ONE file most sites need to edit. Change the defaults for your
// site, or override any value with an environment variable (handy for staging
// vs. production, and for tests).
//
// Secrets are NEVER put here. GITHUB_TOKEN, ADMIN_PASSWORD and CMS_USERS live
// only in your host's environment variables (e.g. the Netlify dashboard).

const json = (envVar, fallback) => {
  const raw = process.env[envVar];
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
};

// A directory prefix inside the repo, e.g. "site/" if the site isn't at the
// repo root. Normalised to "" or a value ending in "/".
const rawDir = process.env.CMS_DIR ?? "";
const dir = rawDir === "" ? "" : rawDir.replace(/\/*$/, "/");

export const config = {
  // ---- Where content is committed (often overridden per-environment) --------
  repo:    process.env.CMS_REPO     || "owner/repository", // GitHub "owner/name"
  branch:  process.env.CMS_BRANCH   || "main",             // branch the site deploys from
  dir,                                                      // path prefix inside the repo ("" = repo root)
  siteUrl: process.env.CMS_SITE_URL || "https://example.com",

  // ---- Content model --------------------------------------------------------
  // Pages whose SEO can be edited and that appear in the sitemap. Use
  // "index.html" for the home page.
  pages: json("CMS_PAGES", ["index.html", "about.html", "contact.html"]),

  // Named forms the field-editor manages, and the page each one lives on. The
  // form in that page must be marked <form data-form="KEY">.
  formPages: json("CMS_FORM_PAGES", { contact: "contact.html" }),

  // Pages whose <form data-formspree> tags all receive the same Formspree ID
  // when the owner sets one. (The blog template and every published post are
  // always included automatically.)
  formspreePages: json("CMS_FORMSPREE_PAGES", ["index.html", "contact.html"]),

  // Fallback social-share image for blog posts that don't set their own,
  // relative to the site root.
  defaultOgImage: process.env.CMS_DEFAULT_OG_IMAGE || "assets/images/social-share.jpg",

  // CSS class put on generated form submit buttons — match your site's styles.
  formButtonClass: process.env.CMS_FORM_BUTTON_CLASS || "btn btn-primary",

  // Max upload size in decoded bytes. Backstops client-side compression and
  // keeps the base64 payload under Netlify's ~6 MB function request limit.
  maxUploadBytes: Number(process.env.CMS_MAX_UPLOAD_BYTES || 4 * 1024 * 1024),
};
