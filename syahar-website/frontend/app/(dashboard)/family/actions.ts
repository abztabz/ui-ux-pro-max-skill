'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';

// Sends a chat message on a patient thread. The RLS insert policy requires
// the sender to be a linked family member (or assigned caregiver) AND that
// sender_id is their own id.
export async function sendMessage(formData: FormData) {
  const { supabase, user } = await requireRole(['family', 'admin']);

  const patient_id = String(formData.get('patient_id') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  if (!patient_id || !body) redirect('/family/chat');

  await supabase.from('messages').insert({
    patient_id,
    sender_id: user.id,
    body,
  });

  revalidatePath('/family/chat');
  redirect('/family/chat');
}
