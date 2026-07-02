import { createClient } from '@/lib/supabase/server';
import { STAGES, STAGE_IDS, type StageId } from '@/lib/crm';
import { setLeadStage, addLeadNote } from '../actions';

// Lead pipeline. Admin-only via RLS. Each column is a stage; each card can
// move back/forward (server actions) and carries its notes.
export default async function CrmPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, city, intent, next_action, stage, created_at')
    .order('created_at', { ascending: false });

  const { data: notes } = await supabase
    .from('lead_notes')
    .select('id, lead_id, body, created_at')
    .order('created_at', { ascending: false });

  const notesByLead: Record<string, { id: string; body: string }[]> = {};
  for (const n of notes ?? []) {
    (notesByLead[n.lead_id] ??= []).push({ id: n.id, body: n.body });
  }

  return (
    <section>
      <h1>CRM pipeline</h1>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
        {STAGES.map((st) => {
          const cards = (leads ?? []).filter((l) => l.stage === st.id);
          return (
            <div
              key={st.id}
              style={{
                minWidth: 240,
                flex: '0 0 240px',
                background: '#f8fafc',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <b>
                {st.label} ({cards.length})
              </b>
              {cards.map((l) => {
                const idx = STAGE_IDS.indexOf(l.stage as StageId);
                const prev = idx > 0 ? STAGE_IDS[idx - 1] : null;
                const next =
                  idx < STAGE_IDS.length - 1 ? STAGE_IDS[idx + 1] : null;
                return (
                  <div
                    key={l.id}
                    style={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 6,
                      padding: 8,
                      margin: '8px 0',
                    }}
                  >
                    <b>{l.name}</b>
                    <div style={{ fontSize: 12, color: '#555' }}>
                      {l.city ?? '—'} · {l.intent ?? ''}
                    </div>
                    {l.next_action && (
                      <div style={{ fontSize: 12 }}>→ {l.next_action}</div>
                    )}

                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      {prev && (
                        <form action={setLeadStage}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="stage" value={prev} />
                          <button type="submit">◀</button>
                        </form>
                      )}
                      {next && (
                        <form action={setLeadStage}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="stage" value={next} />
                          <button type="submit">Advance ▶</button>
                        </form>
                      )}
                    </div>

                    <details style={{ marginTop: 6 }}>
                      <summary style={{ fontSize: 12 }}>
                        Notes ({(notesByLead[l.id] ?? []).length})
                      </summary>
                      <ul style={{ paddingLeft: 16, fontSize: 12 }}>
                        {(notesByLead[l.id] ?? []).map((n) => (
                          <li key={n.id}>{n.body}</li>
                        ))}
                      </ul>
                      <form action={addLeadNote}>
                        <input type="hidden" name="lead_id" value={l.id} />
                        <input
                          name="body"
                          placeholder="Add a note…"
                          required
                          style={{ width: '100%', fontSize: 12 }}
                        />
                        <button type="submit" style={{ fontSize: 12 }}>
                          Add
                        </button>
                      </form>
                    </details>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
