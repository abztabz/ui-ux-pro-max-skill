// Hand-coded CMS backend (Netlify Function).
// Authenticates with a password, then saves edits by committing to the repo via
// the GitHub API. The site reads the committed JSON files and uploaded images.
//
// Required Netlify environment variables:
//   ADMIN_PASSWORD  — the password Amit types to log in
//   GITHUB_TOKEN    — a fine-grained PAT with "Contents: Read and write" on the repo

const REPO = "abztabz/ui-ux-pro-max-skill";
// Commit edits to the branch Netlify actually publishes (the live site deploys
// from this branch), so saved content goes live automatically after each save.
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

export default async (req) => {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return json({ error: "Server not configured. Set ADMIN_PASSWORD in Netlify." }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

  const { password, type, data } = body || {};
  if (!password || password !== adminPassword) return json({ error: "Incorrect password." }, 401);

  // Login check: the /admin page calls this to verify the password before
  // showing the editor. Only needs ADMIN_PASSWORD (no GitHub token required).
  if (type === "verify") return json({ ok: true });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return json({ error: "Server not configured. Set GITHUB_TOKEN in Netlify." }, 500);

  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "amit-cms",
    Accept: "application/vnd.github+json",
  };

  // Look up an existing file's SHA (required to overwrite); undefined if new.
  const getSha = async (path) => {
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`, { headers: ghHeaders });
      if (r.ok) return (await r.json()).sha;
    } catch { /* treat as new file */ }
    return undefined;
  };
  // Create/overwrite a file with base64 content.
  const putFile = (path, contentB64, message, sha) => {
    const payload = { message, content: contentB64, branch: BRANCH };
    if (sha) payload.sha = sha;
    return fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
      method: "PUT",
      headers: { ...ghHeaders, "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  // --- Image upload: commit a (compressed) image and return its public path ---
  if (type === "image") {
    const { name, dataBase64 } = body;
    if (!name || !dataBase64) return json({ error: "No image provided." }, 400);
    const safe = String(name).replace(/[^a-zA-Z0-9._-]/g, "").slice(-80);
    if (!safe) return json({ error: "Bad image name." }, 400);
    const path = `docs/images/uploads/${safe}`;
    try {
      const sha = await getSha(path); // normally a new file → undefined
      const putRes = await putFile(path, dataBase64, `Upload image ${safe} via admin`, sha);
      if (!putRes.ok) {
        const detail = await putRes.text();
        return json({ error: "Upload failed.", status: putRes.status, detail }, 502);
      }
    } catch (e) {
      return json({ error: "Upload failed.", detail: String(e) }, 502);
    }
    return json({ ok: true, path: `images/uploads/${safe}`, message: "Image uploaded." });
  }

  // --- JSON content (events, testimonials, essays, pages, images map) ---
  const path = ALLOWED[type];
  if (!path) return json({ error: "Unknown content type." }, 400);
  if (!data || typeof data !== "object") return json({ error: "No content provided." }, 400);

  const content = Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64");
  try {
    const sha = await getSha(path);
    const putRes = await putFile(path, content, `Update ${type} via admin`, sha);
    if (!putRes.ok) {
      const detail = await putRes.text();
      return json({ error: "Save failed.", status: putRes.status, detail }, 502);
    }
  } catch (e) {
    return json({ error: "Save failed.", detail: String(e) }, 502);
  }

  return json({ ok: true, message: "Saved. The site updates in about a minute." });
};
