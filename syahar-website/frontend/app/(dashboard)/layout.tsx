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
    { href: '/admin/crm', label: 'CRM' },
    { href: '/admin/roster', label: 'Roster' },
    { href: '/admin/payments', label: 'Payments' },
    { href: '/admin/cms', label: 'CMS' },
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
      <header className="shell-header">
        <span className="brand">Syahar</span>
        <nav>
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <span className="who">
          {profile.full_name} · {profile.role}
        </span>
        <form action={signOut}>
          <button type="submit">Log out</button>
        </form>
      </header>
      <main className="shell-main">{children}</main>
    </div>
  );
}
