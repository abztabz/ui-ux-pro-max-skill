# Syahar — Website & App

Production stack for **Syahar** (स्याहार), the cross-border caregiver platform:
vetted, insured caregivers for elderly parents in Nepal, arranged and paid for
by family members abroad, with verified proof of every visit.

> The original localStorage wireframe (static HTML/JS demo) was removed once
> this stack superseded it. It's in git history if you need to refer back.

## Layout

```
syahar-website/
├── frontend/   # Next.js app (App Router) — the site + all dashboards
├── backend/    # Supabase: SQL migrations, RLS policies, Edge Functions
├── docs/       # Security review, compliance checklist, privacy/ToS drafts,
│               # incident-response plan
└── SECURITY-ARCHITECTURE.md   # the build plan this stack implements
```

## Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in your Supabase URL + anon key
npm install
npm run dev                        # http://localhost:3000
```

Roles and their surfaces:

- **Family** — Home, Health records, Daily log, Chat, Add-ons, Billing (pay your share), Emergency, Security (2FA).
- **Caregiver** — Visits, File report (with vitals).
- **Admin / coordinator** — Leads, CRM pipeline, Roster + vetting, Documents, Ops (alerts + orders), Payments, CMS. MFA is enforced for this role.

Auth is server-enforced (middleware + per-role guards) and every data query is
backed by Postgres Row-Level Security, so access is decided by the database,
not the browser.

## Backend

```bash
cd backend
supabase link --project-ref <your-project-ref>
supabase db push
supabase functions deploy create-payment payment-webhook submit-lead
```

See `backend/README.md` for the security model, secrets, and the data-residency
decision.

## Security & compliance

Read before launch: `docs/SECURITY-REVIEW.md`, `docs/COMPLIANCE-CHECKLIST.md`,
`docs/INCIDENT-RESPONSE.md`, and the privacy-policy / terms drafts (which need a
lawyer's review). A payment gateway integration and an independent penetration
test are the remaining gates.
