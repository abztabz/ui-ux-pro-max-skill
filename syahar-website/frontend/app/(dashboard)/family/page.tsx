import { getPatient } from '@/lib/family';

// Family home: who's being cared for, this week's visits, latest proof.
export default async function FamilyHome() {
  const { supabase, patient } = await getPatient();

  if (!patient) {
    return (
      <section>
        <h1>Welcome</h1>
        <p>Your family's care isn't set up yet. Your coordinator will link you
          to your parent's care file shortly.</p>
      </section>
    );
  }

  const { data: visits } = await supabase
    .from('visits')
    .select('id, visit_date, time_range, tasks, status')
    .eq('patient_id', patient.id)
    .order('visit_date')
    .limit(5);

  const { data: reports } = await supabase
    .from('reports')
    .select('report_date, notes')
    .eq('patient_id', patient.id)
    .order('report_date', { ascending: false })
    .limit(1);

  const latest = (reports ?? [])[0];

  return (
    <section style={{ maxWidth: 720 }}>
      <h1>{patient.full_name}</h1>
      <p>
        {patient.city ?? ''}
        {patient.plan ? ` · ${patient.plan}` : ''}
      </p>

      {latest && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 8,
            padding: 12,
            margin: '12px 0',
          }}
        >
          <b>Latest proof · {latest.report_date}</b>
          <p style={{ margin: '4px 0 0' }}>{latest.notes}</p>
        </div>
      )}

      <h2>This week</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {(visits ?? []).map((v) => (
          <li
            key={v.id}
            style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}
          >
            <b>
              {v.visit_date} · {v.time_range}
            </b>
            {v.status === 'today' && (
              <span style={{ marginLeft: 8, color: '#a15c00' }}>Today</span>
            )}
            <br />
            <small>
              {Array.isArray(v.tasks) ? v.tasks.join(' · ') : ''}
            </small>
          </li>
        ))}
        {(visits ?? []).length === 0 && <li>No visits scheduled yet.</li>}
      </ul>
    </section>
  );
}
