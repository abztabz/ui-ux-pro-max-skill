import { createClient } from '@/lib/supabase/server';

// Payments ledger. Admin-visible via RLS. Every row here was written by the
// server after a verified gateway webhook — never by a browser claim.
export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from('payments')
    .select('id, payer, amount_display, method, status, gateway_ref, created_at')
    .order('created_at', { ascending: false });

  const { data: dueShares } = await supabase
    .from('payment_shares')
    .select('label, amount_display, status')
    .neq('status', 'paid');

  return (
    <section>
      <h1>Payments</h1>

      {(dueShares ?? []).length > 0 && (
        <p
          style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            padding: 12,
            borderRadius: 6,
          }}
        >
          Outstanding:{' '}
          {(dueShares ?? [])
            .map((d) => `${d.label} — ${d.amount_display}`)
            .join(' · ')}
        </p>
      )}

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: 8 }}>Received</th>
            <th style={{ padding: 8 }}>Paid by</th>
            <th style={{ padding: 8 }}>Amount</th>
            <th style={{ padding: 8 }}>Method</th>
            <th style={{ padding: 8 }}>Reference</th>
            <th style={{ padding: 8 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {(payments ?? []).map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                {new Date(p.created_at).toLocaleString()}
              </td>
              <td style={{ padding: 8 }}>{p.payer ?? '—'}</td>
              <td style={{ padding: 8 }}>{p.amount_display ?? '—'}</td>
              <td style={{ padding: 8 }}>{p.method ?? '—'}</td>
              <td style={{ padding: 8, fontFamily: 'monospace' }}>
                {p.gateway_ref ?? '—'}
              </td>
              <td style={{ padding: 8 }}>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(payments ?? []).length === 0 && <p>No payments yet.</p>}
    </section>
  );
}
