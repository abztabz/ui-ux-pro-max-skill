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
//
// Required Netlify environment variables:
//   ADMIN_PASSWORD  — the password the site owner types to log in at /admin
//   GITHUB_TOKEN    — a fine-grained PAT with "Contents: Read and write" on the repo
//
// This site currently lives nested inside ui-ux-pro-max-skill; DIR prefixes every
// committed path. BRANCH assumes Netlify deploys from "main" — if it deploys from
// another branch, update BRANCH or edits will land where nothing serves them.

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
  if (!res.ok) throw new Error(`GitHub PUT ${path} → ${res.status}: ${await res.text()}`);
}

async function putText(g, path, text, message) {
  const { sha } = await getFile(g, path);
  await putFile(g, path, Buffer.from(text).toString("base64"), message, sha);
}

async function deleteFile(g, path, message) {
  const { sha } = await getFile(g, path);
  if (!sha) return;
  const res = await fetch(g.api(path), {
    method: "DELETE",
    headers: { ...g.headers, "content-type": "application/json" },
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) throw new Error(`GitHub DELETE ${path} → ${res.status}: ${await res.text()}`);
}

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

// ---------- handler ----------

export default async (req) => {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = process.env.GITHUB_TOKEN;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!token || !adminPassword) return json({ error: "Server not configured. Set ADMIN_PASSWORD and GITHUB_TOKEN in Netlify." }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

  const { password, action } = body || {};
  if (!password || password !== adminPassword) return json({ error: "Incorrect password." }, 401);

  const g = gh(token);

  try {
    switch (action || "save-pages") {

      case "save-pages": {
        if (!body.data || typeof body.data !== "object") return json({ error: "No content provided." }, 400);
        await putText(g, "data/pages.json", JSON.stringify(body.data, null, 2) + "\n", "Update page text via admin");
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
          await putFile(g, p.file, Buffer.from(next).toString("base64"), `Update SEO for ${p.file} via admin`, sha);
          updated.push(p.file);
        }
        return json({
          ok: true,
          message: updated.length
            ? `SEO updated for ${updated.length} page${updated.length === 1 ? "" : "s"}. Live in about a minute.`
            : "No changes to save — everything already matches.",
        });
      }

      case "upload-image": {
        const { filename, base64, caption } = body;
        if (!filename || !base64) return json({ error: "No image provided." }, 400);
        const safe = String(filename).toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
        const path = `assets/images/uploads/${Date.now()}-${safe}`;
        await putFile(g, path, base64, `Upload photo ${safe} via admin`);

        const { content } = await getFile(g, "data/gallery.json");
        const gallery = content ? JSON.parse(content) : [];
        gallery.unshift({ src: path, caption: caption || "", date: new Date().toISOString().slice(0, 10) });
        await putText(g, "data/gallery.json", JSON.stringify(gallery, null, 2) + "\n", "Update gallery via admin");
        return json({ ok: true, message: "Photo uploaded. Live in about a minute.", src: path, gallery });
      }

      case "save-gallery": {
        if (!Array.isArray(body.gallery)) return json({ error: "No gallery provided." }, 400);
        await putText(g, "data/gallery.json", JSON.stringify(body.gallery, null, 2) + "\n", "Update gallery via admin");
        return json({ ok: true, message: "Gallery saved. Live in about a minute." });
      }

      case "save-post": {
        const post = body.post || {};
        if (!post.title || !post.slug || !post.body) return json({ error: "A post needs at least a title, a link name, and body text." }, 400);
        if (!/^[a-z0-9-]{3,80}$/.test(post.slug)) return json({ error: "Link name can only use lowercase letters, numbers, and hyphens." }, 400);
        post.date = post.date || new Date().toISOString().slice(0, 10);

        const { content: template } = await getFile(g, "blog/template.html");
        if (!template) return json({ error: "blog/template.html is missing from the repo." }, 500);

        await putText(g, `blog/${post.slug}.html`, renderPost(template, post), `Publish blog post: ${post.title}`);

        const { content } = await getFile(g, "data/posts.json");
        const posts = (content ? JSON.parse(content) : []).filter((p) => p.slug !== post.slug);
        posts.push({
          slug: post.slug, title: post.title, date: post.date,
          excerpt: post.excerpt || "", image: post.image || "", tags: post.tags || [],
          body: post.body, imageAlt: post.imageAlt || "",
        });
        posts.sort((a, b) => (a.date < b.date ? 1 : -1));
        await putText(g, "data/posts.json", JSON.stringify(posts, null, 2) + "\n", "Update blog index via admin");
        await putText(g, "sitemap.xml", renderSitemap(posts), "Update sitemap via admin");
        return json({ ok: true, message: "Post published. Live in about a minute.", posts });
      }

      case "delete-post": {
        const { slug } = body;
        if (!slug || !/^[a-z0-9-]+$/.test(slug)) return json({ error: "Bad post reference." }, 400);
        await deleteFile(g, `blog/${slug}.html`, `Delete blog post: ${slug}`);
        const { content } = await getFile(g, "data/posts.json");
        const posts = (content ? JSON.parse(content) : []).filter((p) => p.slug !== slug);
        await putText(g, "data/posts.json", JSON.stringify(posts, null, 2) + "\n", "Update blog index via admin");
        await putText(g, "sitemap.xml", renderSitemap(posts), "Update sitemap via admin");
        return json({ ok: true, message: "Post deleted. Gone from the live site in about a minute.", posts });
      }

      default:
        return json({ error: "Unknown action." }, 400);
    }
  } catch (e) {
    return json({ error: "Save failed.", detail: String(e) }, 502);
  }
};
