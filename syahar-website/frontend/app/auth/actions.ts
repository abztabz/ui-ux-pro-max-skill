'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { homeForRole } from '@/lib/auth';

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    redirect('/login?error=' + encodeURIComponent(error?.message ?? 'Login failed'));
  }

  // Send each role to its own home.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  revalidatePath('/', 'layout');
  redirect(homeForRole(profile?.role ?? 'family'));
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('fullName') ?? '');

  // Signups always become 'family' server-side (a DB trigger enforces it).
  // full_name is passed as user metadata; the handle_new_user trigger copies
  // it into the profile row.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) {
    redirect('/signup?error=' + encodeURIComponent(error.message));
  }
  redirect('/login?checkEmail=1');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
