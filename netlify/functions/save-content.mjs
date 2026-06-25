// Hand-coded CMS backend (Netlify Function).
// Authenticates with a password, then saves the edited content by committing
// the JSON file to the repo via the GitHub API. The site reads these JSON files.
//
// Required Netlify environment variables:
//   ADMIN_PASSWORD  — the password Amit types to log in
//   GITHUB_TOKEN    — a fine-grained PAT with "Contents: Read and write" on the repo

const REPO = "abztabz/ui-ux-pro-max-skill";
const BRANCH = "main";
const ALLOWED = {
  events: "docs/data/events.json",
  testimonials: "docs/data/testimonials.json",
  essays: "docs/data/essays.json",
  pages: "docs/data/pages.json",
};

export default async (req) => {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = process.env.GITHUB_TOKEN;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!token || !adminPassword) return json({ error: "Server not configured. Set ADMIN_PASSWORD and GITHUB_TOKEN in Netlify." }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

  const { password, type, data } = body || {};
  if (!password || password !== adminPassword) return json({ error: "Incorrect password." }, 401);

  const path = ALLOWED[type];
  if (!path) return json({ error: "Unknown content type." }, 400);
  if (!data || typeof data !== "object") return json({ error: "No content provided." }, 400);

  const api = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "amit-cms",
    Accept: "application/vnd.github+json",
  };

  // Get the current file SHA (required to update an existing file)
  let sha;
  try {
    const getRes = await fetch(`${api}?ref=${BRANCH}`, { headers: ghHeaders });
    if (getRes.ok) sha = (await getRes.json()).sha;
  } catch (e) {
    return json({ error: "Could not reach GitHub.", detail: String(e) }, 502);
  }

  const content = Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64");
  try {
    const putRes = await fetch(api, {
      method: "PUT",
      headers: { ...ghHeaders, "content-type": "application/json" },
      body: JSON.stringify({ message: `Update ${type} via admin`, content, sha, branch: BRANCH }),
    });
    if (!putRes.ok) {
      const detail = await putRes.text();
      return json({ error: "Save failed.", status: putRes.status, detail }, 502);
    }
  } catch (e) {
    return json({ error: "Save failed.", detail: String(e) }, 502);
  }

  return json({ ok: true, message: "Saved. The site updates in about a minute." });
};
