// submit-lead — public lead capture from the landing page.
//
// Leads are NOT insertable by anon clients directly (no RLS insert policy),
// because a public table write is a spam/abuse magnet. Instead the form
// posts here, where we validate, rate-limit, and insert with the service
// role. This keeps the CRM table clean and the write path controlled.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

function clean(s: unknown, max = 200): string {
  return String(s ?? '').trim().slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = await req.json().catch(() => null);
  if (!body) return new Response('Bad request', { status: 400 });

  const name = clean(body.name);
  const contact = clean(body.contact);
  if (name.length < 2 || contact.length < 2) {
    return new Response('Name and contact required', { status: 422 });
  }

  // TODO before launch:
  //  - Rate-limit by IP (e.g. Supabase + a counter, or a WAF/edge rule).
  //  - Verify a CAPTCHA / Turnstile token from the form to stop bots.
  //  - Optionally honeypot field check.

  const seekingCare = /need care/i.test(clean(body.intent));
  await admin.from('leads').insert({
    name,
    contact,
    city: clean(body.city) || null,
    intent: clean(body.intent) || 'I need care for my family',
    emergency_contact: seekingCare ? clean(body.emergencyContact) || null : null,
    status: 'New',
    stage: 'enquiry',
    next_action: 'Acknowledge within 24 hours (SOP 1)',
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
});
