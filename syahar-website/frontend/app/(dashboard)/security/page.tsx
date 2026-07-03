import { requireUser } from '@/lib/auth';
import { MfaSetup } from './MfaSetup';

// Account security. Any signed-in user can enrol two-factor auth here.
// Coordinators (admins) should be REQUIRED to — enforce that in the Supabase
// dashboard (Auth → MFA) and/or an AAL2 check in middleware as a follow-on.
export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ enrol?: string }>;
}) {
  const { profile } = await requireUser();
  const sp = await searchParams;

  return (
    <section style={{ maxWidth: 640 }}>
      <h1>Account security</h1>
      {sp.enrol === 'admin' && (
        <p style={{ color: 'var(--rose-600)' }}>
          Two-factor authentication is <b>required</b> for coordinator accounts.
          Set it up below to access the console.
        </p>
      )}
      {profile.role === 'admin' && sp.enrol !== 'admin' && (
        <p style={{ color: 'var(--warning)' }}>
          As a coordinator you can see every family&apos;s data. Two-factor
          authentication is strongly recommended for your account.
        </p>
      )}
      <MfaSetup />
    </section>
  );
}
