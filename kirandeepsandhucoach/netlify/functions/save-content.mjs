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

// Body text → HTML: blank-line-separated paragraphs; a line starting with
// "## " becomes a subheading. <em>/<strong>/<a> written by the editor pass through.
function bodyToHtml(text) {
  return String(text)
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) =>
      chunk.startsWith("## ")
        ? `<h2>${chunk.slice(3).trim()}</h2>`
        : `<p>${chunk.replace(/\n/g, "<br>")}</p>`
    )
    .join("\n      ");
}

// Shared tail of save-post/delete-post: both end by rewriting the blog
// index and the sitemap to match the new post list.
async function savePostIndex(g, posts, by) {
  await putJson(g, "data/posts.json", posts, `Update blog index via admin${by}`);
  await putText(g, "sitemap.xml", renderSitemap(posts), `Update sitemap via admin${by}`);
}

function renderSitemap(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = STATIC_PAGES.map(
    (p) => `  <url><loc>${SITE_URL}/${p}</loc><lastmod>${today}</lastmod></url>`
  ).concat(
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

// ---------- SEO helpers ----------

const SEO_EDITABLE = new Set(STATIC_PAGES.filter(Boolean).concat(["index.html"]));

// Rewrite the SEO tags inside a page's HTML. Returns the updated text, or the
// original unchanged if every value already matches.
function applySeo(html, { title, description, keywords, image }) {
  const escT = escapeHtml(title);
  const escD = escapeHtml(description);
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escT}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escD}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escT}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escD}$2`);

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
  return out;
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
        const updated = [];
        for (const p of body.pages) {
          if (!p || !SEO_EDITABLE.has(p.file)) continue;
          if (!p.title || !p.description) return json({ error: `${p.file}: every page needs a title and a description.` }, 400);
          const { sha, content } = await getFile(g, p.file);
          if (!content) continue;
          const next = applySeo(content, p);
          if (next === content) continue; // nothing changed for this page
          await putFile(g, p.file, Buffer.from(next).toString("base64"), `Update SEO for ${p.file} via admin${by}`, sha);
          updated.push(p.file);
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
        const FIELD_KEY_RE = /^[a-z][a-z0-9_]*$/;

        if (forms && typeof forms === "object") {
          for (const key of Object.keys(forms)) {
            const file = FORM_PAGES[key];
            const cfg = forms[key];
            if (!file || !cfg || !Array.isArray(cfg.fields) || !cfg.fields.length) continue;

            const badField = cfg.fields.find((f) => !FIELD_KEY_RE.test(f.key || ""));
            if (badField) return json({ error: `Bad field name: "${badField.key}". Use lowercase letters, numbers, and underscores.` }, 400);

            const { sha, content } = await getFile(g, file);
            if (!content) continue;
            const formRe = new RegExp(`(<form[^>]*data-form="${key}"[^>]*>)[\\s\\S]*?(<\\/form>)`);
            if (!formRe.test(content)) continue;
            const next = content.replace(formRe, (m, open, close) => `${open}${renderFormBody(key, cfg)}${close}`);
            if (next === content) continue;
            await putFile(g, file, Buffer.from(next).toString("base64"), `Update ${key} form via admin`, sha);
            results.updatedForms.push(key);
          }
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
        if (!post.title || !post.slug || !post.body) return json({ error: "A post needs at least a title, a link name, and body text." }, 400);
        if (!/^[a-z0-9-]{3,80}$/.test(post.slug)) return json({ error: "Link name can only use lowercase letters, numbers, and hyphens." }, 400);
        post.date = post.date || new Date().toISOString().slice(0, 10);

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
