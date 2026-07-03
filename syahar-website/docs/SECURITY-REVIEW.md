# Syahar — Security Self-Review

**What this is:** an honest internal review of the security posture of the code in this repo, done by the team that wrote it. **What this is not:** an independent audit or a penetration test. Those are separate, and required before real families onboard (see §5). A self-review finds what you already know to look for; an outside reviewer finds what you don't.

Last updated: alongside the frontend/backend build described in `../SECURITY-ARCHITECTURE.md`.

---

## 1. Controls implemented (and verified)

| Control | Where | Verification |
|---|---|---|
| Row-Level Security on every table | `backend/.../0002_rls.sql` + later migrations | Applied on Postgres 16; proven a family cannot read another family's reports/medications (unlinked user sees 0 rows) |
| Fail-closed RLS (RLS on, no policy = deny) | all migrations | 19/19 tables have `rowsecurity` on |
| Server-enforced auth | `frontend/middleware.ts` | Protected paths redirect to /login before dashboard code runs |
| Role checks (defense in depth) | `frontend/lib/auth.ts` + per-role layouts | `requireRole` gates /admin, /caregiver, /family |
| No self-promotion to admin | `0001` trigger `guard_role_change` + `handle_new_user` (defaults 'family') | Signups land as family |
| Payment confirmed server-side only | `functions/payment-webhook` (HMAC verify) | Browser cannot mark paid; unsigned webhook → 401 |
| Card data never on our servers | gateway hosted checkout (`create-payment`) | Design; card entry is gateway-side |
| Public content read / admin write | `0004` site_content | Proven anon read OK, non-admin write blocked |
| Private document bucket | `0005` storage RLS | Policies created; path-scoped to patient |
| Output escaping (legacy wireframe) | `assets/js` `esc()` | Audited all 37 innerHTML sites; one gap fixed |
| Secrets kept out of git | `.gitignore`, `.env*.example` | Service role key never in client bundle |
| 2FA enrollment available | `/security` (Supabase MFA) | Build-verified UI |
| Patched dependencies | `next@^15.5.20` | Bumped off CVE-flagged 15.1.6 |

---

## 2. Residual risks / known gaps

**Closed since the first review:**
- ~~MFA not enforced~~ → enforced for admins (AAL2 gate in the admin layout).
- ~~Rate-limiting / CAPTCHA~~ → durable per-IP rate limit on `submit-lead` (always on) + Turnstile verification (enable with a key).
- ~~No CSP~~ → strict **nonce-based** CSP (no `unsafe-inline`/`unsafe-eval` in script-src) + HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy. Fonts self-hosted via `next/font`.
- ~~Read-access auditing partial~~ → `log_read()` function available for auditing sensitive reads (wire it into the read paths that need it).

**Closed in the hardening pass:**
- ~~No dependency/secret scanning~~ → `npm audit` clean (postcss advisory patched via override), a CI workflow (`.github/workflows/syahar-ci.yml`) runs tsc + `npm audit --audit-level=high` + build on every change, and Dependabot watches npm + actions weekly.
- ~~`log_read()` not wired~~ → the family Health page now logs each health-record read.
- Added Cross-Origin-Opener-Policy + X-Permitted-Cross-Domain-Policies headers; deduped per-request auth loads with React `cache()`.

**Still open:**
1. **Payment gateway not integrated.** `create-payment` / `payment-webhook` have the security-critical structure (signature verify, service-role writes) but the Razorpay/Stripe specifics are `TODO`. No real money moves yet.
2. **`style-src` allows `'unsafe-inline'` — informed acceptance, not an oversight.** Dropping it needs the CSP3 `style-src-elem`/`-attr` split (breaks styling on older browsers) or removing every inline `style` attribute (~40 files, high regression risk). The residual risk is low: style injection requires HTML injection, which the nonce `script-src` + React's default escaping already prevent. Revisit if the app moves fully to CSS classes.
3. **Signed URL lifetime.** Document download URLs are 60s; confirm that fits the UX and that the bucket is truly private.
4. **Monitoring/alerting not wired.** The plan exists (`INCIDENT-RESPONSE.md`); the alerts themselves need configuring on the live project.

---

## 3. Threats considered

- **Malicious signed-up user probing for other families' data** → blocked by RLS (the primary control; verified).
- **Client tampering to escalate role** → blocked; role lives server-side, trigger-guarded.
- **Forged payment confirmation** → blocked by webhook signature check.
- **Credential stuffing** → partially mitigated (Supabase lockout defaults); needs explicit rate-limiting.
- **XSS via user content** → escaping in the legacy wireframe; the React app escapes by default. A strict CSP is still owed.
- **Stolen admin session** → mitigated by short-lived tokens + `getUser()` revalidation; MFA enforcement would strengthen this.

---

## 4. What we cannot verify from the code alone

- Whether the Supabase project's dashboard settings match this design (MFA enforcement, JWT expiry, email confirmations, allowed redirect URLs).
- Whether secrets are correctly scoped in the deployment (service role key server-only).
- Runtime behaviour against a live database (only the SQL/RLS layer and the frontend build are verified here; no live end-to-end run was possible in the build environment).

These must be checked on the real Supabase project before launch.

---

## 5. Required before real families onboard

1. **Independent penetration test** by a third party. Non-negotiable for a health + payments platform. Scope: auth, RLS bypass attempts, payment webhook forgery, storage access, IDOR across families, rate-limiting.
2. **Gateway integration + sandbox testing**, then a small live payment pilot.
3. **Enforce MFA** for admins; add rate-limiting + CAPTCHA.
4. **Ship the CSP + security headers**; self-host fonts.
5. **Legal sign-off** (see `COMPLIANCE-CHECKLIST.md`).
6. **Incident-response plan** + monitoring/alerting for failed logins, webhook signature failures, and unusual admin activity.
