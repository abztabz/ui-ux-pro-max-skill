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
