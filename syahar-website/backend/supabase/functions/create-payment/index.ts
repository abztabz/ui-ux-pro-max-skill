// create-payment — starts a real gateway payment for a share.
//
// The client calls this (authenticated). We look up the share, create a
// pending payment row + a gateway order, and return the gateway's hosted
// checkout URL. The card is entered on the gateway's page, never ours —
// so card data and PCI scope stay entirely with the gateway.
//
// This function does NOT mark anything paid. Only payment-webhook does,
// and only after verifying the gateway's signature.

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // Authenticated client — RLS still applies for the share lookup, so a
  // user can only start a payment for a share on their own patient.
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { share_id, method } = await req.json();
  if (!share_id) return new Response('share_id required', { status: 400 });

  // RLS ensures this returns a row only if the caller may see it.
  const { data: share, error } = await supabase
    .from('payment_shares').select('id, patient_id, amount_display, status')
    .eq('id', share_id).single();

  if (error || !share) return new Response('Share not found', { status: 404 });
  if (share.status === 'paid') return new Response('Already paid', { status: 409 });

  // TODO: create the order with your gateway SDK using GATEWAY_API_KEY
  // (server-side). It returns an order id + hosted checkout URL.
  const gatewayRef = 'GATEWAY_ORDER_ID_PLACEHOLDER';
  const checkoutUrl = 'https://gateway.example/checkout/' + gatewayRef;

  // Record the pending payment with the service role so the webhook can
  // later find it by gateway_ref and flip it to paid.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  await admin.from('payments').insert({
    share_id: share.id,
    patient_id: share.patient_id,
    amount_display: share.amount_display,
    method,
    status: 'pending',
    gateway_ref: gatewayRef,
  });

  return new Response(JSON.stringify({ checkoutUrl }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
});
