# Syahar — Production Security Architecture

**Status:** Build plan. Nothing in this document is implemented yet.
**Audience:** the developer who builds this, the security reviewer who checks it, and the founder who signs off on the legal groundwork.
**Scope:** turning the current client-only wireframe into a production platform that safely handles real logins, real payments, and real health data for elderly parents in Nepal and their families abroad.

---

## 1. The starting point (be honest about it)

The current `syahar-website/` is a **wireframe**: a convincing picture of the product with no backend. Three facts define the whole security problem:

1. **Auth is fake.** `store.js` checks a plaintext password (`password: 'demo'`) that ships in the browser bundle. Any visitor can open dev tools and run `sessionStorage.setItem('syahar.session', '{"role":"admin"}')` to become the coordinator.
2. **Payments are fake.** "Payment received ✓" is a `setTimeout`. No gateway, no money, no confirmation. The browser simply asserts it paid.
3. **All data is local.** Health records, chat, payments, and leads live in the visitor's own `localStorage`. There is no server, no database, no API.

You cannot secure this. Security for a health-and-payments platform **is** the backend architecture, and the backend does not exist yet. This document specifies the one to build.

**Guiding principle: buy compliance, don't build it.** Hand-rolled auth and payment code is where breaches come from. Every high-risk component below is delegated to a managed service whose business is getting it right and who is contractually on the hook.

---

## 2. What we are protecting, and from whom

| Asset | Sensitivity | Worst case if breached |
|---|---|---|
| Elderly parents' health records (conditions, meds, vitals, doctor) | Special-category personal data (regulated) | Regulatory penalty, real harm to vulnerable people, total loss of trust |
| Family & caregiver identities and contacts | Personal data | Targeted fraud against families sending money abroad |
| Payment records & references | Financial data | Fraud, chargebacks, legal exposure |
| Card details | Never stored by us (see §6) | — (scope pushed to the gateway) |
| Coordinator/admin access | Keys to everything | One compromised admin = every family exposed |

**Threat actors:** opportunistic credential stuffers, a malicious signed-up user probing for other families' data, an attacker who phishes a coordinator, and automated bots hitting the login and lead forms.

---

## 3. Recommended stack

| Layer | Choice | Why it is the secure default |
|---|---|---|
| Auth | **Supabase Auth** (or Clerk/Auth0) | Password hashing, sessions, 2FA, lockout, email verification — built, audited, maintained |
| Database | **Supabase Postgres** | Encryption at rest, automated encrypted backups, patching handled; **Row-Level Security** enforces per-family access in the database itself |
| API / backend | **Supabase Edge Functions** + PostgREST | The server-side trust boundary the demo lacks; payment webhooks and admin actions run here |
| Payments | **Razorpay** or **Stripe** | Card data and PCI-DSS scope stay with them; we only ever see tokens and references |
| Frontend | **Next.js (React)** | Your current HTML/CSS/JS design translates cleanly; enables server-side session checks and a strict CSP |
| Hosting | **Vercel** (frontend) + Supabase (backend) | HTTPS, secrets management, and DDoS protection built in — no hand-configured servers to mispatch |
| Secrets | Vercel + Supabase env vaults | Never in the repo, never in the bundle |

A custom build (hand-rolled Node/Express + separate Postgres + separate auth) is viable but puts more security-critical code in your hands. **For a small team, Supabase is the safer choice** precisely because it removes code you would otherwise have to secure yourself. The rest of this doc assumes Supabase; the concepts map directly onto a custom build if you go that way.

---

## 4. Architecture & trust boundary

```
  Browser (untrusted)                    Server (trusted)                 Third parties
  ┌────────────────────┐        ┌──────────────────────────────┐
  │ Next.js app        │  HTTPS │ Supabase                     │
  │  - UI, forms       │───────▶│  - Auth (sessions, 2FA)      │
  │  - session token   │        │  - Postgres + Row-Level Sec. │
  │  - NEVER trusted    │        │  - Edge Functions (server)   │
  └────────────────────┘        └──────────────┬───────────────┘
         ▲                                      │ signed webhook
         │                                      ▼
         │                         ┌──────────────────────────┐
         └── redirect to gateway ─▶│ Razorpay / Stripe        │
             (card data direct)    │  - holds card data (PCI) │
                                    └──────────────────────────┘
```

