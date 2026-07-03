import { createClient } from '@/lib/supabase/server';
import { completeOrder, resolveAlert } from '../actions';

// Operational feed: add-on orders + the emergency/alert queue. Admin-only.
export default async function OpsPage() {
  const supabase = await createClient();

  const [{ data: orders }, { data: alerts }] = await Promise.all([
    supabase
      .from('add_on_orders')
      .select('id, item, price, status, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('alerts')
      .select('id, level, body, local_contact, resolved, created_at')
      .order('created_at', { ascending: false }),
  ]);

  const levelLabel: Record<number, string> = {
    3: 'Level 3 · Medical emergency',
    2: 'Level 2 · Urgent',
    1: 'Level 1 · Operational',
  };

  return (
    <section style={{ maxWidth: 820 }}>
      <h1>Operations</h1>

      <h2>Emergency &amp; alert feed</h2>
      <div className="stack">
        {(alerts ?? []).map((a) => (
          <div key={a.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <b>{levelLabel[a.level] ?? 'Alert'}</b>
              <span
                className={`badge ${a.resolved ? 'badge-success' : 'badge-rose'}`}
                style={{ marginLeft: 'auto' }}
              >
                {a.resolved ? 'Resolved' : 'OPEN'}
              </span>
            </div>
            <p style={{ margin: '4px 0' }}>{a.body}</p>
            {a.local_contact && (
              <p className="muted" style={{ margin: 0 }}>
                Local contact alerted: {a.local_contact}
              </p>
            )}
            {!a.resolved && (
              <form action={resolveAlert} style={{ marginTop: 8 }}>
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="btn-ghost">
                  Mark resolved
                </button>
              </form>
            )}
          </div>
        ))}
        {(alerts ?? []).length === 0 && <p>No alerts.</p>}
      </div>

      <h2>Add-on orders</h2>
      <table>
        <thead>
          <tr>
            <th>Requested</th>
            <th>Item</th>
            <th>Price</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(orders ?? []).map((o) => (
            <tr key={o.id}>
              <td style={{ whiteSpace: 'nowrap' }}>
                {new Date(o.created_at).toLocaleDateString()}
              </td>
              <td>{o.item}</td>
              <td>{o.price ?? '—'}</td>
              <td>
                <span
                  className={`badge ${o.status === 'Completed' ? 'badge-success' : 'badge-amber'}`}
                >
                  {o.status}
                </span>
              </td>
              <td>
                {o.status !== 'Completed' && (
                  <form action={completeOrder}>
                    <input type="hidden" name="id" value={o.id} />
                    <button type="submit" className="btn-ghost">
                      Complete
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(orders ?? []).length === 0 && <p>No add-on orders.</p>}
    </section>
  );
}
