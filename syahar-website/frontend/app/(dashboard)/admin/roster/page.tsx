import { createClient } from '@/lib/supabase/server';
import { VET_CHECKS, VET_KEYS } from '@/lib/crm';
import { saveVetting } from '../actions';

// Caregiver roster + hard-stop vetting. Admin-only via RLS. Saving recomputes
// the vetting status: complete only when every hard-stop is checked.
export default async function RosterPage() {
  const supabase = await createClient();

  const { data: roster } = await supabase
    .from('caregiver_roster')
    .select('id, name, area, vetting, backup, checklist')
    .order('name');

  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Caregiver roster</h1>
      <p style={{ color: '#555' }}>
        Hard stops are never overridden. A caregiver joins only when every
        item is checked.
      </p>

      {(roster ?? []).map((c) => {
        const checklist = (c.checklist ?? {}) as Record<string, boolean>;
        const done = VET_KEYS.filter((k) => checklist[k]).length;
        return (
          <form
            key={c.id}
            action={saveVetting}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 12,
              margin: '12px 0',
            }}
          >
            <input type="hidden" name="id" value={c.id} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <b>{c.name}</b>
              <span style={{ color: '#555' }}>· {c.area ?? ''}</span>
              <span
                style={{
                  marginLeft: 'auto',
                  color: c.vetting === 'complete' ? '#0f7b53' : '#a15c00',
                }}
              >
                {c.vetting} ({done}/{VET_KEYS.length})
              </span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
              {VET_CHECKS.map((chk) => (
                <li key={chk.key}>
                  <label>
                    <input
                      type="checkbox"
                      name={`chk_${chk.key}`}
                      defaultChecked={!!checklist[chk.key]}
                    />{' '}
                    {chk.label}
                  </label>
                </li>
              ))}
            </ul>

            <button type="submit">Save vetting</button>
          </form>
        );
      })}
      {(roster ?? []).length === 0 && <p>No caregivers on the roster yet.</p>}
    </section>
  );
}
