// Cloudflare Pages Function — CMS backend (mirror of the Netlify version).
// Endpoint: POST /save-content
//
// Required Cloudflare Pages environment variables:
//   ADMIN_PASSWORD  — the password Amit types to log in
//   GITHUB_TOKEN    — a fine-grained PAT with "Contents: Read and write" on the repo

const REPO = "abztabz/ui-ux-pro-max-skill";
// Commit edits to the branch the live site deploys from, so saved content goes
// live automatically after each save.
const BRANCH = "claude/amit-leadership-coach-site-jjlvx5";
const ALLOWED = {
  events: "docs/data/events.json",
  testimonials: "docs/data/testimonials.json",
  essays: "docs/data/essays.json",
  pages: "docs/data/pages.json",
  images: "docs/data/images.json",
  seo: "docs/data/seo.json",
  quiz: "docs/data/quiz.json",
};

// Base64-encode a UTF-8 string (no Node Buffer in the Workers runtime).
function toBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

  const adminPassword = env.ADMIN_PASSWORD;
  if (!adminPassword) return json({ error: "Server not configured. Set ADMIN_PASSWORD in Cloudflare." }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }

  const { password, type, data } = body || {};
  if (!password || password !== adminPassword) return json({ error: "Incorrect password." }, 401);

  // Login check from /admin — only needs the password, no GitHub token.
  if (type === "verify") return json({ ok: true });

  const token = env.GITHUB_TOKEN;
  if (!token) return json({ error: "Server not configured. Set GITHUB_TOKEN in Cloudflare." }, 500);

  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "amit-cms",
    Accept: "application/vnd.github+json",
  };
  const getSha = async (path) => {
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`, { headers: ghHeaders });
      if (r.ok) return (await r.json()).sha;
    } catch { /* treat as new file */ }
    return undefined;
  };
  const putFile = (path, contentB64, message, sha) => {
    const payload = { message, content: contentB64, branch: BRANCH };
    if (sha) payload.sha = sha;
    return fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
      method: "PUT",
      headers: { ...ghHeaders, "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  // Image upload — client sends base64 already, so no re-encoding needed.
  if (type === "image") {
    const { name, dataBase64 } = body;
    if (!name || !dataBase64) return json({ error: "No image provided." }, 400);
    const safe = String(name).replace(/[^a-zA-Z0-9._-]/g, "").slice(-80);
    if (!safe) return json({ error: "Bad image name." }, 400);
    const path = `docs/images/uploads/${safe}`;
    try {
      const sha = await getSha(path);
      const r = await putFile(path, dataBase64, `Upload image ${safe} via admin`, sha);
      if (!r.ok) { const detail = await r.text(); return json({ error: "Upload failed.", status: r.status, detail }, 502); }
    } catch (e) { return json({ error: "Upload failed.", detail: String(e) }, 502); }
    return json({ ok: true, path: `images/uploads/${safe}`, message: "Image uploaded." });
  }

  // JSON content
  const path = ALLOWED[type];
  if (!path) return json({ error: "Unknown content type." }, 400);
  if (!data || typeof data !== "object") return json({ error: "No content provided." }, 400);

  const content = toBase64Utf8(JSON.stringify(data, null, 2) + "\n");
  try {
    const sha = await getSha(path);
    const r = await putFile(path, content, `Update ${type} via admin`, sha);
    if (!r.ok) { const detail = await r.text(); return json({ error: "Save failed.", status: r.status, detail }, 502); }
  } catch (e) { return json({ error: "Save failed.", detail: String(e) }, 502); }

  return json({ ok: true, message: "Saved. The site updates in about a minute." });
}
