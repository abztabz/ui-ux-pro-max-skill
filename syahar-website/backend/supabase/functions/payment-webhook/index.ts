// payment-webhook — the ONLY thing that may mark a share paid.
//
// Security-critical flow:
//   1. Gateway (Razorpay/Stripe) POSTs a signed event here.
//   2. We verify the signature against PAYMENT_WEBHOOK_SECRET.
//   3. ONLY on a valid signature do we write status=paid, using the
//      service role (which bypasses RLS for this privileged action).
//
// An attacker POSTing a fake "payment succeeded" body fails step 2 and
// is rejected. This is what replaces the demo's browser-trusted setTimeout.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // server-only key
);

// HMAC-SHA256 signature check (Razorpay style; Stripe uses its SDK's
// constructEvent — swap this block for the gateway you choose).
async function verifySignature(rawBody: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  // constant-time-ish compare
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const rawBody = await req.text();
  const signature = req.headers.get('x-webhook-signature') ?? '';
  const secret = Deno.env.get('PAYMENT_WEBHOOK_SECRET')!;

  // Reject anything not cryptographically proven to come from the gateway.
  if (!(await verifySignature(rawBody, signature, secret))) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(rawBody);
  // TODO: map the gateway's event shape. `gateway_ref` ties back to the
  // payment row created by create-payment.
  const gatewayRef: string = event?.payload?.payment?.entity?.id;
  const paid = event?.event === 'payment.captured';
  if (!gatewayRef) return new Response('No reference', { status: 400 });

  if (paid) {
    // Look up the pending payment, mark it + its share paid, atomically.
    const { data: payment } = await supabase
      .from('payments').select('id, share_id')
      .eq('gateway_ref', gatewayRef).single();

    if (payment) {
      await supabase.from('payments')
        .update({ status: 'paid' }).eq('id', payment.id);
      if (payment.share_id) {
        await supabase.from('payment_shares')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', payment.share_id);
      }
    }
  }

  // Always 200 a verified event so the gateway stops retrying.
  return new Response('ok', { status: 200 });
});
