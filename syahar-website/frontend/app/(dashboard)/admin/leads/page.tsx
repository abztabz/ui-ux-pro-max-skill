import { createClient } from '@/lib/supabase/server';

// Leads CRM inbox. RLS restricts the leads table to admins, so this query
// returns nothing for any other role even if the route were reached.
export default async function LeadsPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, contact, city, intent, status, created_at')
    .order('created_at', { ascending: false });

  return (
    <section>
      <h1>Leads</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: 8 }}>Received</th>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Contact</th>
            <th style={{ padding: 8 }}>City</th>
            <th style={{ padding: 8 }}>Interest</th>
            <th style={{ padding: 8 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {(leads ?? []).map((l) => (
            <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                {new Date(l.created_at).toLocaleString()}
              </td>
              <td style={{ padding: 8 }}>
                <b>{l.name}</b>
              </td>
              <td style={{ padding: 8 }}>{l.contact}</td>
              <td style={{ padding: 8 }}>{l.city ?? '—'}</td>
              <td style={{ padding: 8 }}>{l.intent}</td>
              <td style={{ padding: 8 }}>{l.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(leads ?? []).length === 0 && <p>No leads yet.</p>}
    </section>
  );
}
