# Syahar — Incident Response & Monitoring Plan

A small team's plan for noticing something is wrong and responding without
panic. Keep it short enough that people actually follow it.

## 1. What to watch (monitoring)

Set up alerts for these signals. Supabase exposes logs/metrics; wire them to
email/Slack. Each row is "if you see this, something may be wrong."

| Signal | Where | Why it matters |
|---|---|---|
| Spike in failed logins | Supabase Auth logs | Credential-stuffing attempt |
| Payment webhook signature failures | `payment-webhook` logs | Someone forging payment confirmations |
| Rate-limit 429s climbing on `submit-lead` | Edge Function logs / `rate_limit_hits` | Bot/spam wave |
| Unusual admin activity (bulk reads, off-hours) | `audit_log` | Compromised coordinator account |
| RLS "permission denied" bursts | Postgres logs | Someone probing for other families' data |
| Error-rate / latency spikes | Vercel + Supabase dashboards | Outage or attack |
| Storage egress spike | Supabase Storage metrics | Possible data exfiltration |

Minimum viable monitoring for launch: failed-login alert, webhook-failure
alert, and a weekly review of `audit_log` for admin activity.

## 2. Severity levels

- **SEV-1 — data breach / data loss.** Confirmed or strongly suspected access to health or payment data by someone who shouldn't have it. Drop everything.
- **SEV-2 — security incident, no confirmed data access.** e.g. a compromised admin account caught early, active attack being mitigated.
- **SEV-3 — degraded / outage.** Service down or broken, no security dimension.
- **SEV-4 — minor.** Single-user bug, cosmetic, non-urgent.

## 3. Response steps (SEV-1 / SEV-2)

1. **Declare.** One person is the incident lead. Start a timestamped log (what you saw, what you did). Do this from the first minute.
2. **Contain.** Stop the bleeding before investigating:
   - Suspected account compromise → force sign-out (rotate the user's sessions), disable the account.
   - Leaked secret (service role key, webhook secret, gateway key) → rotate it immediately in Supabase/gateway/Vercel; the old one dies.
   - Active exploit → take the affected surface offline if needed (feature flag / maintenance).
3. **Assess.** Use `audit_log` to determine what was read/changed and whose data. Scope it precisely — who, what, when.
4. **Eradicate & recover.** Fix the root cause, restore from a clean encrypted backup if data was altered, verify the fix.
5. **Notify.** For a confirmed breach of personal/health data, legal deadlines apply — **UK GDPR requires notifying the ICO within 72 hours**, and affected people "without undue delay" if there's high risk; Australia and Nepal have their own rules. Loop in the lawyer from `COMPLIANCE-CHECKLIST.md` the moment SEV-1 is declared; do not wait until you've finished investigating.
6. **Review.** Within a week, a blameless post-mortem: timeline, root cause, what worked, what to change. File the follow-up fixes.

## 4. Secret rotation runbook

Secrets that must be individually rotatable (they are, by design — all in
env/vaults, none in git):

- Supabase service role key → Supabase dashboard → API → roll.
- Payment webhook secret + gateway keys → gateway dashboard → re-issue → update Edge Function secrets.
- Turnstile secret → Cloudflare → re-issue.

After rotating, redeploy the Edge Functions and confirm payments + lead capture
still work.

## 5. Backups & recovery

- Supabase runs automated encrypted backups. **Test a restore before launch** — an untested backup is a hope, not a backup.
- Know your RPO/RTO (how much data you can afford to lose / how fast you must be back). Write them down.

## 6. Contacts

- Incident lead: \[name]
- Legal / DPO: \[name] (see `COMPLIANCE-CHECKLIST.md`)
- Supabase support plan: \[tier]
- Payment gateway support: \[contact]

Fill these in before launch. An incident is the wrong time to look up a phone number.
