// Tests for the CMS backend (netlify/functions/save-content.mjs) against a
// fake in-memory GitHub API. No dependencies beyond Node's built-in test
// runner, matching the rest of this site's zero-build-step approach.
//
// Run with:  node --test kirandeepsandhucoach/tests/
//
// Tests run sequentially (Node's default within a file) because they share
// one fake repo and build on each other's state (e.g. the rename test
// depends on the earlier "new post" test having created the post).

import { test } from "node:test";
import assert from "node:assert/strict";

process.env.ADMIN_PASSWORD = "adminpw123";
process.env.CMS_USERS = JSON.stringify([{ name: "Asha", password: "editorpw123", role: "editor" }]);
process.env.GITHUB_TOKEN = "fake-token";

const repo = new Map(); // path -> { content, sha }
let shaCounter = 0;

function seed(path, content) {
  repo.set(path, { content, sha: `sha-${++shaCounter}` });
}

seed("data/pages.json", JSON.stringify({ home_h1: "Hello" }));
seed("data/gallery.json", JSON.stringify([]));
seed("data/posts.json", JSON.stringify([{ slug: "existing-post", title: "Existing", date: "2024-01-01", body: "hi" }]));
seed("blog/template.html", "{{TITLE}} {{BODY}} {{SLUG}} {{DATE_ISO}} {{DATE_HUMAN}} {{HERO_HTML}} {{TAGS_META}} {{OG_IMAGE}} {{DESCRIPTION}}");
seed(
  "index.html",
  '<title>Home</title><meta name="description" content="old"><meta property="og:title" content="old">' +
    '<meta property="og:description" content="old"><form data-form="hero" data-formspree action="https://formspree.io/f/OLDID">' +
    '<div class="field"><label for="hero-name">Name</label><input id="hero-name" name="name" type="text" required></div>' +
    '<button type="submit">Go</button></form>'
);
for (const p of ["about", "blog", "gallery", "coaching", "training", "speaking", "testimonials", "contact"]) {
  seed(`${p}.html`, `<title>${p}</title><meta name="description" content="old">`);
}
seed("blog/existing-post.html", "old post content");

global.fetch = async (url, opts = {}) => {
  const u = new URL(url);
  const path = decodeURIComponent(u.pathname.replace(/^\/repos\/[^/]+\/[^/]+\/contents\/kirandeepsandhucoach\//, ""));
  const method = opts.method || "GET";

  if (method === "GET") {
    const f = repo.get(path);
    if (!f) return { ok: false, status: 404, json: async () => ({}), text: async () => "not found" };
    return { ok: true, status: 200, json: async () => ({ sha: f.sha, content: Buffer.from(f.content).toString("base64") }) };
  }
  if (method === "PUT") {
    const b = JSON.parse(opts.body);
    repo.set(path, { content: Buffer.from(b.content, "base64").toString("utf8"), sha: `sha-${++shaCounter}` });
    return { ok: true, status: 200, json: async () => ({}), text: async () => "" };
  }
  if (method === "DELETE") {
    repo.delete(path);
    return { ok: true, status: 200, json: async () => ({}), text: async () => "" };
  }
  throw new Error("unexpected method " + method);
};

const { default: handler } = await import("../netlify/functions/save-content.mjs");

function req(body, ip) {
  return {
    method: "POST",
    headers: { get: (k) => (k === "x-nf-client-connection-ip" ? (ip || "1.2.3.4") : null) },
    json: async () => body,
  };
}

async function call(body, ip) {
  const res = await handler(req(body, ip));
  return { status: res.status, body: await res.json() };
}

test("whoami: correct admin password succeeds", async () => {
  const r = await call({ action: "whoami", password: "adminpw123" });
  assert.equal(r.status, 200);
  assert.equal(r.body.role, "admin");
});

test("whoami: correct editor password succeeds with editor role", async () => {
  const r = await call({ action: "whoami", password: "editorpw123" });
  assert.equal(r.status, 200);
  assert.equal(r.body.role, "editor");
});

test("whoami: wrong password is rejected", async () => {
  const r = await call({ action: "whoami", password: "wrong" });
  assert.equal(r.status, 401);
});

test("save-pages: writes data/pages.json", async () => {
  const r = await call({ action: "save-pages", password: "adminpw123", data: { home_h1: "Updated" } });
  assert.equal(r.status, 200);
  assert.equal(JSON.parse(repo.get("data/pages.json").content).home_h1, "Updated");
});

test("upload-image: commits the photo and prepends it to the gallery", async () => {
  const r = await call({ action: "upload-image", password: "adminpw123", filename: "photo.jpg", base64: "AAAA", caption: "Event" });
  assert.equal(r.status, 200);
  assert.equal(r.body.gallery.length, 1);
  assert.equal(r.body.gallery[0].caption, "Event");
});

test("save-gallery: overwrites the gallery manifest", async () => {
  const r = await call({ action: "save-gallery", password: "adminpw123", gallery: [{ src: "a.jpg", caption: "x", date: "2024-01-01" }] });
  assert.equal(r.status, 200);
  assert.deepEqual(JSON.parse(repo.get("data/gallery.json").content)[0].src, "a.jpg");
});

test("save-post: publishes a new post with no slug collision", async () => {
  const r = await call({
    action: "save-post", password: "adminpw123",
    post: { title: "New Post", slug: "new-post", body: "Body text", previousSlug: "" },
  });
  assert.equal(r.status, 200);
  assert.ok(r.body.posts.some((p) => p.slug === "new-post"));
  assert.ok(repo.has("blog/new-post.html"));
});

test("save-post: colliding with a DIFFERENT existing post is rejected (409)", async () => {
  const r = await call({
    action: "save-post", password: "adminpw123",
    post: { title: "Dup", slug: "existing-post", body: "Body", previousSlug: "" },
  });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /already used/);
});

test("save-post: renaming a slug removes the old file and avoids a duplicate entry", async () => {
  const r = await call({
    action: "save-post", password: "adminpw123",
    post: { title: "New Post Renamed", slug: "new-post-renamed", body: "Body text", previousSlug: "new-post" },
  });
  assert.equal(r.status, 200);
  assert.ok(!repo.has("blog/new-post.html"), "old slug file should be removed");
  assert.ok(repo.has("blog/new-post-renamed.html"), "new slug file should exist");
  const posts = JSON.parse(repo.get("data/posts.json").content);
  assert.equal(posts.filter((p) => p.title === "New Post Renamed").length, 1);
});

test("delete-post: removes the post file and its index entry", async () => {
  const r = await call({ action: "delete-post", password: "adminpw123", slug: "existing-post" });
  assert.equal(r.status, 200);
  assert.ok(!repo.has("blog/existing-post.html"));
});

test("save-seo: updates multiple pages and reports a plural count", async () => {
  const r = await call({
    action: "save-seo", password: "adminpw123",
    pages: [
      { file: "about.html", title: "About Us", description: "About description" },
      { file: "index.html", title: "Home", description: "Home description" },
    ],
  });
  assert.equal(r.status, 200);
  assert.match(r.body.message, /2 pages/);
  assert.match(repo.get("about.html").content, /<title>About Us<\/title>/);
});

test("save-seo: re-saving identical values reports no changes", async () => {
  const r = await call({
    action: "save-seo", password: "adminpw123",
    pages: [{ file: "about.html", title: "About Us", description: "About description" }],
  });
  assert.match(r.body.message, /No changes/);
});

test("save-forms: rejects a bad field key without writing anything", async () => {
  const before = repo.get("index.html").content;
  const r = await call({
    action: "save-forms", password: "adminpw123",
    forms: { hero: { fields: [{ key: "1bad", label: "Bad", type: "text" }], submitText: "Go" } },
  });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /Bad field name/);
  assert.equal(repo.get("index.html").content, before);
});

