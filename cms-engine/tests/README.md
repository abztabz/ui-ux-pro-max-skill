# CMS Engine tests

Zero-dependency backend tests using Node's built-in test runner against a fake
in-memory GitHub API. The suite sets a generic CMS config via environment
variables before importing the handler, so it's fully hermetic — no network, no
real repo, no secrets.

```bash
node --test cms-engine/tests/*.test.mjs
```

Covers every action and the hardening behaviours: auth + rate limiting,
role permissions, page/gallery/blog/SEO/forms writes, the oversized-image
backstop, the "report failures instead of silently claiming success" paths for
SEO and forms, blog-body injection escaping, slug/date validation, and the
error-handling paths (write-conflict vs. generic failure, with no internals
leaked to the client).
