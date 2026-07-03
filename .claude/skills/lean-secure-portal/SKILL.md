---
name: lean-secure-portal
description: >-
  Use when building, extending, or reviewing a client "portal" web app — a site
  with accounts, role-based dashboards, private data, or payments (family /
  caregiver / admin style apps, member portals, booking or health platforms) —
  where the goal is both a lean codebase and a real security posture. Also use
  whenever asked to keep implementation code minimal without cutting security,
  validation, or accessibility. Trigger phrases: "build a portal", "role-based
  dashboard", "harden this app", "security review before real users", "keep the
  code lean", "add RLS/auth to this app". Distilled from the Syahar (cross-border
  caregiver platform) build.
---

# Lean Secure Portal

A build/hardening playbook for client "portal" apps — accounts, role-based
dashboards, private data, sometimes payments — that keeps the codebase small
without ever trading away security. Distilled from the Syahar build (a
caregiver-coordination platform with Family / Caregiver / Admin roles, health
records, and a payment flow).

## 1. Stack decision defaults

- **Next.js (App Router) + Supabase** (Postgres + Auth + Storage + Edge
  Functions) is the default for a client web app with accounts, data, and
  optionally payments.
- **RLS-in-the-database is the primary access-control mechanism**, not
  app-layer checks. If a table holds user data, it gets a Row-Level Security
  policy before it gets a page that reads it.
- **Keep dependencies minimal.** Target ratio: a handful of runtime
  dependencies (framework + DB client only), tens not hundreds of packages in
  the lockfile. Every added dependency needs a reason that survives rung 5 of
  the ladder below.
- **Run every new piece of code through Ponytail's decision ladder** before
  writing it, on the initial build and on every later change:
  1. Does this need to exist at all? → no: skip it (YAGNI)
  2. Already in this codebase? → reuse it, don't rewrite
  3. Does the stdlib do it? → use it
  4. Native platform feature? → use it
  5. Already-installed dependency? → use it
  6. Does it fit in one line? → one line
  7. Only then: hand-write the minimum that works

  The ladder is about laziness in the *solution*, never in reading the
  problem or in what the solution is allowed to skip. It must never be used
  to cut trust-boundary validation, data-loss handling, security controls, or
  accessibility — those stay non-negotiable at every rung.

## 2. Build sequencing

Build in this order; don't interleave hardening with feature work.

1. **Landing page + lead capture first.** Ship something visible before the
   real backend exists.
2. **Throwaway wireframe to validate the UX** of each role's flow (a
   localStorage demo is fine) before wiring real auth. Delete it once
   superseded — don't let demo code sit next to production code.
3. **Real backend before dashboard pages**: migrations → RLS policies → edge
   functions, in that order, so every dashboard page is written against real
   access rules from day one instead of being retrofitted later.
4. **Security hardening as its own later pass**, not mixed into feature
   commits. Make it reviewable as a single, self-contained unit of work.

## 3. Auth & access-control checklist

- RLS **fail-closed** on every table: enabled by default, no policy = deny.
- Role stored **server-side**, changes gated by a DB trigger — no client path
  can self-promote a user to admin.
- Auth enforced in **middleware** (redirect to login before any dashboard code
  runs), plus **per-role guards** in each dashboard as defense in depth.
- **MFA enforced** (not just offered) for privileged roles, fail-closed.
- **Payment confirmation only via a signature-verified server webhook** — the
  browser must never be able to mark something as paid.

## 4. Hardening checklist

Work down this list once the feature set is real. Each item should leave a
one-line note on what was verified, not just what was added.

- **CSP**: nonce-based, drop `unsafe-inline`/`unsafe-eval` from `script-src`.
  If you keep an exception (e.g. `style-src 'unsafe-inline'`), write down why
  and what would close it.
- **Security headers**: HSTS, X-Frame-Options, nosniff, Referrer-Policy,
  Permissions-Policy, Cross-Origin-Opener-Policy.
- **Rate limiting + CAPTCHA** on public write endpoints (lead forms, signup).
- **Read-audit logging** for sensitive data access, not only writes.
- **Signed URLs with short expiry** for private file access.
- **Self-host fonts/assets** where third-party CDNs would force CSP
  exceptions.
- **Dependency/secret scanning in CI** (e.g. `npm audit`, Dependabot) so it
  runs on every change, not once.

## 5. Documentation to produce alongside the code

- A **security self-review**, written honestly, stating up front what it is
  *not* (a substitute for an independent penetration test).
- **Compliance checklist**, **incident-response plan**, **privacy policy /
  terms of service** drafts.
- One **architecture plan** doc the security review can point back to.
- A **closed/open gaps table** updated as hardening lands — nothing "done"
  without a verification note next to it (e.g. "RLS on all tables — proven:
  unlinked user reads 0 rows", not just "RLS added").

## 6. Process discipline

- Set `git config user.email noreply@anthropic.com` and
  `user.name Claude` before committing on any branch that needs to show as
  verified on GitHub.
- Never assume a target branch already exists on the remote — check before
  rebasing or force-pushing onto it.
- When continuing someone else's branch, reconstruct intent from commit
  messages and diffs rather than guessing.
- With a non-technical or cautious client: confirm scope and destination
  before creating new files or structure in a shared repo, especially one
  with its own conventions already in place.