test("save-forms: applies a valid field update", async () => {
  const r = await call({
    action: "save-forms", password: "adminpw123",
    forms: { hero: { fields: [{ key: "name", label: "Full name", type: "text", required: true }], submitText: "Send" } },
  });
  assert.equal(r.status, 200);
  assert.match(r.body.message, /1 form/);
  assert.match(repo.get("index.html").content, /Full name/);
});

test("save-forms: propagates a Formspree ID to every relevant file", async () => {
  const r = await call({ action: "save-forms", password: "adminpw123", formspreeId: "abc123xyz" });
  assert.equal(r.status, 200);
  assert.match(repo.get("index.html").content, /formspree\.io\/f\/abc123xyz/);
  assert.match(r.body.message, /file/);
});

test("permissions: editor cannot use save-seo (admin-only action)", async () => {
  const r = await call({ action: "save-seo", password: "editorpw123", pages: [] });
  assert.equal(r.status, 403);
});

test("rate limiting: repeated wrong passwords from the same IP get locked out", async () => {
  // Dedicated IP so exhausting attempts here doesn't lock out the shared
  // "1.2.3.4" IP every other test in this file uses.
  const ip = "9.9.9.9";
  let lastStatus;
  for (let i = 0; i < 10; i++) {
    const r = await call({ action: "whoami", password: "still-wrong" }, ip);
    lastStatus = r.status;
  }
  assert.equal(lastStatus, 429);
});

test("error handling: a GitHub write conflict (409) gets a friendly message with no leaked internals", async () => {
  const realFetch = global.fetch;
  global.fetch = async (url, opts = {}) => {
    if ((opts.method || "GET") === "PUT") {
      return { ok: false, status: 409, json: async () => ({}), text: async () => "sha mismatch — raw github response body" };
    }
    return realFetch(url, opts);
  };
  try {
    const r = await call({ action: "save-pages", password: "adminpw123", data: { home_h1: "Conflicted" } });
    assert.equal(r.status, 409);
    assert.match(r.body.error, /Someone else saved changes/);
    assert.doesNotMatch(JSON.stringify(r.body), /sha mismatch|GitHub PUT|raw github/);
  } finally {
    global.fetch = realFetch;
  }
});

test("error handling: a non-conflict GitHub failure (500) gets a generic message with no leaked internals", async () => {
  const realFetch = global.fetch;
  global.fetch = async (url, opts = {}) => {
    if ((opts.method || "GET") === "PUT") {
      return { ok: false, status: 500, json: async () => ({}), text: async () => "internal server meltdown, path/repo leaked here" };
    }
    return realFetch(url, opts);
  };
  try {
    const r = await call({ action: "save-pages", password: "adminpw123", data: { home_h1: "Boom" } });
    assert.equal(r.status, 502);
    assert.match(r.body.error, /Save failed/);
    assert.doesNotMatch(JSON.stringify(r.body), /meltdown|GitHub PUT|repo leaked/);
  } finally {
    global.fetch = realFetch;
  }
});
