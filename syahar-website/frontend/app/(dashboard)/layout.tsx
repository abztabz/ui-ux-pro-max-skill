import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/auth/actions';

// Server-side guard for every dashboard page. Middleware already blocks
// unauthenticated access; here we additionally load the profile (role +
// name) so the shell can render and downstream pages can trust it.
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  return (
    <div>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <b>Syahar</b>
        <span style={{ marginLeft: 'auto' }}>
          {profile?.full_name} · {profile?.role}
        </span>
        <form action={signOut}>
          <button type="submit">Log out</button>
        </form>
      </header>
      <main style={{ padding: 20 }}>{children}</main>
    </div>
  );
}
