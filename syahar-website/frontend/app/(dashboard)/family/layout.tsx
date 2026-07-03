import type { ReactNode } from 'react';
import { requireRole } from '@/lib/auth';

export default async function FamilyLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(['family', 'admin']);
  return <>{children}</>;
}
