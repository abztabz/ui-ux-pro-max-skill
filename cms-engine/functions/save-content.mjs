// CMS Engine — serverless backend (Netlify Function / any Web-Fetch handler).
//
// A hand-coded, dependency-free CMS that commits content straight to a GitHub
// repo via the Contents API. Everything site-specific is in ../cms.config.mjs;
// this file is the reusable engine and rarely needs editing.
//
// Password-gated actions:
//   whoami        — resolve the caller's name + role (used by the login screen)
//   save-pages    — commit edited page text (data/pages.json)
//   save-seo      — rewrite <title>/description/keywords/og tags inside the
//                   static page HTML files themselves (crawler-visible, no JS)
//   upload-image  — commit a photo (assets/images/uploads/…) + gallery manifest
//   save-gallery  — commit the gallery manifest alone (captions, deletes, order)
//   save-post     — generate an HTML page for a blog post from
//                   blog/template.html, commit it + data/posts.json + sitemap.xml
//   delete-post   — remove a post page + update posts.json + sitemap.xml
//   save-forms    — rewrite named form fields inside their pages, and/or set a
//                   Formspree ID across every form on the site at once
//
// Required environment variables:
//   GITHUB_TOKEN    — a fine-grained PAT with "Contents: Read and write" on the repo
//   ADMIN_PASSWORD  — the owner's password (always an admin)
// Optional:
//   CMS_USERS       — JSON array of extra users, each with their own password
//                     and role, e.g.
//                     [{"name":"Owner","password":"…","role":"admin"},
//                      {"name":"Editor","password":"…","role":"editor"},
//                      {"name":"Writer","password":"…","role":"contributor"}]
//                     Roles: admin (everything) · editor (text/photos/blog,
//                     no SEO/forms) · contributor (write posts + upload photos).
//                     Passwords identify the person, so keep them unique.
//   Plus the CMS_* config overrides documented in cms.config.mjs.

import { timingSafeEqual, createHash } from "node:crypto";
import { config } from "../cms.config.mjs";

const gh = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "User-Agent": "cms-engine",
    Accept: "application/vnd.github+json",
  },
  api: (path) => `https://api.github.com/repos/${config.repo}/contents/${config.dir}${path}`,
});

async function getFile(g, path) {
  const res = await fetch(`${g.api(path)}?ref=${config.branch}`, { headers: g.headers });
  if (!res.ok) return { sha: undefined, content: null };
  const body = await res.json();
  return { sha: body.sha, content: Buffer.from(body.content || "", "base64").toString("utf8") };
}

