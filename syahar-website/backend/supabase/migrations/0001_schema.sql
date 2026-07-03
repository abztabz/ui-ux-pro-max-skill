-- Syahar production schema.
-- Grounded in the demo's data shapes (assets/js/store.js), now server-side
-- with real identities, foreign keys, and audit. RLS policies live in 0002.

-- ------------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------------
create type user_role      as enum ('family', 'caregiver', 'admin');
create type share_status   as enum ('due', 'paid');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type vetting_status as enum ('documents_requested', 'in_progress', 'complete');

-- ------------------------------------------------------------------
-- Profiles — one row per auth user. Role lives here, NOT on the client.
-- ------------------------------------------------------------------
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  role            user_role not null default 'family',
  full_name       text not null,
  avatar_initials text,
  country         text,
  city            text,
  created_at      timestamptz not null default now()
);

-- New signups get a profile automatically, ALWAYS as 'family'.
-- Elevation to caregiver/admin is a deliberate admin action (see README).
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'family', coalesce(new.raw_user_meta_data->>'full_name', 'Member'));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Nobody can change their own role except an admin (blocks self-promotion).
create or replace function guard_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  then
    raise exception 'role changes are admin-only';
  end if;
  return new;
end; $$;

create trigger guard_profile_role
  before update on profiles
  for each row execute function guard_role_change();

-- ------------------------------------------------------------------
-- Patients + the link tables that drive all access decisions.
-- (Defined before the access-helper functions below, because those
--  functions are `language sql` and their bodies are validated against
--  these tables at creation time.)
-- ------------------------------------------------------------------
create table patients (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  age               int,
  city              text,
  plan              text,
  blood_group       text,
  conditions        text[],
  allergies         text[],
  doctor            text,
  emergency_contact text,
  created_at        timestamptz not null default now()
);

-- Which family members belong to which patient (many-to-many).
create table patient_family (
  patient_id uuid references patients(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  primary key (patient_id, user_id)
);

-- Which caregiver is assigned to which patient.
create table patient_caregiver (
  patient_id uuid references patients(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  primary key (patient_id, user_id)
);

-- ------------------------------------------------------------------
-- Access helper functions (SECURITY DEFINER = they bypass RLS to answer
-- the access question, which avoids recursive policy evaluation). Defined
-- here, after the link tables their bodies reference.
-- ------------------------------------------------------------------
create or replace function is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_linked_family(p_patient uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from patient_family
                 where patient_id = p_patient and user_id = auth.uid());
$$;

create or replace function is_assigned_caregiver(p_patient uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from patient_caregiver
                 where patient_id = p_patient and user_id = auth.uid());
$$;

-- ------------------------------------------------------------------
-- Health data — caregiver daily reports + scheduled visits
-- ------------------------------------------------------------------
create table reports (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients(id) on delete cascade,
  caregiver_id  uuid not null references profiles(id),
  report_date   date not null default current_date,
  visit         text,
  meals         text,
  meds          text,
  mobility      text,
  mood          text,
  notes         text,
  photo_consent boolean not null default false,
  created_at    timestamptz not null default now()
);

create table visits (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  visit_date date not null,
  time_range text,
  address    text,
  tasks      text[],
  status     text not null default 'upcoming'
);

-- ------------------------------------------------------------------
-- Chat — one thread per patient
-- ------------------------------------------------------------------
create table messages (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  sender_id  uuid not null references profiles(id),
  body       text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Leads — landing-page enquiries (admin-facing CRM). Inserted only via
-- the submit-lead Edge Function (service role), never by anon clients.
-- ------------------------------------------------------------------
create table leads (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  contact           text not null,
  city              text,
  intent            text,
  emergency_contact text,
  status            text not null default 'New',
  stage             text not null default 'enquiry',
  next_action       text,
  created_at        timestamptz not null default now()
);

create table lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Caregiver roster + hard-stop vetting checklist (SOP 2)
-- ------------------------------------------------------------------
create table caregiver_roster (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  name       text not null,
  area       text,
  vetting    vetting_status not null default 'documents_requested',
  backup     text,
  checklist  jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Add-on orders (à la carte layer)
-- ------------------------------------------------------------------
create table add_on_orders (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  requested_by uuid references profiles(id),
  item       text not null,
  price      text,
  status     text not null default 'Requested',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Billing + payments. Status is written ONLY by the server (service role)
-- after a verified gateway webhook. Clients can read, never mark paid.
-- ------------------------------------------------------------------
create table payment_shares (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients(id) on delete cascade,
  payer_user_id uuid references profiles(id),
  label         text not null,           -- e.g. "Kiran Dhakal (you)"
  amount_display text not null,          -- e.g. "Rs 16,000 · £91"
  status        share_status not null default 'due',
  method        text,
  paid_at       timestamptz
);

create table payments (
  id         uuid primary key default gen_random_uuid(),
  share_id   uuid references payment_shares(id) on delete set null,
  patient_id uuid not null references patients(id) on delete cascade,
  payer      text,
  amount_display text,
  method     text,
  status     payment_status not null default 'pending',
  gateway_ref text,                       -- reference from Razorpay/Stripe
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Emergency / alert feed (SOP 6)
-- ------------------------------------------------------------------
create table alerts (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid references patients(id) on delete cascade,
  raised_by      uuid references profiles(id),
  level          int not null check (level between 1 and 3),
  body           text not null,
  local_contact  text,
  resolved       boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Audit log — append-only record of writes to sensitive tables.
-- (Read-access auditing is done at the API/Edge-Function layer, since
--  Postgres has no SELECT triggers.)
-- ------------------------------------------------------------------
create table audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  actor      uuid,
  action     text,
  table_name text,
  row_id     text,
  detail     jsonb
);

create or replace function audit_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (actor, action, table_name, row_id, detail)
  values (auth.uid(), tg_op, tg_table_name,
          coalesce(new.id::text, old.id::text),
          jsonb_build_object('op', tg_op));
  return coalesce(new, old);
end; $$;

-- Audit every write to health + payment tables.
create trigger audit_patients        after insert or update or delete on patients        for each row execute function audit_write();
create trigger audit_reports         after insert or update or delete on reports         for each row execute function audit_write();
create trigger audit_payment_shares  after insert or update or delete on payment_shares  for each row execute function audit_write();
create trigger audit_payments        after insert or update or delete on payments        for each row execute function audit_write();
