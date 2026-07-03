'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Completes the second factor for this session (aal1 -> aal2). Shown when an
// admin with MFA enrolled hasn't yet passed their TOTP challenge this session.
export function MfaVerify() {
  const supabase = createClient();
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.[0];
      if (totp) setFactorId(totp.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify() {
    setBusy(true);
    setMsg('');
    const ch = await supabase.auth.mfa.challenge({ factorId });
    if (ch.error) {
      setBusy(false);
      setMsg(ch.error.message);
      return;
    }
    const ver = await supabase.auth.mfa.verify({
      factorId,
      challengeId: ch.data.id,
      code,
    });
    if (ver.error) {
      setBusy(false);
      setMsg(ver.error.message);
      return;
    }
    window.location.href = '/admin/leads';
  }

  return (
    <div className="card" style={{ maxWidth: 380 }}>
      <label>
        Authenticator code
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
        />
      </label>
      <button
        onClick={verify}
        disabled={busy || !factorId || code.length < 6}
        style={{ marginTop: 10 }}
      >
        {busy ? 'Verifying…' : 'Verify'}
      </button>
      {msg && <p style={{ color: 'var(--rose-600)', marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
