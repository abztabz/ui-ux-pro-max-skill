import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Role = 'family' | 'caregiver' | 'admin';

// Loads the signed-in user + their profile, or redirects to /login.
// Use in any Server Component / Server Action that needs the user.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();
  if (!profile) redirect('/login');

  return { supabase, user, profile };
}

// Same, but also enforces the role. Middleware already blocks anonymous
// access to protected paths; this adds the role check (defense in depth on
// top of RLS, which is the real backstop).
export async function requireRole(roles: Role | Role[]) {
  const ctx = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(ctx.profile.role as Role)) {
    redirect('/login?denied=1');
  }
  return ctx;
}

// Where each role lands after login.
export function homeForRole(role: Role | string): string {
  if (role === 'admin') return '/admin/leads';
  if (role === 'caregiver') return '/caregiver/visits';
  return '/family/billing';
}
