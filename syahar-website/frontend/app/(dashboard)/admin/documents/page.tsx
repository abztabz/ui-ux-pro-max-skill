import { createClient } from '@/lib/supabase/server';
import { uploadCareDoc } from '../actions';

// Admin uploads care documents into the private bucket. Files land at
// <patient_id>/<name> so bucket RLS scopes access to the patient's family.
export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; uploaded?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: patients }, { data: docs }] = await Promise.all([
    supabase.from('patients').select('id, full_name').order('full_name'),
    supabase
      .from('care_documents')
      .select('id, name, kind, doc_date, patient_id')
      .order('doc_date', { ascending: false }),
  ]);

  return (
    <section style={{ maxWidth: 640 }}>
      <h1>Care documents</h1>
      {sp.uploaded && <p className="badge badge-success">Uploaded.</p>}
      {sp.error && <p style={{ color: 'var(--rose-600)' }}>{sp.error}</p>}

      <form action={uploadCareDoc} className="stack card">
        <label>
          Patient
          <select name="patient_id" required>
            {(patients ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Document name
          <input name="name" required placeholder="e.g. Care agreement — signed" />
        </label>
        <label>
          Kind
          <input name="kind" placeholder="Contract / Medical / Vetting / Billing" />
        </label>
        <label>
          File
          <input name="file" type="file" required />
        </label>
        <button type="submit">Upload</button>
      </form>

      <h2>On file</h2>
      <ul>
        {(docs ?? []).map((d) => (
          <li key={d.id}>
            <b>{d.name}</b> — {d.kind ?? ''} {d.doc_date ? `· ${d.doc_date}` : ''}
          </li>
        ))}
        {(docs ?? []).length === 0 && <li>No documents yet.</li>}
      </ul>
    </section>
  );
}
