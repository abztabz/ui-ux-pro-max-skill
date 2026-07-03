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

// Requests an add-on. RLS requires the requester be linked to the patient;
// status is fixed server-side so the client can't self-approve.
export async function requestAddon(formData: FormData) {
  const { supabase, user } = await requireRole(['family', 'admin']);
  const patient_id = String(formData.get('patient_id') ?? '');
  const item = String(formData.get('item') ?? '');
  const price = String(formData.get('price') ?? '');
  if (!patient_id || !item) redirect('/family/addons');

  await supabase.from('add_on_orders').insert({
    patient_id,
    requested_by: user.id,
    item,
    price,
    status: 'Requested',
  });

  revalidatePath('/family/addons');
  redirect('/family/addons');
}

// Raises an emergency/care alert. RLS requires the raiser be linked to the
// patient (or the assigned caregiver) and raised_by = their own id.
export async function raiseAlert(formData: FormData) {
  const { supabase, user } = await requireRole(['family', 'admin']);
  const patient_id = String(formData.get('patient_id') ?? '');
  const level = Number(formData.get('level') ?? 0);
  const local_contact = String(formData.get('local_contact') ?? '') || null;
  if (!patient_id || ![1, 2, 3].includes(level)) redirect('/family/emergency');

  await supabase.from('alerts').insert({
    patient_id,
    raised_by: user.id,
    level,
    body: `Family raised a level-${level} alert from the dashboard.`,
    local_contact,
  });

  revalidatePath('/family/emergency');
  redirect('/family/emergency?raised=1');
}
