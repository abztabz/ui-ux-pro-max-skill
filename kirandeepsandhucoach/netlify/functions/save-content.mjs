// Hand-coded CMS backend (Netlify Function).
// Password-gated actions that write to the repo via the GitHub API:
//
//   save-pages    — commit the edited page text (data/pages.json)
//   save-seo      — rewrite <title>/description/keywords/og tags inside the
//                   static page HTML files themselves (crawler-visible, no JS)
//   upload-image  — commit a photo (assets/images/uploads/…) + gallery manifest
//   save-gallery  — commit the gallery manifest alone (captions, deletes, order)
//   save-post     — generate a real HTML page for a blog post from
//                   blog/template.html, commit it + data/posts.json + sitemap.xml
//   delete-post   — remove a post page + update posts.json + sitemap.xml
//   save-forms    — rewrite the hero/contact form fields inside their pages,
//                   and/or set the real Formspree ID across every form on the
//                   site (all static pages, blog.html, gallery.html, the post
//                   template, and every already-published post)
//   list-pages    — the current page registry plus metadata for hidden pages
//   add-page      — clone an existing page (blank placeholders or a verbatim
//                   copy) into a new file, add it to the nav on every page
//   hide-page     — take a page fully offline: delete the live file (backed
//                   up in data/hidden-pages.json first) and drop it from nav
//   show-page     — restore a page hidden via hide-page and re-add it to nav
//
// Required Netlify environment variables:
//   ADMIN_PASSWORD  — the site owner's password (always an admin)
//   GITHUB_TOKEN    — a fine-grained PAT with "Contents: Read and write" on the repo
// Optional:
//   CMS_USERS       — JSON array of additional users, each with their own
//                     password and role, e.g.
//                     [{"name":"Kiran","password":"…","role":"admin"},
//                      {"name":"Asha","password":"…","role":"editor"},
//                      {"name":"Guest writer","password":"…","role":"contributor"}]
//                     Roles: admin (everything) · editor (text/photos/blog,
//                     no SEO) · contributor (write posts + upload photos only).
//                     Passwords identify the person, so keep them unique.
//
// This site currently lives nested inside ui-ux-pro-max-skill; DIR prefixes every
// committed path. BRANCH assumes Netlify deploys from "main" — if it deploys from
// another branch, update BRANCH or edits will land where nothing serves them.

import { timingSafeEqual, createHash } from "node:crypto";

const REPO = "abztabz/ui-ux-pro-max-skill";
const BRANCH = "main";
const DIR = "kirandeepsandhucoach/";

const SITE_URL = "https://kirandeepsandhucoach.com";
const STATIC_PAGES = [
  "", "about.html", "coaching.html", "training.html", "speaking.html",
  "testimonials.html", "contact.html", "blog.html", "gallery.html",
];

const gh = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "User-Agent": "kirandeepsandhu-cms",
    Accept: "application/vnd.github+json",
  },
  api: (path) => `https://api.github.com/repos/${REPO}/contents/${DIR}${path}`,
});

async function getFile(g, path) {
  const res = await fetch(`${g.api(path)}?ref=${BRANCH}`, { headers: g.headers });
  if (!res.ok) return { sha: undefined, content: null };
  const body = await res.json();
  return { sha: body.sha, content: Buffer.from(body.content || "", "base64").toString("utf8") };
}

