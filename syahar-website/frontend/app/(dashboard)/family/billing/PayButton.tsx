'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Starts a real payment by calling the create-payment Edge Function with the
// user's access token, then hands off to the gateway's hosted checkout. The
// browser never sees card data and never marks anything paid — only the
// signed webhook does that server-side.
export function PayButton({
  shareId,
  amount,
}: {
  shareId: string;
  amount: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ share_id: shareId, method: 'card' }),
        },
      );

      if (!res.ok) throw new Error(await res.text());
      const { checkoutUrl } = (await res.json()) as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch {
      setLoading(false);
      setError('Could not start payment. Please try again.');
    }
  }

  return (
    <span>
      <button onClick={pay} disabled={loading}>
        {loading ? 'Starting…' : `Pay ${amount.split('·')[0].trim()}`}
      </button>
      {error && (
        <span role="alert" style={{ color: '#b4232a', marginLeft: 8 }}>
          {error}
        </span>
      )}
    </span>
  );
}
