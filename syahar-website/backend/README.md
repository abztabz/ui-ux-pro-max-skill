# Syahar backend — Supabase scaffold

The secure foundation described in `../SECURITY-ARCHITECTURE.md`. This is **code you apply to your own Supabase project** — it does not run here. Nothing real is stored until you deploy it and connect the frontend.

## What's in here

```
backend/
├── README.md                         # this file
├── .env.example                      # env vars (fill in, never commit real values)
└── supabase/
    ├── migrations/
    │   ├── 0001_schema.sql           # tables + helper functions + triggers
    │   └── 0002_rls.sql              # Row-Level Security policies (the access rules)
    └── functions/
        ├── create-payment/index.ts   # starts a gateway payment (server-side)
        ├── payment-webhook/index.ts   # verifies signed webhook, marks paid
        └── submit-lead/index.ts       # public lead capture with rate-limit hook
```

## The security model in one paragraph

Every table has Row-Level Security **on**. Access is decided by the database, not the browser: a `family` user can only read a patient they're linked to, a `caregiver` only families assigned to them, and only `admin` sees everything (which is why admins get mandatory 2FA — set in the Supabase dashboard). Payment status can **only** be changed by the server after a gateway webhook's signature is verified — the browser can never mark itself paid. New signups always land as `family`; nobody can self-promote to `admin` (guarded by a trigger).

## Prerequisites

- A Supabase project (free tier is fine to start).
- The Supabase CLI: `npm i -g supabase`.
- A payment gateway account (Razorpay or Stripe) when you reach Phase 2.

## Apply it

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # applies migrations/0001 then 0002 in order
supabase functions deploy create-payment payment-webhook submit-lead
```

Set the function secrets (never in the repo):

```bash
supabase secrets set PAYMENT_WEBHOOK_SECRET=... GATEWAY_API_KEY=...
```

## Data residency — the one decision at project-creation time

When you create the Supabase project you choose a **region**. This is a real compliance decision for UK/Australia/Nepal health data (see §7 of the architecture doc). Pick the region deliberately and disclose it to families in your privacy policy. Changing it later means migrating the database.

## Promote a user to caregiver or admin

Signups default to `family` on purpose. To elevate someone, run this as the project owner (SQL editor, service role):

```sql
update public.profiles set role = 'admin' where id = '<user-uuid>';
```

## Important

This is **scaffolding to be reviewed**, not a finished backend. Before a single real family onboards: have the SQL and functions security-reviewed, complete the gateway integration in the function stubs, turn on 2FA enforcement for admins, and finish the legal groundwork (privacy policy, lawful basis for health data, DPA with Supabase and the gateway). See §7 and §9 of `../SECURITY-ARCHITECTURE.md`.