**The rule that fixes the demo's core flaw:** the browser is never trusted. It cannot set its own role, cannot confirm its own payment, and cannot read a record the database hasn't authorized for its session. Every one of those decisions moves to the server.

---

## 5. Authentication & authorization

**Authentication (proving who you are):**
- Passwords hashed with bcrypt/argon2 by Supabase Auth. Plaintext passwords never exist anywhere. The demo's `password: 'demo'` seed users are **deleted** and never ported.
- Email verification required before an account is active.
- **Mandatory 2FA for the `admin`/coordinator role** — they can see every family. Strongly recommended for `family` and `caregiver` too.
- Login rate-limiting and account lockout after repeated failures (blocks credential stuffing).

**Authorization (what you're allowed to see):** enforced in the database with **Row-Level Security (RLS)**, so it holds even if the frontend has a bug:

| Role | Can read | Can write |
|---|---|---|
| `family` | Only patients where they are a linked family member; their own billing/chat/reports | Chat, add-on requests, their own payment |
| `caregiver` | Only families explicitly assigned to them | Daily reports for assigned patients, chat |
| `admin` | All (this is the privileged role — hence mandatory 2FA + full audit) | Placements, vetting, lead pipeline |

RLS policy example (concept):
```sql
-- A family member can only read a patient they are linked to.
create policy family_reads_own_patient on patients
  for select using (
    exists (select 1 from patient_family
            where patient_family.patient_id = patients.id
              and patient_family.user_id = auth.uid())
  );
```
This is the single most important control for health data: even a compromised or buggy client physically cannot fetch another family's records, because the database refuses.

---

## 6. Payments (real money, three countries)

**Non-negotiable: card data never touches your servers.** The family is redirected to Razorpay/Stripe, who collect the card directly. You store only a payment reference and status. This keeps the heavy PCI-DSS burden with the gateway — the entire reason to use one.

**The flow that replaces the demo's fake `setTimeout`:**
1. Family clicks "Pay now" → server (Edge Function) creates a payment intent with the gateway and returns its hosted checkout.
2. Family pays on the gateway's page. Card data goes gateway-side only.
3. Gateway sends a **signed webhook** to your Edge Function confirming the payment.
4. Server **verifies the webhook signature**, then marks the share paid in Postgres and writes the audit record.
5. The UI reflects "Paid" only because the server said so — never because the browser claimed it.

**Critical difference from the demo:** confirmation is server-to-server and cryptographically signed. The browser saying "I paid" means nothing. (Today it means everything — which is fatal for real money.)

**Multi-currency:** the gateway handles UK £, Australian A$, and settlement; you display and record, you never compute FX yourself.

---

## 7. Health data & compliance (the serious one)

Elderly parents' medical records are **special-category personal data**. Your families are in the **UK and Australia**, so this is squarely regulated:

- **UK GDPR / Data Protection Act 2018** — applies because you process data of people in the UK.
- **Australian Privacy Act 1988 (APPs)** — applies to your Australian families.
- **Nepal** — the Individual Privacy Act and local rules for data held in Nepal.

**Technical controls:**
- Encryption at rest (Supabase Postgres) and in transit (TLS everywhere).
- RLS access control (§5) so health data is readable only by the linked family and assigned caregiver.
- **Audit logging** of every read and write to a health record — who, what, when (§8).
- Data-retention and deletion policy, plus a working "delete my data" path for subject-access/erasure requests.
- Data residency decision: where does the database physically live, and are the families told?

**This is not only a coding task.** You need, before launch:
- A privacy policy and terms of service written for a health + payments service across these jurisdictions.
- A lawful basis for processing health data (likely explicit consent) captured at signup.
- A data-processing agreement with Supabase and the payment gateway (they provide these).
- Ideally a lawyer's review. **Code cannot substitute for this**, and I would be doing you a disservice to imply it can.

---

## 8. Cross-cutting controls

- **Transport:** HTTPS everywhere, HSTS, TLS 1.2+. No plaintext HTTP anywhere.
- **Content-Security-Policy:** a strict CSP so an injected script can't run — this is the production defense-in-depth backing up the output-escaping already done in the wireframe.
- **Security headers:** `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/frame-ancestors, `Permissions-Policy`.
- **Rate-limiting** on login, signup, lead capture, and payment endpoints (blocks brute force and spam).
- **Secrets** in the host's env vault — never in the repo, never in the client bundle. Rotate on any suspected exposure.
- **Audit log:** append-only table recording auth events, health-record access, admin actions, and payment events. This is both a security control and a compliance requirement.
- **Backups:** automated, encrypted, tested by actually restoring one. A backup you've never restored is a hope, not a backup.
- **Monitoring & alerting:** failed-login spikes, webhook signature failures, unusual admin activity.
- **Secure SDLC:** automated dependency scanning (Dependabot), secret scanning on commits, code review on every change, and a security review of the server code before launch.

---

## 9. Phased rollout (reduce risk by not doing it all at once)

**Phase 0 — Lead capture only (can go live soonest).**
Deploy just the marketing site + lead form, backed by a real form handler (Netlify Forms or a Supabase table). No accounts, no health data, no payments. Real value, near-zero risk. This lets you start marketing while the platform is built and reviewed.

**Phase 1 — Accounts & dashboards.**
Real auth, database, RLS. Migrate family/caregiver/admin dashboards to read/write real data. Security review before any real family onboards.

**Phase 2 — Payments.**
Gateway integration + signed webhooks. Test thoroughly in the gateway's sandbox. Small live pilot before general availability.

**Phase 3 — Hardening & scale.**
Full monitoring, penetration test, incident-response plan, compliance sign-off.

**Do not** flip the whole wireframe to "production" in one step. Onboarding a real family onto today's code would expose their medical data and payment info immediately.

---

## 10. Migration map — demo file → production component

The demo's data shapes are, per the comment in `store.js`, the intended API contract. They map cleanly:

| Demo (client-only) | Production (server-enforced) |
|---|---|
| `store.js` seed `users` + `password: 'demo'` | Supabase Auth users (hashed); seed users **deleted** |
| `Store.login()` / `Store.guard()` (client checks) | Supabase Auth sessions + RLS (server checks) |
| `store.js` `patient`, `reports`, `messages` | Postgres tables with RLS policies |
| `Store.recordPayment()` (`setTimeout`) | Edge Function + gateway + signed webhook |
| `billing.split` states in localStorage | `payments` / `payment_shares` tables, server-written |
| `localStorage` persistence | Encrypted Postgres |
| `esc()` output escaping (already done) | Kept, plus a strict CSP behind it |

The visual and UX work in the wireframe carries over to the Next.js frontend — it is not wasted. What gets rebuilt is everything behind the trust boundary.

---

## 11. Anti-patterns to carry forward as "never again"

Straight from the current demo — these are the exact things production must not do:

1. **Never** store or ship plaintext passwords.
2. **Never** let the client decide its own role or permissions.
3. **Never** confirm a payment from the browser; only a signed server webhook counts.
4. **Never** keep health or payment data in `localStorage` or any client store.
5. **Never** put secrets, API keys, or credentials in the repo or the bundle.

---

## 12. The decisions that are yours

1. **Stack:** Supabase (recommended, assumed here) or custom Next.js + separate services.
2. **Legal groundwork:** privacy policy, terms, lawful basis for health data, and a lawyer's review across UK/AU/Nepal. Start this in parallel with the build — it has a longer lead time than the code.
3. **Data residency:** where the database physically lives, and disclosing that to families.
4. **Launch shape:** confirm Phase 0 (lead capture) can go live first while the transactional platform is built and reviewed.

Once the stack is confirmed, the first buildable step is **Phase 0 + the Supabase project scaffold** (auth, the core tables, and RLS policies) — the secure foundation everything else sits on.
