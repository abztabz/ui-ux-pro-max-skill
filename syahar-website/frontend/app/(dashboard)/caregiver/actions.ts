'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';

// Files a caregiver daily report. The RLS insert policy requires that the
// caller is the assigned caregiver for the patient AND that caregiver_id is
// their own id — both enforced below and again in the database.
export async function fileReport(formData: FormData) {
  const { supabase, user } = await requireRole(['caregiver', 'admin']);

  const patient_id = String(formData.get('patient_id') ?? '');
  if (!patient_id) redirect('/caregiver/report?error=missing-patient');

  const { error } = await supabase.from('reports').insert({
    patient_id,
    caregiver_id: user.id,
    visit: String(formData.get('visit') ?? 'Visit'),
    meals: String(formData.get('meals') ?? ''),
    meds: String(formData.get('meds') ?? ''),
    mobility: String(formData.get('mobility') ?? ''),
    mood: String(formData.get('mood') ?? ''),
    notes: String(formData.get('notes') ?? '') || 'No additional notes.',
    photo_consent: formData.get('photo_consent') === 'on',
  });

  if (error) {
    redirect('/caregiver/report?error=' + encodeURIComponent(error.message));
  }

  // Record vitals too when any were entered (RLS: assigned caregiver only,
  // recorded_by = self). Otherwise the vitals table never gets written.
  const bp = String(formData.get('bp') ?? '').trim();
  const pulse = formData.get('pulse');
  const weight = formData.get('weight');
  if (bp || pulse || weight) {
    await supabase.from('vitals').insert({
      patient_id,
      recorded_by: user.id,
      bp: bp || null,
      pulse: pulse ? Number(pulse) : null,
      weight: weight ? Number(weight) : null,
      mood: String(formData.get('mood') ?? '') || null,
    });
  }

  revalidatePath('/caregiver/visits');
  redirect('/caregiver/visits?filed=1');
}
