import type { ReactNode } from 'react';
import { requireUser, type Role } from '@/lib/auth';
import { signOut } from '@/app/auth/actions';

const NAV: Record<Role, { href: string; label: string }[]> = {
  family: [
    { href: '/family', label: 'Home' },
    { href: '/family/health', label: 'Health' },
    { href: '/family/log', label: 'Daily log' },
    { href: '/family/chat', label: 'Chat' },
    { href: '/family/billing', label: 'Billing' },
  ],
  caregiver: [
    { href: '/caregiver/visits', label: 'Visits' },
    { href: '/caregiver/report', label: 'File report' },
  ],
  admin: [
    { href: '/admin/leads', label: 'Leads' },
    { href: '/admin/payments', label: 'Payments' },
  ],
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = await requireUser();
  const links = NAV[profile.role as Role] ?? [];

  return (
    <div>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 20px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <b>Syahar</b>
        <nav style={{ display: 'flex', gap: 12 }}>
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <span style={{ marginLeft: 'auto' }}>
          {profile.full_name} · {profile.role}
        </span>
        <form action={signOut}>
          <button type="submit">Log out</button>
        </form>
      </header>
      <main style={{ padding: 20 }}>{children}</main>
    </div>
  );
}
