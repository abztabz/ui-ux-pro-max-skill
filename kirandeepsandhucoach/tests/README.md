# Tests

This site has no build step and no `package.json`; these tests are kept
zero-dependency (or optionally-dependency) to match that.

## Backend: `save-content.test.mjs`

Zero dependencies — uses only Node's built-in test runner and `assert/strict`
against a fake in-memory GitHub API. Covers every action in
`netlify/functions/save-content.mjs`: auth (including rate limiting),
permissions, save-pages, uploads, gallery, blog publish/rename/delete, SEO,
forms + Formspree propagation, and the error-handling paths (a GitHub write
conflict vs. a generic failure never leak raw GitHub response text to the
client).

```bash
node --test kirandeepsandhucoach/tests/save-content.test.mjs
```

## Frontend: `admin-e2e.mjs`

Optional — drives the real `admin/index.html` in a headless browser via
Playwright against a mocked backend. Covers the fail-closed login UI (401 /
429 / dropped connection never grant the dashboard), the stored-XSS fix in
the post list, the post-login nav race fix (a fast click during initial load
must win over the default landing page), and the main panel/save/publish
flows.

Requires:
- the `playwright` package resolvable (`npm install playwright`, or a global
  install — set `PLAYWRIGHT_EXECUTABLE_PATH` if Chromium isn't at
  Playwright's default download location)
- `python3` on `PATH` (only used to serve the site's static files locally)

```bash
node kirandeepsandhucoach/tests/admin-e2e.mjs
```

Exits non-zero if any check fails.
