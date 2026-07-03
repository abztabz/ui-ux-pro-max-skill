-- Health-detail tables backing the family Health tab: medications, vitals,
-- and care-document metadata. Same access model as reports (linked family +
-- assigned caregiver + admin read), same audit coverage.

create table medications (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  name       text not null,
  schedule   text,
  purpose    text
);

create table vitals (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients(id) on delete cascade,
  recorded_on date not null default current_date,
  bp          text,
  pulse       int,
  weight      numeric(5,2),
  mood        text,
  recorded_by uuid references profiles(id)
);

-- Metadata only. The actual files belong in a PRIVATE Supabase Storage
-- bucket with its own RLS (a Phase-1 follow-on); these rows describe them.
create table care_documents (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  name       text not null,
  kind       text,
  doc_date   date,
  storage_path text
);

alter table medications    enable row level security;
alter table vitals         enable row level security;
alter table care_documents enable row level security;

-- Medications: family/caregiver/admin read; admin manages.
create policy meds_select on medications for select
  using (is_linked_family(patient_id) or is_assigned_caregiver(patient_id) or is_admin());
create policy meds_write on medications for all
  using (is_admin()) with check (is_admin());

-- Vitals: family/caregiver/admin read; the assigned caregiver records them
-- (as themselves); admin can correct.
create policy vitals_select on vitals for select
  using (is_linked_family(patient_id) or is_assigned_caregiver(patient_id) or is_admin());
create policy vitals_insert on vitals for insert
  with check (is_assigned_caregiver(patient_id) and recorded_by = auth.uid());
create policy vitals_admin on vitals for update
  using (is_admin()) with check (is_admin());

-- Care documents: family/caregiver/admin read; admin manages.
create policy docs_select on care_documents for select
  using (is_linked_family(patient_id) or is_assigned_caregiver(patient_id) or is_admin());
create policy docs_write on care_documents for all
  using (is_admin()) with check (is_admin());

-- Audit these health tables like the rest.
create trigger audit_medications    after insert or update or delete on medications    for each row execute function audit_write();
create trigger audit_vitals         after insert or update or delete on vitals         for each row execute function audit_write();
create trigger audit_care_documents after insert or update or delete on care_documents for each row execute function audit_write();
