'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Factor = { id: string; friendly_name?: string; status: string };

// TOTP two-factor enrollment via Supabase MFA. Scan the QR with an
// authenticator app, then confirm a code to activate the factor.
export function MfaSetup() {
  const supabase = createClient();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.all ?? []) as Factor[]);
  }
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enroll() {
    setMsg('');
    setBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
  }

  async function verify() {
    setMsg('');
    setBusy(true);
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
    setBusy(false);
    if (ver.error) {
      setMsg(ver.error.message);
      return;
    }
    setMsg('Two-factor authentication enabled.');
    setQr('');
    setSecret('');
    setFactorId('');
    setCode('');
    void refresh();
  }

  async function unenroll(id: string) {
    await supabase.auth.mfa.unenroll({ factorId: id });
    void refresh();
  }

  const verified = factors.filter((f) => f.status === 'verified');

  return (
    <div className="card" style={{ maxWidth: 460 }}>
      <h2>Two-factor authentication</h2>

      {verified.length > 0 && (
        <ul>
          {verified.map((f) => (
            <li key={f.id}>
              {f.friendly_name || 'Authenticator app'} —{' '}
              <span className="badge badge-success">active</span>{' '}
              <button className="btn-ghost" onClick={() => unenroll(f.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {!qr && (
        <button onClick={enroll} disabled={busy}>
          {busy ? 'Working…' : 'Add an authenticator app'}
        </button>
      )}

      {qr && (
        <div className="stack" style={{ marginTop: 12 }}>
          <p>Scan this with your authenticator app:</p>
          {/* Supabase returns the QR as an SVG data URL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="TOTP QR code" width={180} height={180} />
          <p className="muted" style={{ fontSize: 13 }}>
            Or enter this key manually: <code>{secret}</code>
          </p>
          <label>
            6-digit code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </label>
          <button onClick={verify} disabled={busy || code.length < 6}>
            Confirm &amp; enable
          </button>
        </div>
      )}

      {msg && (
        <p style={{ marginTop: 10, color: 'var(--teal-700)' }}>{msg}</p>
      )}
    </div>
  );
}
