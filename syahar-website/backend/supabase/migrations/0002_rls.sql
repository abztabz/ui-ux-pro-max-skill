-- Row-Level Security: the access rules, enforced by the database itself.
-- Even a buggy or malicious frontend cannot read data these policies deny.
-- The service role (Edge Functions) bypasses RLS by design — that is how
-- the server performs privileged actions like confirming a payment.

-- Turn RLS ON for every table. A table with RLS on and no matching policy
-- denies all client access by default (fail closed).
alter table profiles          enable row level security;
alter table patients          enable row level security;
alter table patient_family    enable row level security;
alter table patient_caregiver enable row level security;
alter table reports           enable row level security;
alter table visits            enable row level security;
alter table messages          enable row level security;
alter table leads             enable row level security;
alter table lead_notes        enable row level security;
alter table caregiver_roster  enable row level security;
alter table add_on_orders     enable row level security;
alter table payment_shares    enable row level security;
alter table payments          enable row level security;
alter table alerts            enable row level security;
alter table audit_log         enable row level security;

-- ------------------------------------------------------------------
-- Profiles: you see your own; admins see all. Role change guarded by trigger.
-- ------------------------------------------------------------------
create policy profiles_select on profiles for select
  using (id = auth.uid() or is_admin());
create policy profiles_update on profiles for update
  using (id = auth.uid() or is_admin());

-- ------------------------------------------------------------------
-- Patients: linked family, assigned caregiver, or admin. Only admin writes.
-- ------------------------------------------------------------------
create policy patients_select on patients for select
  using (is_linked_family(id) or is_assigned_caregiver(id) or is_admin());
create policy patients_write on patients for all
  using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------------
-- Link tables: you can see your own links; only admin manages them.
-- ------------------------------------------------------------------
create policy pf_select on patient_family for select
  using (user_id = auth.uid() or is_admin());
create policy pf_write on patient_family for all
  using (is_admin()) with check (is_admin());

create policy pc_select on patient_caregiver for select
  using (user_id = auth.uid() or is_admin());
create policy pc_write on patient_caregiver for all
  using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------------
-- Reports (health data): linked family + assigned caregiver + admin read.
-- Only the assigned caregiver can file a report, and only as themselves.
-- ------------------------------------------------------------------
create policy reports_select on reports for select
  using (is_linked_family(patient_id) or is_assigned_caregiver(patient_id) or is_admin());
create policy reports_insert on reports for insert
  with check (is_assigned_caregiver(patient_id) and caregiver_id = auth.uid());
create policy reports_admin on reports for update
  using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------------
-- Visits: linked family + assigned caregiver + admin read; admin writes.
-- ------------------------------------------------------------------
create policy visits_select on visits for select
  using (is_linked_family(patient_id) or is_assigned_caregiver(patient_id) or is_admin());
create policy visits_write on visits for all
  using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------------
-- Messages: participants (linked family / assigned caregiver) + admin.
-- You can only post as yourself.
-- ------------------------------------------------------------------
create policy messages_select on messages for select
  using (is_linked_family(patient_id) or is_assigned_caregiver(patient_id) or is_admin());
create policy messages_insert on messages for insert
  with check ((is_linked_family(patient_id) or is_assigned_caregiver(patient_id))
              and sender_id = auth.uid());

-- ------------------------------------------------------------------
-- Leads + notes: admin-only. Public capture goes through the submit-lead
-- Edge Function (service role), so there is deliberately NO insert policy.
-- ------------------------------------------------------------------
create policy leads_select on leads for select using (is_admin());
create policy leads_update on leads for update using (is_admin()) with check (is_admin());
create policy lead_notes_all on lead_notes for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------------
-- Caregiver roster / vetting: admin-only.
-- ------------------------------------------------------------------
create policy roster_all on caregiver_roster for all
  using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------------
-- Add-on orders: linked family + admin read; family requests for their
-- own patient; admin updates status.
-- ------------------------------------------------------------------
create policy addon_select on add_on_orders for select
  using (is_linked_family(patient_id) or is_admin());
create policy addon_insert on add_on_orders for insert
  with check (is_linked_family(patient_id) and requested_by = auth.uid());
create policy addon_update on add_on_orders for update
  using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------------
-- Payment shares: linked family + admin READ ONLY for clients.
-- No client update/insert policy — status is set by the server (service
-- role) after a verified webhook. The browser can never mark itself paid.
-- ------------------------------------------------------------------
create policy shares_select on payment_shares for select
  using (is_linked_family(patient_id) or is_admin());

-- ------------------------------------------------------------------
-- Payments ledger: linked family + admin READ ONLY. Writes are server-only.
-- ------------------------------------------------------------------
create policy payments_select on payments for select
  using (is_linked_family(patient_id) or is_admin());

-- ------------------------------------------------------------------
-- Alerts: linked family + admin read; family/caregiver can raise; admin resolves.
-- ------------------------------------------------------------------
create policy alerts_select on alerts for select
  using (is_linked_family(patient_id) or is_admin());
create policy alerts_insert on alerts for insert
  with check ((is_linked_family(patient_id) or is_assigned_caregiver(patient_id))
              and raised_by = auth.uid());
create policy alerts_update on alerts for update
  using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------------
-- Audit log: admin read-only. Inserts happen via SECURITY DEFINER
-- triggers / the service role, so there is no client insert policy.
-- ------------------------------------------------------------------
create policy audit_select on audit_log for select using (is_admin());
