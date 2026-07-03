'use client';

import { useState, type FormEvent } from 'react';

// Posts to the submit-lead Edge Function (never directly to the leads table —
// that write path is closed by RLS). The function validates, will rate-limit,
// and inserts with the service role.
export function LeadForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [seekingCare, setSeekingCare] = useState(true);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-lead`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            name: fd.get('name'),
            contact: fd.get('contact'),
            city: fd.get('city'),
            intent: fd.get('intent'),
            emergencyContact: fd.get('emergencyContact'),
          }),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  }

  if (sent) {
    return (
      <p role="status">
        Thank you — a coordinator will be in touch within 24 hours.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}
    >
      <label>
        Full name
        <input name="name" type="text" required />
      </label>
      <label>
        Email or phone
        <input name="contact" type="text" required />
      </label>
      <label>
        Parent&apos;s city (optional)
        <input name="city" type="text" />
      </label>
      <label>
        I want to
        <select
          name="intent"
          defaultValue="I need care for my family"
          onChange={(e) =>
            setSeekingCare(e.currentTarget.value === 'I need care for my family')
          }
        >
          <option>I need care for my family</option>
          <option>I want to provide care</option>
        </select>
      </label>
      {seekingCare && (
        <label>
          Local emergency contact
          <input name="emergencyContact" type="text" required />
        </label>
      )}
      <button type="submit">Request a call</button>
      {error && (
        <p role="alert" style={{ color: '#b4232a' }}>
          {error}
        </p>
      )}
    </form>
  );
}
