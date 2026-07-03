import { createClient } from '@/lib/supabase/server';
import { fileReport } from '../actions';

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  // Only patients assigned to this caregiver are visible (RLS on the link
  // table), so the picker can only ever offer valid choices.
  const { data: patients } = await supabase
    .from('patients')
    .select('id, full_name')
    .order('full_name');

  return (
    <section style={{ maxWidth: 560 }}>
      <h1>File a visit report</h1>
      {sp.error && (
        <p role="alert" style={{ color: '#b4232a' }}>
          {sp.error}
        </p>
      )}

      <form
        action={fileReport}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
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
          Visit
          <input name="visit" type="text" defaultValue="Morning visit · 9:00–13:00" />
        </label>
        <label>
          Meals
          <input name="meals" type="text" required />
        </label>
        <label>
          Medication
          <input name="meds" type="text" required />
        </label>
        <label>
          Mobility
          <input name="mobility" type="text" required />
        </label>
        <label>
          Mood
          <input name="mood" type="text" required />
        </label>
        <label>
          Notes
          <textarea name="notes" rows={3} />
        </label>
        <label>
          <input name="photo_consent" type="checkbox" /> Photos shared with
          consent
        </label>
        <button type="submit">Submit report</button>
      </form>
    </section>
  );
}