async function putFile(g, path, contentB64, message, sha) {
  const res = await fetch(g.api(path), {
    method: "PUT",
    headers: { ...g.headers, "content-type": "application/json" },
    body: JSON.stringify({ message, content: contentB64, branch: BRANCH, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw githubError("PUT", path, res, await res.text());
}

// Tags the thrown error with the GitHub response status so the handler's
// catch-all can tell a stale-sha write conflict (another save landed first)
// apart from a genuine failure, without ever forwarding GitHub's raw
// response text to the client.
function githubError(method, path, res, bodyText) {
  const err = new Error(`GitHub ${method} ${path} → ${res.status}: ${bodyText}`);
  err.status = res.status;
  return err;
}

async function putText(g, path, text, message) {
  const { sha } = await getFile(g, path);
  await putFile(g, path, Buffer.from(text).toString("base64"), message, sha);
}

async function getJson(g, path, fallback) {
  const { content } = await getFile(g, path);
  return content ? JSON.parse(content) : fallback;
}

function putJson(g, path, data, message) {
  return putText(g, path, JSON.stringify(data, null, 2) + "\n", message);
}

async function deleteFile(g, path, message) {
  const { sha } = await getFile(g, path);
  if (!sha) return;
  const res = await fetch(g.api(path), {
    method: "DELETE",
    headers: { ...g.headers, "content-type": "application/json" },
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) throw githubError("DELETE", path, res, await res.text());
}

// "3 pages" / "1 page"
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// ---------- blog helpers ----------

const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Restore only the two inline tags the post editor advertises (<em>, <strong>)
// from their escaped form. Everything else stays escaped, so a post author —
// including a low-trust "contributor" — can't inject <script>, <img onerror>,
// or any other markup into the public page.
const restoreInlineFormatting = (escaped) =>
  escaped.replace(/&lt;(\/?)(em|strong)&gt;/g, "<$1$2>");

// Body text → HTML: blank-line-separated paragraphs; a line starting with
// "## " becomes a subheading. Content is escaped first, then <em>/<strong>
// (the only formatting the editor offers) are re-enabled — see above.
function bodyToHtml(text) {
  return String(text)
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const safe = restoreInlineFormatting(escapeHtml(chunk)).replace(/\n/g, "<br>");
      return safe.startsWith("## ")
        ? `<h2>${safe.slice(3).trim()}</h2>`
        : `<p>${safe}</p>`;
    })
    .join("\n      ");
}

// Shared tail of save-post/delete-post: both end by rewriting the blog
// index and the sitemap to match the new post list. `registry` (the live
// pages — see "pages registry" below) drives which static pages appear in
// the sitemap, so an added/hidden page is reflected immediately.
async function savePostIndex(g, posts, by, registry) {
  await putJson(g, "data/posts.json", posts, `Update blog index via admin${by}`);
  await putText(g, "sitemap.xml", renderSitemap(posts, registry), `Update sitemap via admin${by}`);
}

function renderSitemap(posts, registry) {
  const today = new Date().toISOString().slice(0, 10);
  const pageUrl = (file) => `${SITE_URL}/${file === "index.html" ? "" : file}`;
  const urls = registry
    .map((p) => `  <url><loc>${pageUrl(p.file)}</loc><lastmod>${today}</lastmod></url>`)
    .concat(
      posts.map(
        (p) => `  <url><loc>${SITE_URL}/blog/${p.slug}.html</loc><lastmod>${p.date}</lastmod></url>`
      )
    );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

function renderPost(template, post) {
  const heroHtml = post.image
    ? `<img class="post-hero-img" src="../${post.image}" alt="${escapeHtml(post.imageAlt || post.title)}">`
    : "";
  const tagsMeta = post.tags && post.tags.length
    ? `<meta name="keywords" content="${escapeHtml(post.tags.join(", "))}">`
    : "";
  const dateHuman = new Date(post.date + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
  return template
    .replaceAll("{{TITLE}}", escapeHtml(post.title))
    .replaceAll("{{DESCRIPTION}}", escapeHtml(post.excerpt || ""))
    .replaceAll("{{SLUG}}", post.slug)
    .replaceAll("{{DATE_ISO}}", post.date)
    .replaceAll("{{DATE_HUMAN}}", dateHuman)
    .replaceAll("{{HERO_HTML}}", heroHtml)
    .replaceAll("{{TAGS_META}}", tagsMeta)
    .replaceAll("{{OG_IMAGE}}", post.image ? `${SITE_URL}/${post.image}` : `${SITE_URL}/assets/images/social-share.jpg`)
    .replaceAll("{{BODY}}", bodyToHtml(post.body));
}

// ---------- pages registry ----------
//
// data/pages-registry.json is the live source of truth for which pages exist,
// their nav order, and their labels. add-page/hide-page/show-page write it;
// everything else (SEO list, sitemap, nav markup) is derived from it at
// request time instead of the static STATIC_PAGES default, so the site stays
// consistent the moment a page is added or hidden. If the file doesn't exist
// yet (before this feature's first use), it's bootstrapped from STATIC_PAGES.

function labelFromFile(file) {
  const base = file.replace(/\.html$/, "");
  const name = base === "index" ? "home" : base;
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function prefixFromFile(file) {
  const base = file.replace(/\.html$/, "");
  return (base === "index" ? "home" : base).replace(/-/g, "_");
}

function defaultRegistry() {
  return ["index.html", ...STATIC_PAGES.filter(Boolean)].map((file) => ({
    file, prefix: prefixFromFile(file), label: labelFromFile(file),
  }));
}

async function getRegistry(g) {
  return await getJson(g, "data/pages-registry.json", defaultRegistry());
}

// Turns a page name into a safe filename: lowercase letters, numbers, and
// hyphens only, collapsed and trimmed. Empty input (or one that's all
// punctuation) yields "".
function slugifyFilename(label) {
  const slug = String(label || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug ? `${slug}.html` : "";
}

// Renders the <li> lines for the site nav. Every page carries its own copy of
// the nav with only ITS OWN link flagged current, so this is called once per
// target file with that file passed as currentFile.
function renderNavList(registry, currentFile) {
  return registry
    .map((p) => {
      const current = p.file === currentFile ? ' aria-current="page"' : "";
      return `        <li><a href="${p.file}"${current}>${escapeHtml(p.label)}</a></li>`;
    })
    .join("\n");
}

const NAV_UL_RE = /(<nav class="site-nav"[^>]*>\s*<ul>)[\s\S]*?(<\/ul>)/;

// Rewrites the nav menu inside every currently-live page (plus the blog post
// template, best-effort, so future posts pick it up too) to match the
// registry. Called after anything that adds, removes, or reorders pages.
// Already-published individual posts are intentionally left alone — with
// many posts that's a lot of extra commits for a cosmetic, low-visibility
// footer/nav mismatch, not a broken link.
async function syncNavAcrossPages(g, registry, by) {
  const targets = [...registry.map((p) => p.file), "blog/template.html"];
  for (const file of targets) {
    const { sha, content } = await getFile(g, file);
    if (!content || !NAV_UL_RE.test(content)) continue;
    const next = content.replace(NAV_UL_RE, (m, open, close) => `${open}\n${renderNavList(registry, file)}\n      ${close}`);
    if (next === content) continue;
    await putFile(g, file, Buffer.from(next).toString("base64"), `Update site navigation via admin${by}`, sha);
  }
}

// Clears a freshly-cloned page's editable text down to generic placeholders —
// used by add-page's "blank" mode. Matches "<TAG ...data-edit="prefix.key"...>
// ...</TAG>" pairs (open/close tag names tied together via backreference) and
// replaces the inner content. Safe for the simple, non-self-nesting text
// blocks data-edit is used on (headings, paragraphs, spans); not a general
// HTML sanitizer.
function clearEditableText(html, prefix) {
  const re = new RegExp(`<(\\w+)([^>]*\\sdata-edit="${prefix}\\.[a-z0-9_]+"[^>]*)>([\\s\\S]*?)<\\/\\1>`, "g");
  return html.replace(re, (m, tag, attrs) => {
    const placeholder = /^h[1-6]$/.test(tag) ? "Page headline" : "Write something here.";
    return `<${tag}${attrs}>${placeholder}</${tag}>`;
  });
}

// ---------- SEO helpers ----------

// Rewrite the SEO tags inside a page's HTML. Returns { html, missing } — the
// updated text plus a list of required tags that had no anchor to replace.
// Reporting `missing` lets the caller tell "already correct" apart from "this
// page's markup doesn't contain the tag we expected," instead of silently
// claiming success when a regex quietly matched nothing.
function applySeo(html, { title, description, keywords, image }) {
  const escT = escapeHtml(title);
  const escD = escapeHtml(description);
  const missing = [];

  // Replace an anchor if present; otherwise record it as missing and leave
  // the HTML untouched. (These regexes have no /g flag, so `.test()` is safe
  // to call before `.replace()` without disturbing lastIndex.)
  const rewrite = (src, re, replacement, label) => {
    if (re.test(src)) return src.replace(re, replacement);
    missing.push(label);
    return src;
  };

  // Only <title> and the description meta are required — they're the fields
  // that show in search results, and every page has them. The og: tags are
  // best-effort: mirror the title/description into them when present, but a
  // page without og: tags still had its real SEO updated, so don't flag it.
  let out = html;
  out = rewrite(out, /<title>[\s\S]*?<\/title>/, `<title>${escT}</title>`, "title");
  out = rewrite(out, /(<meta name="description" content=")[^"]*(")/, `$1${escD}$2`, "description");
  if (/<meta property="og:title"/.test(out)) out = out.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escT}$2`);
  if (/<meta property="og:description"/.test(out)) out = out.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escD}$2`);

  // Keywords are optional: absent tag + a value means "add one", so a missing
  // <meta name="keywords"> here is never a failure.
  const kw = (keywords || "").trim();
  const hasKwTag = /<meta name="keywords"/.test(out);
  if (kw && hasKwTag) {
    out = out.replace(/(<meta name="keywords" content=")[^"]*(")/, `$1${escapeHtml(kw)}$2`);
  } else if (kw && !hasKwTag) {
    out = out.replace(/(<meta name="description"[^>]*>)/, `$1\n<meta name="keywords" content="${escapeHtml(kw)}">`);
  } else if (!kw && hasKwTag) {
    out = out.replace(/\n?<meta name="keywords"[^>]*>/, "");
  }

  // Social share photo (og:image). An empty selection leaves the file as-is,
  // so pages without an explicit choice keep whatever default they have.
  const img = (image || "").trim();
  if (img) {
    const abs = /^https?:\/\//.test(img) ? img : `${SITE_URL}/${img}`;
    if (/<meta property="og:image"/.test(out)) {
      out = out.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${abs}$2`);
    } else {
      out = out.replace(/(<meta property="og:description"[^>]*>)/, `$1\n<meta property="og:image" content="${abs}">`);
    }
  }
  return { html: out, missing };
}

// ---------- form helpers ----------

const FORM_PAGES = { hero: "index.html", contact: "contact.html" };
const NEWSLETTER_PAGES = [
  "index.html", "about.html", "coaching.html", "training.html", "speaking.html",
  "testimonials.html", "contact.html", "blog.html", "gallery.html",
];

const AUTOCOMPLETE = {
  name: "name", email: "email", phone: "tel", tel: "tel",
  role: "organization-title", message: "off",
};

function renderField(field, idPrefix) {
  const key = String(field.key || "").trim();
  const label = escapeHtml(field.label || key);
  const id = `${idPrefix}-${key}`;
  const req = field.required ? " required" : "";

  if (field.type === "textarea") {
    return `          <div class="field">\n            <label for="${id}">${label}</label>\n            <textarea id="${id}" name="${key}"${req}></textarea>\n          </div>`;
  }
  if (field.type === "select") {
    const opts = (field.options || [])
      .map((o) => `              <option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`)
      .join("\n");
    return `          <div class="field">\n            <label for="${id}">${label}</label>\n            <select id="${id}" name="${key}"${req}>\n${opts}\n            </select>\n          </div>`;
  }
  const autocomplete = AUTOCOMPLETE[key] ? ` autocomplete="${AUTOCOMPLETE[key]}"` : "";
  return `          <div class="field">\n            <label for="${id}">${label}</label>\n            <input id="${id}" name="${key}" type="${field.type || "text"}"${req}${autocomplete}>\n          </div>`;
}

function renderFormBody(formKey, cfg) {
  const fields = (cfg.fields || []).map((f) => renderField(f, formKey)).join("\n");
  const btnClass = formKey === "contact" ? "btn btn-primary btn-block" : "btn btn-gradient";
  return `\n${fields}\n          <input class="field-hp" type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">\n          <button class="${btnClass}" type="submit">${escapeHtml(cfg.submitText || "Submit")}</button>\n          <p class="form-status" role="status" aria-live="polite"></p>\n        `;
}

// Point every <form data-formspree> on the site (static pages, the post
// template, and every already-published post) at one real endpoint.
async function updateFormspreeIdEverywhere(g, id) {
  const re = /(data-formspree[^>]*action="https:\/\/formspree\.io\/f\/)[^"]*(")/g;
  const posts = await getJson(g, "data/posts.json", []);
  const paths = [...NEWSLETTER_PAGES, "blog/template.html", ...posts.map((p) => `blog/${p.slug}.html`)];

  const touched = [];
  for (const path of paths) {
    const { sha, content } = await getFile(g, path);
    if (!content) continue;
    const next = content.replace(re, `$1${id}$2`);
    if (next === content) continue;
    await putFile(g, path, Buffer.from(next).toString("base64"), `Update Formspree ID for ${path} via admin`, sha);
    touched.push(path);
  }
  return touched;
}

// ---------- users & roles ----------

const ROLES = ["admin", "editor", "contributor"];
const PERMS = {
  "whoami": ROLES,
  "save-pages": ["admin", "editor"],
  "save-seo": ["admin"],
  "save-forms": ["admin"],
  "upload-image": ROLES,
  "save-gallery": ["admin", "editor"],
  "save-post": ROLES,
  "delete-post": ["admin", "editor"],
  "list-pages": ["admin"],
  "add-page": ["admin"],
  "hide-page": ["admin"],
  "show-page": ["admin"],
};

// Constant-time string compare. Hashing first makes both inputs a fixed
// 32-byte digest, so timingSafeEqual never takes the length-mismatch fast
// path that would otherwise leak the real password's length.
function passwordsMatch(a, b) {
  if (!a || !b) return false;
  const digestA = createHash("sha256").update(String(a)).digest();
  const digestB = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(digestA, digestB);
}

// Best-effort brute-force throttle. State is per-warm-container only (it
// resets on cold start and isn't shared across concurrent instances), so
// this slows a single attacker hammering one warm function, not a
// distributed attack — a real guarantee needs an external store (e.g.
// Netlify Blobs) keyed by IP, which isn't wired up here.
const loginAttempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 5 * 60 * 1000;

function isLockedOut(key) {
  const rec = loginAttempts.get(key);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) { loginAttempts.delete(key); return false; }
  return rec.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(key) {
  const rec = loginAttempts.get(key);
  if (!rec || Date.now() - rec.first > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, first: Date.now() });
  } else {
    rec.count += 1;
  }
}

function clearAttempts(key) {
  loginAttempts.delete(key);
}

// Passwords are per-person, so the password alone identifies the user.
function resolveUser(password) {
  if (!password) return null;
  if (process.env.ADMIN_PASSWORD && passwordsMatch(password, process.env.ADMIN_PASSWORD)) {
    return { name: "Admin", role: "admin" };
  }
  let users = [];
  try { users = JSON.parse(process.env.CMS_USERS || "[]"); } catch { /* bad JSON → no extra users */ }
  const hit = Array.isArray(users)
    ? users.find((u) => u && u.password && passwordsMatch(password, u.password))
    : null;
  if (!hit) return null;
  return {
    name: hit.name || "User",
    role: ROLES.includes(hit.role) ? hit.role : "contributor",
  };
}

// ---------- handler ----------

export default async (req) => {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = process.env.GITHUB_TOKEN;
  if (!token || (!process.env.ADMIN_PASSWORD && !process.env.CMS_USERS)) {
    return json({ error: "Server not configured. Set GITHUB_TOKEN plus ADMIN_PASSWORD (and optionally CMS_USERS) in Netlify." }, 500);
  }

  let body;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

  const { password, action } = body || {};
  const throttleKey = req.headers.get("x-nf-client-connection-ip") || "unknown";
  if (isLockedOut(throttleKey)) {
    return json({ error: "Too many incorrect attempts. Try again in a few minutes." }, 429);
  }

  const user = resolveUser(password);
  if (!user) {
    recordFailedAttempt(throttleKey);
    return json({ error: "Incorrect password." }, 401);
  }
  clearAttempts(throttleKey);

  const act = action || "save-pages";
  if (!PERMS[act]) return json({ error: "Unknown action." }, 400);
  if (!PERMS[act].includes(user.role)) {
    return json({ error: `Your role (${user.role}) doesn't have permission for that.` }, 403);
  }
  if (act === "whoami") return json({ ok: true, name: user.name, role: user.role });

  const by = ` (${user.name})`;
  const g = gh(token);

  try {
    switch (act) {

      case "save-pages": {
        if (!body.data || typeof body.data !== "object") return json({ error: "No content provided." }, 400);
        await putJson(g, "data/pages.json", body.data, `Update page text via admin${by}`);
        return json({ ok: true, message: "Saved. The site updates in about a minute." });
      }

      case "save-seo": {
        if (!Array.isArray(body.pages)) return json({ error: "No SEO data provided." }, 400);
        const seoEditable = new Set((await getRegistry(g)).map((p) => p.file));
        const updated = [];
        const problems = []; // pages we couldn't fetch, or whose markup lacked the expected tags
        for (const p of body.pages) {
          if (!p || !seoEditable.has(p.file)) continue;
          if (!p.title || !p.description) return json({ error: `${p.file}: every page needs a title and a description.` }, 400);
          const { sha, content } = await getFile(g, p.file);
          if (!content) { problems.push(p.file); continue; }
          const { html: next, missing } = applySeo(content, p);
          // A page missing its core tags is a real failure, not a no-op —
          // don't half-write it, and don't let it pass as "already matches".
          if (missing.length) { problems.push(p.file); continue; }
          if (next === content) continue; // genuinely already up to date
          await putFile(g, p.file, Buffer.from(next).toString("base64"), `Update SEO for ${p.file} via admin${by}`, sha);
          updated.push(p.file);
        }
        if (problems.length) {
          const saved = updated.length ? ` ${plural(updated.length, "other page")} saved.` : "";
          return json({
            error: `Couldn't update ${plural(problems.length, "page")} (${problems.join(", ")}) — its layout is missing the tags the editor expects.${saved}`,
          }, 422);
        }
        return json({
          ok: true,
          message: updated.length
            ? `SEO updated for ${plural(updated.length, "page")}. Live in about a minute.`
            : "No changes to save — everything already matches.",
        });
      }

      case "save-forms": {
        const { forms, formspreeId } = body;
        const results = { updatedForms: [], updatedFormspree: [] };
        const notFound = []; // forms the user tried to save but we couldn't locate in their page
        const FIELD_KEY_RE = /^[a-z][a-z0-9_]*$/;

        if (forms && typeof forms === "object") {
          for (const key of Object.keys(forms)) {
            const file = FORM_PAGES[key];
            const cfg = forms[key];
            if (!file || !cfg || !Array.isArray(cfg.fields) || !cfg.fields.length) continue;

            const badField = cfg.fields.find((f) => !FIELD_KEY_RE.test(f.key || ""));
            if (badField) return json({ error: `Bad field name: "${badField.key}". Use lowercase letters, numbers, and underscores.` }, 400);

            const { sha, content } = await getFile(g, file);
            const formRe = new RegExp(`(<form[^>]*data-form="${key}"[^>]*>)[\\s\\S]*?(<\\/form>)`);
            // If the page or its form can't be found, the save silently did
            // nothing before — surface it so the owner isn't told it worked.
            if (!content || !formRe.test(content)) { notFound.push(key); continue; }
            const next = content.replace(formRe, (m, open, close) => `${open}${renderFormBody(key, cfg)}${close}`);
            if (next === content) continue;
            await putFile(g, file, Buffer.from(next).toString("base64"), `Update ${key} form via admin`, sha);
            results.updatedForms.push(key);
          }
        }

        if (notFound.length) {
          return json({ error: `Couldn't find the ${notFound.join(" and ")} form on its page to update — the page layout may have changed.` }, 422);
        }

        if (formspreeId && /^[A-Za-z0-9]{6,}$/.test(formspreeId)) {
          results.updatedFormspree = await updateFormspreeIdEverywhere(g, formspreeId);
        } else if (formspreeId) {
          return json({ error: "That doesn't look like a valid Formspree form ID." }, 400);
        }

        const parts = [];
        if (results.updatedForms.length) parts.push(`${plural(results.updatedForms.length, "form")} updated`);
        if (results.updatedFormspree.length) parts.push(`Formspree ID applied to ${plural(results.updatedFormspree.length, "file")}`);
        return json({ ok: true, message: parts.length ? parts.join("; ") + ". Live in about a minute." : "No changes to save." });
      }

      case "upload-image": {
        const { filename, base64, caption } = body;
        if (!filename || !base64) return json({ error: "No image provided." }, 400);
        // Backstop the client-side compression: reject anything too large so a
        // failed resize (or a hand-crafted request) can't commit a huge blob.
        // ~4 MB decoded keeps the base64 payload under Netlify's ~6 MB
        // synchronous-function request limit.
        const approxBytes = Math.floor((String(base64).length * 3) / 4);
        if (approxBytes > 4 * 1024 * 1024) return json({ error: "That image is too large — please use one under 4 MB." }, 413);
        const safe = String(filename).toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
        const path = `assets/images/uploads/${Date.now()}-${safe}`;
        await putFile(g, path, base64, `Upload photo ${safe} via admin${by}`);

        const gallery = await getJson(g, "data/gallery.json", []);
        gallery.unshift({ src: path, caption: caption || "", date: new Date().toISOString().slice(0, 10) });
        await putJson(g, "data/gallery.json", gallery, `Update gallery via admin${by}`);
        return json({ ok: true, message: "Photo uploaded. Live in about a minute.", src: path, gallery });
      }

      case "save-gallery": {
        if (!Array.isArray(body.gallery)) return json({ error: "No gallery provided." }, 400);
        await putJson(g, "data/gallery.json", body.gallery, `Update gallery via admin${by}`);
        return json({ ok: true, message: "Gallery saved. Live in about a minute." });
      }

      case "save-post": {
        const post = body.post || {};
        // The slug the post was published under before this edit, or "" for a
        // brand-new post. Needed to tell "editing post X" apart from
        // "creating a post that happens to collide with X's slug", and to
        // clean up the old file/entry when an edit changes the slug.
        const previousSlug = typeof post.previousSlug === "string" ? post.previousSlug : "";

        // Normalise up front so whitespace-only fields don't pass as "present"
        // and so downstream (renderPost, the index entry) uses clean values.
        post.title = (post.title || "").trim();
        post.slug = (post.slug || "").trim();
        post.body = (post.body || "").trim();

        // Distinct, accurate messages: a non-technical owner shouldn't be told
        // "only lowercase letters" when the real issue is a missing or
        // too-short link name (e.g. a title with no Latin letters slugifies to
        // empty; a title like "Hi" slugifies to a 2-character slug).
        if (!post.title || !post.body) return json({ error: "A post needs a title and some body text." }, 400);
        if (!post.slug) return json({ error: "This post needs a web address (link name) — add a few lowercase letters, e.g. based on the title." }, 400);
        if (!/^[a-z0-9-]+$/.test(post.slug)) return json({ error: "The link name can only use lowercase letters, numbers, and hyphens." }, 400);
        if (post.slug.length < 3) return json({ error: "The link name is too short — please use at least 3 characters." }, 400);
        if (post.slug.length > 80) return json({ error: "The link name is too long — please keep it under 80 characters." }, 400);

        // Guard the date so a malformed value can't render "Invalid Date" on
        // the published page or poison the sitemap's <lastmod>.
        post.date = /^\d{4}-\d{2}-\d{2}$/.test(post.date || "") ? post.date : new Date().toISOString().slice(0, 10);

        const existingPosts = await getJson(g, "data/posts.json", []);
        const collision = existingPosts.find((p) => p.slug === post.slug && p.slug !== previousSlug);
        if (collision) {
          return json({ error: `The link name "${post.slug}" is already used by another post. Choose a different one.` }, 409);
        }

        const { content: template } = await getFile(g, "blog/template.html");
        if (!template) return json({ error: "blog/template.html is missing from the repo." }, 500);

        await putText(g, `blog/${post.slug}.html`, renderPost(template, post), `Publish blog post: ${post.title}${by}`);
        if (previousSlug && previousSlug !== post.slug) {
          await deleteFile(g, `blog/${previousSlug}.html`, `Rename blog post: ${previousSlug} -> ${post.slug}${by}`);
        }

        const posts = existingPosts.filter((p) => p.slug !== post.slug && p.slug !== previousSlug);
        posts.push({
          slug: post.slug, title: post.title, date: post.date,
          excerpt: post.excerpt || "", image: post.image || "", tags: post.tags || [],
          body: post.body, imageAlt: post.imageAlt || "",
        });
        posts.sort((a, b) => (a.date < b.date ? 1 : -1));
        await savePostIndex(g, posts, by, await getRegistry(g));
        return json({ ok: true, message: "Post published. Live in about a minute.", posts });
      }

      case "delete-post": {
        const { slug } = body;
        if (!slug || !/^[a-z0-9-]+$/.test(slug)) return json({ error: "Bad post reference." }, 400);
        await deleteFile(g, `blog/${slug}.html`, `Delete blog post: ${slug}${by}`);
        const posts = (await getJson(g, "data/posts.json", [])).filter((p) => p.slug !== slug);
        await savePostIndex(g, posts, by, await getRegistry(g));
        return json({ ok: true, message: "Post deleted. Gone from the live site in about a minute.", posts });
      }

      case "list-pages": {
        const registry = await getRegistry(g);
        const hidden = await getJson(g, "data/hidden-pages.json", {});
        const hiddenList = Object.entries(hidden).map(([file, v]) => ({
          file, label: v.label, prefix: v.prefix, hiddenAt: v.hiddenAt,
        }));
        return json({ ok: true, registry, hidden: hiddenList });
      }

      case "add-page": {
        const label = String(body.label || "").trim();
        if (!label) return json({ error: "Give the new page a name." }, 400);

        const file = slugifyFilename(body.file || label);
        if (!file) return json({ error: "That name doesn't produce a usable web address — try adding a letter or two." }, 400);
        if (file === "index.html") return json({ error: "index.html is the home page and already exists." }, 400);

        const registry = await getRegistry(g);
        const hidden = await getJson(g, "data/hidden-pages.json", {});
        if (registry.some((p) => p.file === file) || hidden[file]) {
          return json({ error: `A page already uses the address "${file}". Choose a different name.` }, 409);
        }

        const prefix = prefixFromFile(file);
        if (registry.some((p) => p.prefix === prefix)) {
          return json({ error: "That name is too close to an existing page internally — try a slightly different one." }, 409);
        }

        const mode = body.mode === "copy" ? "copy" : "blank";
        const donor = (mode === "copy" && body.sourceFile ? registry.find((p) => p.file === body.sourceFile) : null) || registry[0];
        if (!donor) return json({ error: "There's no existing page to build the new one from yet." }, 500);

        const { content: donorHtml } = await getFile(g, donor.file);
        if (!donorHtml) return json({ error: `${donor.file} is missing from the repo — can't use it as a starting point.` }, 500);

        let html = donorHtml
          .replace(new RegExp(`data-edit="${donor.prefix}\\.`, "g"), `data-edit="${prefix}.`)
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(label)}</title>`);
        if (mode === "blank") html = clearEditableText(html, prefix);

        const nextRegistry = [...registry, { file, prefix, label }];

        await putText(g, file, html, `Add page ${file} via admin${by}`);
        await putJson(g, "data/pages-registry.json", nextRegistry, `Add ${file} to navigation via admin${by}`);
        await syncNavAcrossPages(g, nextRegistry, by);

        return json({ ok: true, message: `"${label}" is live and in the menu. Edit its text from the Pages list.`, registry: nextRegistry });
      }

      case "hide-page": {
        const file = body.file;
        if (!file) return json({ error: "No page specified." }, 400);
        if (file === "index.html") return json({ error: "The home page can't be hidden." }, 400);

        const registry = await getRegistry(g);
        const entry = registry.find((p) => p.file === file);
        if (!entry) return json({ error: "That page isn't currently in the menu." }, 404);
        if (registry.length <= 1) return json({ error: "You need at least one visible page." }, 400);

        const { content } = await getFile(g, file);
        if (!content) return json({ error: `${file} is missing from the repo.` }, 500);

        const hidden = await getJson(g, "data/hidden-pages.json", {});
        hidden[file] = { html: content, prefix: entry.prefix, label: entry.label, hiddenAt: new Date().toISOString() };
        await putJson(g, "data/hidden-pages.json", hidden, `Hide page ${file} via admin${by}`);
        await deleteFile(g, file, `Take ${file} offline via admin${by}`);

        const nextRegistry = registry.filter((p) => p.file !== file);
        await putJson(g, "data/pages-registry.json", nextRegistry, `Remove ${file} from navigation via admin${by}`);
        await syncNavAcrossPages(g, nextRegistry, by);

        return json({ ok: true, message: `"${entry.label}" is offline now. Bring it back anytime from the Pages list.`, registry: nextRegistry });
      }

      case "show-page": {
        const file = body.file;
        if (!file) return json({ error: "No page specified." }, 400);

        const hidden = await getJson(g, "data/hidden-pages.json", {});
        const entry = hidden[file];
        if (!entry) return json({ error: "That page isn't hidden." }, 404);

        const registry = await getRegistry(g);
        if (registry.some((p) => p.file === file)) return json({ error: "That page is already live." }, 409);

        await putText(g, file, entry.html, `Restore page ${file} via admin${by}`);
        const nextRegistry = [...registry, { file, prefix: entry.prefix, label: entry.label }];
        await putJson(g, "data/pages-registry.json", nextRegistry, `Add ${file} back to navigation via admin${by}`);

        delete hidden[file];
        await putJson(g, "data/hidden-pages.json", hidden, `Remove ${file} from the hidden list via admin${by}`);
        await syncNavAcrossPages(g, nextRegistry, by);

        return json({ ok: true, message: `"${entry.label}" is back online.`, registry: nextRegistry });
      }

      default:
        return json({ error: "Unknown action." }, 400);
    }
  } catch (e) {
    // Log the real error server-side (visible in Netlify's function logs)
    // but never forward it to the client — it can contain repo paths and
    // GitHub's raw response body.
    console.error(e);
    const isConflict = e && (e.status === 409 || e.status === 422);
    return json(
      {
        error: isConflict
          ? "Someone else saved changes to this content just now. Reload the page and try again."
          : "Save failed. Try again in a moment.",
      },
      isConflict ? 409 : 502
    );
  }
};
