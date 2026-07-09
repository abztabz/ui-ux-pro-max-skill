// DEMO-ONLY stand-in for netlify/functions/save-content.mjs, used solely when
// this site is previewed on Vercel (which can't run Netlify Functions).
// Any password logs in as admin; every save reports success without writing
// anywhere. Safe to delete once Vercel preview is no longer needed — the
// real backend (Netlify) is unaffected by this file's presence.

const MESSAGES = {
  "save-pages": "Saved. The site updates in about a minute.",
  "save-seo": "SEO updated. Live in about a minute.",
  "save-forms": "Form settings updated. Live in about a minute.",
  "upload-image": "Photo uploaded. Live in about a minute.",
  "save-gallery": "Gallery saved. Live in about a minute.",
  "save-post": "Post published. Live in about a minute.",
  "delete-post": "Post deleted. Gone from the live site in about a minute.",
};

module.exports = (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};
  const { action, password } = body;
  if (!password) return res.status(401).json({ error: "Incorrect password." });

  const act = action || "save-pages";
  if (act === "whoami") return res.status(200).json({ ok: true, name: "Demo Admin", role: "admin" });

  const message = MESSAGES[act] || "Saved (demo mode).";
  const extra = {};
  if (act === "upload-image") {
    extra.src = "assets/images/uploads/demo-preview.jpg";
    extra.gallery = Array.isArray(body.gallery) ? body.gallery : [];
  }
  if (act === "save-post" || act === "delete-post") {
    extra.posts = Array.isArray(body.posts) ? body.posts : [];
  }

  res.status(200).json({
    ok: true,
    name: "Demo Admin",
    role: "admin",
    message: `${message} (Demo mode: this didn't really save anywhere.)`,
    ...extra,
  });
};
