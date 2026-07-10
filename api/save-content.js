// Vercel API route for CMS backend - validates passwords and returns auth status
import { createHash, timingSafeEqual } from "crypto";

const ROLES = ["admin", "editor", "contributor"];

function passwordsMatch(a, b) {
  if (!a || !b) return false;
  const digestA = createHash("sha256").update(String(a)).digest();
  const digestB = createHash("sha256").update(String(b)).digest();
  try {
    return timingSafeEqual(digestA, digestB);
  } catch {
    return false;
  }
}

function findUser(password) {
  if (!password) return null;
  if (process.env.ADMIN_PASSWORD && passwordsMatch(password, process.env.ADMIN_PASSWORD)) {
    return { name: "Admin", role: "admin" };
  }
  let users = [];
  try {
    users = JSON.parse(process.env.CMS_USERS || "[]");
  } catch {
    return null;
  }
  const hit = users.find((u) => u.password && passwordsMatch(password, u.password));
  if (!hit) return null;
  return {
    name: hit.name || "User",
    role: ROLES.includes(hit.role) ? hit.role : "contributor",
  };
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const { action, password } = body;

  if (!password) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  const user = findUser(password);
  if (!user) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  // For whoami, just return the user info
  if (action === "whoami") {
    return res.status(200).json({
      ok: true,
      name: user.name,
      role: user.role,
    });
  }

  // For other actions, return a message (backend not fully implemented yet)
  const messages = {
    "save-pages": "Saved (API not fully implemented).",
    "save-seo": "SEO updated (API not fully implemented).",
    "save-forms": "Forms updated (API not fully implemented).",
    "upload-image": "Photo uploaded (API not fully implemented).",
    "save-gallery": "Gallery saved (API not fully implemented).",
    "save-post": "Post published (API not fully implemented).",
    "delete-post": "Post deleted (API not fully implemented).",
  };

  return res.status(200).json({
    ok: true,
    name: user.name,
    role: user.role,
    message: messages[action] || "Action completed (API not fully implemented).",
  });
}
