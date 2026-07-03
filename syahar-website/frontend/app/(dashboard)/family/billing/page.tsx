import { createClient } from '@/lib/supabase/server';
import { PayButton } from './PayButton';

// Reads the family's payment shares. RLS guarantees this only ever returns
// shares for a patient the logged-in user is linked to — the query has no
// WHERE clause on ownership because the database enforces it.
export default async function BillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shares } = await supabase
    .from('payment_shares')
    .select('id, label, amount_display, status, method, payer_user_id')
    .order('label');

  const anyDue = (shares ?? []).some((s) => s.status !== 'paid');

  return (
    <section style={{ maxWidth: 640 }}>
      <h1>Billing</h1>
      <p>
        Status:{' '}
        {anyDue ? (
          <b style={{ color: '#a15c00' }}>Payment due</b>
        ) : (
          <b style={{ color: '#0f7b53' }}>Paid</b>
        )}
      </p>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {(shares ?? []).map((s) => (
          <li
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 0',
              borderBottom: '1px solid #eee',
            }}
          >
            <span style={{ flex: 1 }}>
              <b>{s.label}</b>
              <br />
              <small>
                {s.amount_display}
                {s.status === 'paid' && s.method ? ` · via ${s.method}` : ''}
              </small>
            </span>

            {s.status === 'paid' ? (
              <span style={{ color: '#0f7b53' }}>Paid</span>
            ) : s.payer_user_id === user?.id ? (
              <PayButton shareId={s.id} amount={s.amount_display} />
            ) : (
              <span style={{ color: '#a15c00' }}>Due</span>
            )}
          </li>
        ))}
      </ul>

      {(shares ?? []).length === 0 && (
        <p>No billing shares yet for your family.</p>
      )}
    </section>
  );
}
