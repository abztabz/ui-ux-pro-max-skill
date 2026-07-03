import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// Admins can see every family's data, so MFA is enforced here:
//   - no verified factor yet  -> must enrol (/security)
//   - enrolled but session is aal1 -> must complete the challenge (/security/verify)
// Neither redirect target is under this layout, so there's no loop.
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole('admin');

  const supabase = await createClient();
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal) {
    if (aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      redirect('/security/verify');
    }
    if (aal.nextLevel === 'aal1') {
      // No verified factor — require enrolment before console access.
      redirect('/security?enrol=admin');
    }
  }

  return <>{children}</>;
}
