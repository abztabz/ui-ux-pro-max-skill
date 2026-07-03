import type { ReactNode } from 'react';
import { requireRole } from '@/lib/auth';

export default async function CaregiverLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(['caregiver', 'admin']);
  return <>{children}</>;
}