async function putFile(g, path, contentB64, message, sha) {
  const res = await fetch(g.api(path), {
    method: "PUT",
    headers: { ...g.headers, "content-type": "application/json" },
    body: JSON.stringify({ message, content: contentB64, branch: config.branch, ...(sha ? { sha } : {}) }),
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
    body: JSON.stringify({ message, sha, branch: config.branch }),
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

// Shared tail of save-post/delete-post: both end by rewriting the blog index
// and the sitemap to match the new post list.
async function savePostIndex(g, posts, by) {
  await putJson(g, "data/posts.json", posts, `Update blog index via admin${by}`);
  await putText(g, "sitemap.xml", renderSitemap(posts), `Update sitemap via admin${by}`);
}

function renderSitemap(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const pageUrl = (p) => `${config.siteUrl}/${p === "index.html" ? "" : p}`;
  const urls = config.pages
    .map((p) => `  <url><loc>${pageUrl(p)}</loc><lastmod>${today}</lastmod></url>`)
    .concat(
      posts.map(
        (p) => `  <url><loc>${config.siteUrl}/blog/${p.slug}.html</loc><lastmod>${p.date}</lastmod></url>`
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
    .replaceAll("{{OG_IMAGE}}", post.image ? `${config.siteUrl}/${post.image}` : `${config.siteUrl}/${config.defaultOgImage}`)
    .replaceAll("{{BODY}}", bodyToHtml(post.body));
}

// ---------- SEO helpers ----------

const SEO_EDITABLE = new Set(config.pages);

// Rewrite the SEO tags inside a page's HTML. Returns { html, missing } — the
// updated text plus a list of required tags that had no anchor to replace.
// Reporting `missing` lets the caller tell "already correct" apart from "this
// page's markup doesn't contain the tag we expected," instead of silently
// claiming success when a regex quietly matched nothing.
function applySeo(html, { title, description, keywords, image }) {
  const escT = escapeHtml(title);
  const escD = escapeHtml(description);
  const missing = [];

  // Replace an anchor if present; otherwise record it as missing and leave the
  // HTML untouched. (These regexes have no /g flag, so `.test()` is safe to
  // call before `.replace()` without disturbing lastIndex.)
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
    const abs = /^https?:\/\//.test(img) ? img : `${config.siteUrl}/${img}`;
    if (/<meta property="og:image"/.test(out)) {
      out = out.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${abs}$2`);
    } else {
      out = out.replace(/(<meta property="og:description"[^>]*>)/, `$1\n<meta property="og:image" content="${abs}">`);
    }
  }
  return { html: out, missing };
}

// ---------- form helpers ----------

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
  return `\n${fields}\n          <input class="field-hp" type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">\n          <button class="${config.formButtonClass}" type="submit">${escapeHtml(cfg.submitText || "Submit")}</button>\n          <p class="form-status" role="status" aria-live="polite"></p>\n        `;
}

// Point every <form data-formspree> on the site (configured pages, the post
// template, and every already-published post) at one real endpoint.
async function updateFormspreeIdEverywhere(g, id) {
  const re = /(data-formspree[^>]*action="https:\/\/formspree\.io\/f\/)[^"]*(")/g;
  const posts = await getJson(g, "data/posts.json", []);
  const paths = [...config.formspreePages, "blog/template.html", ...posts.map((p) => `blog/${p.slug}.html`)];

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
};

// Constant-time string compare. Hashing first makes both inputs a fixed
// 32-byte digest, so timingSafeEqual never takes the length-mismatch fast path
// that would otherwise leak the real password's length.
function passwordsMatch(a, b) {
  if (!a || !b) return false;
  const digestA = createHash("sha256").update(String(a)).digest();
  const digestB = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(digestA, digestB);
}

// Best-effort brute-force throttle. State is per-warm-container only (it resets
// on cold start and isn't shared across concurrent instances), so this slows a
// single attacker hammering one warm function, not a distributed attack — a
// real guarantee needs an external store (e.g. Netlify Blobs) keyed by IP,
// which isn't wired up here.
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
    return json({ error: "Server not configured. Set GITHUB_TOKEN plus ADMIN_PASSWORD (and optionally CMS_USERS)." }, 500);
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
        const updated = [];
        const problems = []; // pages we couldn't fetch, or whose markup lacked the expected tags
        for (const p of body.pages) {
          if (!p || !SEO_EDITABLE.has(p.file)) continue;
          if (!p.title || !p.description) return json({ error: `${p.file}: every page needs a title and a description.` }, 400);
          const { sha, content } = await getFile(g, p.file);
          if (!content) { problems.push(p.file); continue; }
          const { html: next, missing } = applySeo(content, p);
          // A page missing its core tags is a real failure, not a no-op — don't
          // half-write it, and don't let it pass as "already matches".
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
            const file = config.formPages[key];
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
        const approxBytes = Math.floor((String(base64).length * 3) / 4);
        if (approxBytes > config.maxUploadBytes) {
          return json({ error: `That image is too large — please use one under ${Math.round(config.maxUploadBytes / (1024 * 1024))} MB.` }, 413);
        }
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
        // brand-new post. Needed to tell "editing post X" apart from "creating a
        // post that happens to collide with X's slug", and to clean up the old
        // file/entry when an edit changes the slug.
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

        // Guard the date so a malformed value can't render "Invalid Date" on the
        // published page or poison the sitemap's <lastmod>.
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
        await savePostIndex(g, posts, by);
        return json({ ok: true, message: "Post published. Live in about a minute.", posts });
      }

      case "delete-post": {
        const { slug } = body;
        if (!slug || !/^[a-z0-9-]+$/.test(slug)) return json({ error: "Bad post reference." }, 400);
        await deleteFile(g, `blog/${slug}.html`, `Delete blog post: ${slug}${by}`);
        const posts = (await getJson(g, "data/posts.json", [])).filter((p) => p.slug !== slug);
        await savePostIndex(g, posts, by);
        return json({ ok: true, message: "Post deleted. Gone from the live site in about a minute.", posts });
      }

      default:
        return json({ error: "Unknown action." }, 400);
    }
  } catch (e) {
    // Log the real error server-side (visible in the host's function logs) but
    // never forward it to the client — it can contain repo paths and GitHub's
    // raw response body.
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
