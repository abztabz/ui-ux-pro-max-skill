'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import {
  STAGE_IDS,
  STATUS_BY_STAGE,
  VET_KEYS,
  type StageId,
} from '@/lib/crm';

// --- CRM ---------------------------------------------------------------

export async function setLeadStage(formData: FormData) {
  const { supabase } = await requireRole('admin');
  const id = String(formData.get('id') ?? '');
  const stage = String(formData.get('stage') ?? '') as StageId;
  if (!id || !STAGE_IDS.includes(stage)) redirect('/admin/crm');

  await supabase
    .from('leads')
    .update({ stage, status: STATUS_BY_STAGE[stage] })
    .eq('id', id);

  revalidatePath('/admin/crm');
  redirect('/admin/crm');
}

export async function addLeadNote(formData: FormData) {
  const { supabase } = await requireRole('admin');
  const lead_id = String(formData.get('lead_id') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  if (!lead_id || !body) redirect('/admin/crm');

  await supabase.from('lead_notes').insert({ lead_id, body });

  revalidatePath('/admin/crm');
  redirect('/admin/crm');
}

// --- Roster / vetting --------------------------------------------------

export async function saveVetting(formData: FormData) {
  const { supabase } = await requireRole('admin');
  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/admin/roster');

  // Rebuild the checklist from the submitted checkboxes.
  const checklist: Record<string, boolean> = {};
  for (const key of VET_KEYS) {
    checklist[key] = formData.get(`chk_${key}`) === 'on';
  }
  const allDone = VET_KEYS.every((k) => checklist[k]);

  await supabase
    .from('caregiver_roster')
    .update({
      checklist,
      vetting: allDone ? 'complete' : 'in_progress',
    })
    .eq('id', id);

  revalidatePath('/admin/roster');
  redirect('/admin/roster');
}

// --- Orders + alerts ---------------------------------------------------

export async function completeOrder(formData: FormData) {
  const { supabase } = await requireRole('admin');
  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/admin/ops');
  await supabase.from('add_on_orders').update({ status: 'Completed' }).eq('id', id);
  revalidatePath('/admin/ops');
  redirect('/admin/ops');
}

export async function resolveAlert(formData: FormData) {
  const { supabase } = await requireRole('admin');
  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/admin/ops');
  await supabase.from('alerts').update({ resolved: true }).eq('id', id);
  revalidatePath('/admin/ops');
  redirect('/admin/ops');
}

// --- Care documents (Storage) ------------------------------------------

export async function uploadCareDoc(formData: FormData) {
  const { supabase } = await requireRole('admin');
  const patient_id = String(formData.get('patient_id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const kind = String(formData.get('kind') ?? '');
  const file = formData.get('file');
  if (!patient_id || !name || !(file instanceof File) || file.size === 0) {
    redirect('/admin/documents?error=missing');
  }
  const f = file as File;

  // Path is <patient_id>/<filename> so the bucket RLS can derive the patient.
  const safe = f.name.replace(/[^\w.\-]+/g, '_');
  const path = `${patient_id}/${Date.now()}_${safe}`;

  const { error: upErr } = await supabase.storage
    .from('care-documents')
    .upload(path, f, { contentType: f.type || undefined, upsert: false });
  if (upErr) {
    redirect('/admin/documents?error=' + encodeURIComponent(upErr.message));
  }

  await supabase.from('care_documents').insert({
    patient_id,
    name,
    kind: kind || null,
    doc_date: new Date().toISOString().slice(0, 10),
    storage_path: path,
  });

  revalidatePath('/admin/documents');
  redirect('/admin/documents?uploaded=1');
}

// --- CMS ---------------------------------------------------------------

export async function publishContent(formData: FormData) {
  const { supabase } = await requireRole('admin');

  // Parse the JSON blocks; reject invalid JSON rather than saving garbage.
  let stats: unknown;
  let pricing: unknown;
  let faq: unknown;
  try {
    stats = JSON.parse(String(formData.get('stats') ?? '[]'));
    pricing = JSON.parse(String(formData.get('pricing') ?? '[]'));
    faq = JSON.parse(String(formData.get('faq') ?? '[]'));
  } catch {
    redirect('/admin/cms?error=' + encodeURIComponent('One of the JSON blocks is invalid.'));
  }

  const content = {
    hero: {
      kicker: String(formData.get('hero_kicker') ?? ''),
      title: String(formData.get('hero_title') ?? ''),
      lead: String(formData.get('hero_lead') ?? ''),
    },
    golden: String(formData.get('golden') ?? ''),
    stats,
    pricing,
    faq,
  };

  await supabase
    .from('site_content')
    .upsert({ id: 'landing', content, updated_at: new Date().toISOString() });

  revalidatePath('/admin/cms');
  redirect('/admin/cms?published=1');
}
