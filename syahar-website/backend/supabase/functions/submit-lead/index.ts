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

// Cloudflare Turnstile verification. Configure TURNSTILE_SECRET to enforce it;
// if unset, verification is skipped (dev) — set it before launch.
async function captchaOk(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET');
  if (!secret) return true; // not configured yet
  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    },
  );
  const data = await res.json().catch(() => ({ success: false }));
  return Boolean(data.success);
}

// Stable per-IP bucket without storing the raw IP (privacy): sha256 the IP.
async function ipHash(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';

  // Rate limit: max 5 submissions per IP per 10 minutes (durable counter).
  const { data: allowed } = await admin.rpc('rate_limit_check', {
    p_bucket: 'lead:' + (await ipHash(ip)),
    p_limit: 5,
    p_window_seconds: 600,
  });
  if (allowed === false) {
    return new Response('Too many requests. Please try again later.', { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return new Response('Bad request', { status: 400 });

  // Bot check.
  if (!(await captchaOk(String(body.captchaToken ?? ''), ip))) {
    return new Response('Captcha failed', { status: 403 });
  }

  const name = clean(body.name);
  const contact = clean(body.contact);
  if (name.length < 2 || contact.length < 2) {
    return new Response('Name and contact required', { status: 422 });
  }

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
