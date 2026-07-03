import { getPatient } from '@/lib/family';

// Health records: latest vitals, medications, medical profile, documents.
// Every query is scoped to the patient, and RLS guarantees the patient is
// one this family is linked to.
export default async function HealthPage() {
  const { supabase, patient } = await getPatient();
  if (!patient) return <p>No care file yet.</p>;

  const [{ data: vitals }, { data: meds }, { data: docs }] = await Promise.all([
    supabase
      .from('vitals')
      .select('recorded_on, bp, pulse, weight, mood')
      .eq('patient_id', patient.id)
      .order('recorded_on', { ascending: false })
      .limit(1),
    supabase
      .from('medications')
      .select('id, name, schedule, purpose')
      .eq('patient_id', patient.id),
    supabase
      .from('care_documents')
      .select('id, name, kind, doc_date')
      .eq('patient_id', patient.id)
      .order('doc_date', { ascending: false }),
  ]);

  const v = (vitals ?? [])[0];

  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Health records</h1>

      <h2>Latest vitals</h2>
      {v ? (
        <ul>
          <li>Blood pressure: {v.bp ?? '—'}</li>
          <li>Pulse: {v.pulse ?? '—'} bpm</li>
          <li>Weight: {v.weight ?? '—'} kg</li>
          <li>Mood: {v.mood ?? '—'} ({v.recorded_on})</li>
        </ul>
      ) : (
        <p>No vitals recorded yet.</p>
      )}

      <h2>Medications</h2>
      <ul>
        {(meds ?? []).map((m) => (
          <li key={m.id}>
            <b>{m.name}</b> — {m.schedule ?? ''}
            {m.purpose ? ` · ${m.purpose}` : ''}
          </li>
        ))}
        {(meds ?? []).length === 0 && <li>None on file.</li>}
      </ul>

      <h2>Medical profile</h2>
      <ul>
        <li>
          Conditions:{' '}
          {Array.isArray(patient.conditions)
            ? patient.conditions.join(', ')
            : '—'}
        </li>
        <li>
          Allergies:{' '}
          {Array.isArray(patient.allergies)
            ? patient.allergies.join(', ')
            : '—'}
        </li>
        <li>Blood group: {patient.blood_group ?? '—'}</li>
        <li>Doctor: {patient.doctor ?? '—'}</li>
        <li>Local emergency contact: {patient.emergency_contact ?? '—'}</li>
      </ul>

      <h2>Care documents</h2>
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
