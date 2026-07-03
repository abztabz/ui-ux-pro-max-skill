import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Role = 'family' | 'caregiver' | 'admin';

// Loads the signed-in user + their profile, or redirects to /login.
// Wrapped in React cache() so the layout, its role guard, and the page all
// share ONE getUser + profile lookup per request instead of repeating them.
export const requireUser = cache(async () => {
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
});

// Same, but also enforces the role. Middleware already blocks anonymous
// access to protected paths; this adds the role check (defense in depth on
// top of RLS, which is the real backstop).
export async function requireRole(roles: Role | Role[]) {
  const ctx = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(ctx.profile.role as Role)) {
    // Wrong role but still authenticated — send them to their own home, not a
    // login form they don't need.
    redirect(homeForRole(ctx.profile.role));
  }
  return ctx;
}

// Where each role lands after login.
export function homeForRole(role: Role | string): string {
  if (role === 'admin') return '/admin/leads';
  if (role === 'caregiver') return '/caregiver/visits';
  return '/family';
}
