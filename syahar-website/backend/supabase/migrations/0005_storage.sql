-- Private Storage bucket for care documents. Files are laid out as
--   <patient_id>/<filename>
-- so the RLS policies can derive the patient from the path and apply the same
-- access rule as the care_documents metadata: linked family + assigned
-- caregiver + admin may read; only admins may write.

insert into storage.buckets (id, name, public)
values ('care-documents', 'care-documents', false)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

-- Read: admin, or a family/caregiver linked to the patient in the path.
create policy "care_docs_read" on storage.objects for select using (
  bucket_id = 'care-documents' and (
    is_admin()
    or is_linked_family(((storage.foldername(name))[1])::uuid)
    or is_assigned_caregiver(((storage.foldername(name))[1])::uuid)
  )
);

-- Write/replace/remove: admin only.
create policy "care_docs_insert" on storage.objects for insert with check (
  bucket_id = 'care-documents' and is_admin()
);
create policy "care_docs_update" on storage.objects for update using (
  bucket_id = 'care-documents' and is_admin()
);
create policy "care_docs_delete" on storage.objects for delete using (
  bucket_id = 'care-documents' and is_admin()
);
