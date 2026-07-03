# Syahar — Compliance Checklist

> **This is an engineering checklist, not legal advice.** Syahar processes
> special-category health data about vulnerable people across the UK,
> Australia, and Nepal, plus cross-border payments. A qualified lawyer in the
> relevant jurisdictions MUST review your data practices, contracts, and
> policies before launch. The items below are what an engineer can prepare so
> that review is fast and cheap — they do not replace it.

## Which laws apply, and why

- **UK GDPR + Data Protection Act 2018** — you process data about people in the UK (the NRN paying and, often, family members). Health data is "special category" (Art. 9) and needs an explicit condition for processing.
- **Australian Privacy Act 1988 (APPs)** — for your Australian families.
- **Nepal** — the Individual Privacy Act 2018 and any sectoral rules for data held in Nepal (where the patient and caregiver are).
- **Cross-border transfer rules** — data moves between Nepal (patient/caregiver) and the UK/AU (payer). Each leg needs a lawful transfer basis.

## Data-protection groundwork

- [ ] **Appoint a data controller** entity and a contact for privacy requests.
- [ ] **Lawful basis for health data** captured at signup — almost certainly *explicit consent*; record when/how it was given.
- [ ] **Privacy policy** published and linked at signup (draft: `PRIVACY-POLICY.md`).
- [ ] **Terms of service** published (draft: `TERMS-OF-SERVICE.md`).
- [ ] **Consent for the caregiver-to-family sharing** of health observations and photos (the app already models `photo_consent` per report — extend that discipline).
- [ ] **Data-processing agreements (DPAs)** signed with every processor: Supabase (hosting/DB), the payment gateway, email provider, any analytics. Supabase and Stripe/Razorpay provide standard DPAs.
- [ ] **Data residency decided and disclosed.** Choose the Supabase region deliberately (see `../backend/README.md`) and tell families where their data lives.
- [ ] **Cross-border transfer mechanism** documented for the Nepal ↔ UK/AU flows.

## Data-subject rights (must actually work, not just be promised)

- [ ] **Access** — export a person's data on request.
- [ ] **Erasure** — delete a person's data; the schema uses `on delete cascade` so removing a patient/profile cleans up dependents. Confirm Storage files are also deleted.
- [ ] **Rectification** — correct wrong data (admin can edit records).
- [ ] **Retention policy** — define how long records are kept after a placement ends, and enforce it (a scheduled purge job).

## Payments / financial

- [ ] **PCI-DSS scope** kept with the gateway (never store card data — the design already does this via hosted checkout).
- [ ] **Refund / money-back-guarantee terms** written (the marketing copy promises a first-placement guarantee — reflect it in the ToS).
- [ ] **Anti-money-laundering / KYC** — confirm whether taking payment for services triggers any obligation in your operating jurisdictions. Ask the lawyer explicitly; the marketing FAQ insists Syahar "is not a money-transfer service," and the product must stay on the right side of that line.

## Safeguarding (specific to elder care)

- [ ] **Caregiver vetting** is enforced (the roster hard-stops model this: ID, police check <12mo, references, health, insurance). Keep the evidence.
- [ ] **Safeguarding / abuse-reporting policy** for coordinators.
- [ ] **Insurance** — professional liability + the caregiver insurance the marketing promises.

## Security (cross-reference)

- [ ] Complete the items in `SECURITY-REVIEW.md` §5, including the independent penetration test.

---

**Bottom line:** the code can enforce access control, encryption, audit, and deletion — and it does. It cannot decide your lawful basis, write your contracts, or sign your DPAs. Budget for a lawyer early; it has a longer lead time than the code.
