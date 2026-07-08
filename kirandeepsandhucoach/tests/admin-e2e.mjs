// End-to-end check of the admin dashboard (admin/index.html) against a
// mocked backend, using Playwright + a plain static file server. Optional —
// not part of `node --test` since it needs Playwright installed, which this
// zero-build-step site doesn't otherwise depend on.
//
// Requires:
//   - the `playwright` package resolvable (npm install playwright, or a
//     global install — set PLAYWRIGHT_EXECUTABLE_PATH if Chromium lives
//     somewhere other than Playwright's default download location)
//   - `python3` on PATH (used only to serve the site's static files)
//
// Run with:  node kirandeepsandhucoach/tests/admin-e2e.mjs
// Exits non-zero if any check fails.

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function freePort() {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, () => { const p = srv.address().port; srv.close(() => resolve(p)); });
  });
}

let pass = 0, fail = 0;
function check(label, cond) {
  if (cond) { pass++; console.log("ok:", label); }
  else { fail++; console.error("FAIL:", label); }
}

let server, browser;
try {
  const port = await freePort();
  server = spawn("python3", ["-m", "http.server", String(port)], { cwd: siteDir, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 600));

  browser = await chromium.launch(
    process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}
  );
  const page = await browser.newPage();

  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push("pageerror: " + e.message));
  page.on("console", (msg) => { if (msg.type() === "error") pageErrors.push("console.error: " + msg.text()); });

  // Fake gallery with one photo + a post whose title carries an XSS
  // payload, to exercise every photo-picker dropdown and the stored-XSS fix
  // in renderPostList (post titles are free text a contributor can write).
  await page.route("**/data/gallery.json", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify([{ src: "assets/images/uploads/1.jpg", caption: "Keynote", date: "2024-01-01" }]) })
  );
  await page.route("**/data/posts.json", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify([
      { slug: "xss-test", title: '<img src=x onerror="window.__xss=true">', date: "2024-02-02", body: "hi", excerpt: "", image: "", tags: [] },
    ]) })
  );

  // Login mock is swapped mid-test: 401, then 429, then a dropped
  // connection, then finally a real accept — exercising the fail-closed
  // auth UI (wrong/ambiguous/unreachable replies must never grant the
  // dashboard; only a genuine ok:true reply does).
  let loginResponse = { status: 401, body: { error: "Incorrect password." } };
  let loginNetworkFailure = false;
  await page.route("**/.netlify/functions/save-content", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    if (body.action === "whoami") {
      if (loginNetworkFailure) return route.abort("connectionreset");
      return route.fulfill({ status: loginResponse.status, contentType: "application/json", body: JSON.stringify(loginResponse.body) });
    }
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, message: "Saved." }) });
  });

  await page.goto(`http://127.0.0.1:${port}/admin/index.html`);
  await page.evaluate(() => { window.__xss = false; });

  await page.fill("#pw", "wrong-password");
  await page.click("#loginBtn");
  await page.waitForFunction(() => document.getElementById("loginMsg").textContent === "Incorrect password.", { timeout: 5000 });
  check("401 does not grant dashboard access", !(await page.$eval("#shell", (el) => el.classList.contains("on"))));

  loginResponse = { status: 429, body: { error: "Too many incorrect attempts. Try again in a few minutes." } };
  await page.fill("#pw", "wrong-password-again");
  await page.click("#loginBtn");
  await page.waitForFunction(() => document.getElementById("loginMsg").textContent === "Too many incorrect attempts. Try again in a few minutes.", { timeout: 5000 });
  check("429 does not grant dashboard access", !(await page.$eval("#shell", (el) => el.classList.contains("on"))));

  loginNetworkFailure = true;
  await page.fill("#pw", "whatever");
  await page.click("#loginBtn");
  await page.waitForFunction(() => document.getElementById("loginMsg").textContent === "Could not reach the site editor — check your connection and try again.", { timeout: 5000 });
  check("network failure does not grant dashboard access", !(await page.$eval("#shell", (el) => el.classList.contains("on"))));
  loginNetworkFailure = false;

  loginResponse = { status: 200, body: { ok: true, name: "Admin", role: "admin" } };
  await page.fill("#pw", "whatever");
  await page.click("#loginBtn");
  await page.waitForSelector("#shell.on", { timeout: 5000 });
  check("valid credentials grant dashboard access", true);
  check("XSS payload did not execute", !(await page.evaluate(() => window.__xss)));

  // Blog panel: title must render as literal text, not an <img> tag —
  // and the panel-switch race (userNavigated) shouldn't apply here since
  // we click well after the dashboard has finished its initial load.
  await page.click('a[data-page="_blog"]');
  await page.waitForSelector('.page-panel[data-page="_blog"].on', { timeout: 5000 });
  await page.waitForSelector("#postList .post-row", { state: "visible", timeout: 5000 });
  const titleText = await page.textContent("#postList .post-row b");
  check("title text contains literal <img string", titleText.includes("<img"));
  check("no <img> element rendered in post row", !(await page.$("#postList .post-row img")));

  // Fast-click race regression check: clicking a nav link immediately after
  // the shell appears must win over the async default-page selection.
  await page.reload();
  await page.fill("#pw", "whatever");
  await page.click("#loginBtn");
  await page.waitForSelector("#shell.on", { timeout: 5000 });
  await page.click('a[data-page="_photos"]'); // clicked while data is likely still loading
  await page.waitForFunction(() => {
    const panel = document.querySelector('.page-panel[data-page="_photos"]');
    return panel && panel.classList.contains("on");
  }, { timeout: 5000 });
  check("clicking a nav link during initial load is not overridden by the default page", true);

  await page.click('a[data-page="_photos"]');
  await page.waitForSelector("#photoGrid .photo-card", { timeout: 5000 });
  check("1 photo card rendered", (await page.$$eval("#photoGrid .photo-card", (els) => els.length)) === 1);

  await page.click('a[data-page="_seo"]');
  await page.waitForSelector("#seoList .seo-card", { timeout: 5000 });
  check("SEO cards rendered", (await page.$$eval("#seoList .seo-card", (els) => els.length)) > 0);
  const shareOptionCount = await page.$$eval(".seo-card:first-child .seo-img-select option", (els) => els.length);
  check("share-photo select has placeholder + 1 gallery photo", shareOptionCount === 2);
  const firstShareOptionText = await page.$eval(".seo-card:first-child .seo-img-select option", (el) => el.textContent);
  check("SEO placeholder text correct", firstShareOptionText === "— Keep current —");

  // A backend failure (e.g. a page whose markup lacks the expected tags,
  // which the backend now reports as 422) must surface as a visible error —
  // not be swallowed into a false "Saved" the way silent no-ops used to be.
  await page.unroute("**/.netlify/functions/save-content");
  await page.route("**/.netlify/functions/save-content", (route) =>
    route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ error: "Couldn't update 1 page (speaking.html) — its layout is missing the tags the editor expects." }) })
  );
  await page.click("#saveSeoBtn");
  await page.waitForFunction(() => {
    const m = document.getElementById("seoMsg");
    return m && m.classList.contains("err") && /Couldn't update/.test(m.textContent);
  }, { timeout: 5000 });
  check("SEO backend error surfaces as a visible error, not a false success", true);

  await page.click('a[data-page="_forms"]');
  await page.waitForSelector('[data-form-editor="hero"] .form-field-row', { timeout: 5000 });
  check("hero form editor built with fields", (await page.$$eval('[data-form-editor="hero"] .form-field-row', (els) => els.length)) > 0);

  await page.click('a[data-page="home"]');
  await page.waitForTimeout(200);
  const pageImgSelects = await page.$$("select.page-img-select");
  if (pageImgSelects.length) {
    const opts = await page.$$eval("select.page-img-select option", (els) => els.map((e) => e.textContent));
    check("page photo picker options correct", opts[0] === "— No photo —" && opts.length === 2);
  } else {
    check("no data-edit-img blocks on home page (nothing to check)", true);
  }

  await page.click('a[data-page="_blog"]');
  await page.click("#newPostBtn");
  await page.waitForSelector("#postImage", { timeout: 5000 });
  const postImgOpts = await page.$$eval("#postImage option", (els) => els.map((e) => e.textContent));
  check("post cover-photo picker options correct", postImgOpts.length === 2 && postImgOpts[0] === "— No photo —");

  // Publish flow, capturing the previousSlug payload (the rename/collision
  // fix) and the page-text Save Changes flow.
  let publishPayload = null;
  await page.route("**/.netlify/functions/save-content", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    if (body.action === "whoami") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, name: "Admin", role: "admin" }) });
    if (body.action === "save-post") { publishPayload = body.post; return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, message: "Post published.", posts: [] }) }); }
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, message: "Saved." }) });
  });
  await page.fill("#postTitle", "A Brand New Post");
  await page.fill("#postBody", "Some body text.");
  await page.click("#publishBtn");
  await page.waitForFunction(() => document.getElementById("editorMsg").textContent === "Post published.", { timeout: 5000 });
  check("publish flow succeeded", true);
  check('new post sends previousSlug=""', !!publishPayload && publishPayload.previousSlug === "");

  // A Punjabi/Gurmukhi title slugifies to empty; publishing should auto-fill
  // a usable dated link name rather than dead-ending the author.
  await page.click('a[data-page="_blog"]');
  await page.click("#newPostBtn");
  await page.waitForSelector("#postTitle", { timeout: 5000 });
  await page.fill("#postTitle", "ਅਗਵਾਈ");
  await page.dispatchEvent("#postTitle", "input");
  await page.fill("#postBody", "ਸਰੀਰ ਦਾ ਪਾਠ।");
  publishPayload = null;
  await page.click("#publishBtn");
  await page.waitForFunction(() => document.getElementById("editorMsg").textContent === "Post published.", { timeout: 5000 });
  const autoSlug = await page.inputValue("#postSlug");
  check("empty-slug (non-Latin) title auto-fills a usable link name", /^post-\d{4}-\d{2}-\d{2}$/.test(autoSlug));
  check("auto-filled slug is what gets published", !!publishPayload && publishPayload.slug === autoSlug);

  await page.click('a[data-page="home"]');
  await page.waitForSelector("textarea[data-key]", { timeout: 5000 });
  await (await page.$("textarea[data-key]")).fill("Edited headline text");
  await page.click("#saveBtn");
  await page.waitForFunction(() => document.getElementById("saveMsg").textContent === "Saved.", { timeout: 5000 });
  check("page-text save flow succeeded", true);

  if (pageErrors.length) {
    console.log("\nUnexpected console/page errors (excluding intentional route mocks above):");
    console.log(JSON.stringify(pageErrors, null, 2));
  }
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail === 0 ? 0 : 1;
