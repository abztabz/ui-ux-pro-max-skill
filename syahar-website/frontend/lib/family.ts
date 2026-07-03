import { createClient } from '@/lib/supabase/server';

// The current family's patient. RLS returns only patients this user is linked
// to, so `limit(1)` yields their parent (the demo models one patient per
// family; extend to a list when a user can manage several).
export async function getPatient() {
  const supabase = await createClient();
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .limit(1)
    .maybeSingle();
  return { supabase, patient };
}
