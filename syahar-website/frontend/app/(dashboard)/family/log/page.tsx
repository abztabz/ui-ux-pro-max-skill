import { getPatient } from '@/lib/family';

// Daily care log: every visit report, newest first.
export default async function DailyLogPage() {
  const { supabase, patient } = await getPatient();
  if (!patient) return <p>No care file yet.</p>;

  const { data: reports } = await supabase
    .from('reports')
    .select('id, report_date, visit, meals, meds, mobility, mood, notes, photo_consent')
    .eq('patient_id', patient.id)
    .order('report_date', { ascending: false });

  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Daily care log</h1>
      {(reports ?? []).length === 0 && <p>No reports yet.</p>}
      {(reports ?? []).map((r) => (
        <article
          key={r.id}
          style={{
            border: '1px solid #eee',
            borderRadius: 8,
            padding: 12,
            margin: '12px 0',
          }}
        >
          <b>
            {r.report_date} · {r.visit ?? 'Visit'}
          </b>
          <ul>
            <li>Meals: {r.meals}</li>
            <li>Medication: {r.meds}</li>
            <li>Mobility: {r.mobility}</li>
            <li>Mood: {r.mood}</li>
          </ul>
          <p>{r.notes}</p>
          {r.photo_consent && <small>Photos shared with consent</small>}
        </article>
      ))}
    </section>
  );
}
