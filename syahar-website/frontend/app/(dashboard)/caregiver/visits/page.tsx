import { createClient } from '@/lib/supabase/server';

// Visits for patients assigned to this caregiver. RLS returns only rows for
// patients where is_assigned_caregiver() is true, so no ownership filter here.
export default async function VisitsPage() {
  const supabase = await createClient();

  const { data: visits } = await supabase
    .from('visits')
    .select('id, visit_date, time_range, address, tasks, status, patient_id')
    .order('visit_date');

  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Your visits</h1>
      {(visits ?? []).length === 0 && <p>No visits scheduled.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {(visits ?? []).map((v) => (
          <li
            key={v.id}
            style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}
          >
            <b>
              {v.visit_date} · {v.time_range}
            </b>
            {v.status === 'today' && (
              <span style={{ marginLeft: 8, color: '#a15c00' }}>Today</span>
            )}
            <br />
            <small>
              {v.address}
              {Array.isArray(v.tasks) && v.tasks.length
                ? ' · ' + v.tasks.join(' · ')
                : ''}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}
