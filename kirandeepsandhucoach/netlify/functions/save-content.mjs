// Hand-coded CMS backend (Netlify Function).
// Authenticates with a password, then saves the edited page text by committing
// data/pages.json to the repo via the GitHub API. The site pages read this file
// at load time (see scripts/main.js) and swap in any edited text.
//
// Required Netlify environment variables:
//   ADMIN_PASSWORD  — the password the site owner types to log in at /admin
//   GITHUB_TOKEN    — a fine-grained PAT with "Contents: Read and write" on the repo
//
// REPO / BRANCH / PATH below assume this site is deployed from its own repo root.
// If it's deployed from a subfolder of a larger repo (as it is during initial
// development, inside ui-ux-pro-max-skill), update PATH to include that prefix
// and confirm BRANCH matches whatever branch Netlify actually deploys.

const REPO = "abztabz/kirandeepsandhucoach-site";
const BRANCH = "main";
const PATH = "data/pages.json";

export default async (req) => {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = process.env.GITHUB_TOKEN;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!token || !adminPassword) return json({ error: "Server not configured. Set ADMIN_PASSWORD and GITHUB_TOKEN in Netlify." }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

  const { password, data } = body || {};
  if (!password || password !== adminPassword) return json({ error: "Incorrect password." }, 401);
  if (!data || typeof data !== "object") return json({ error: "No content provided." }, 400);

  const api = `https://api.github.com/repos/${REPO}/contents/${PATH}`;
  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "kirandeepsandhu-cms",
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
      body: JSON.stringify({ message: "Update page text via admin", content, sha, branch: BRANCH }),
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
