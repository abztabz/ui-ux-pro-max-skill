-- Two operational helpers:
--   1. A durable rate-limit counter for public endpoints (works across
--      stateless Edge Function invocations, unlike in-memory counters).
--   2. A SECURITY DEFINER function so the app can audit sensitive READS
--      (Postgres has no SELECT trigger; write-audit is already trigger-based).

-- 1. Rate limiting -----------------------------------------------------
create table rate_limit_hits (
  bucket   text not null,        -- e.g. 'lead:<ip-hash>'
  window_start timestamptz not null,
  count    int not null default 0,
  primary key (bucket, window_start)
);

alter table rate_limit_hits enable row level security;
-- No client policies: only the service role (Edge Functions) touches this.

-- Returns true if ALLOWED, false if the caller is over the limit. Atomic
-- upsert on a fixed window. SECURITY DEFINER so the service role can call it.
create or replace function rate_limit_check(
  p_bucket text, p_limit int, p_window_seconds int
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  c int;
begin
  insert into rate_limit_hits (bucket, window_start, count)
  values (p_bucket, w, 1)
  on conflict (bucket, window_start)
  do update set count = rate_limit_hits.count + 1
  returning count into c;
  return c <= p_limit;
end; $$;

-- 2. Read-access audit -------------------------------------------------
-- The authenticated role may record that it read a sensitive row, but only
-- through this function (it cannot INSERT into audit_log directly — no policy).
create or replace function log_read(p_table text, p_row text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (actor, action, table_name, row_id, detail)
  values (auth.uid(), 'SELECT', p_table, p_row, '{}'::jsonb);
end; $$;

grant execute on function log_read(text, text) to authenticated;
