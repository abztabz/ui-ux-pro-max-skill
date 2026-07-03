-- Site content for the CMS: a single editable content model the marketing
-- site reads. Publicly readable (it IS the public marketing copy); only
-- admins can write. In production the public site reads this at build/render
-- time; here it is one row keyed 'landing'.

create table site_content (
  id         text primary key,
  content    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

-- Anyone may read published content (anon + authenticated).
create policy content_public_read on site_content for select using (true);
-- Only admins may create/update/delete it.
create policy content_admin_write on site_content for all
  using (is_admin()) with check (is_admin());
