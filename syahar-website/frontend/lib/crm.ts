// Pipeline stages (SOP order) and the caregiver vetting hard-stops, shared by
// the admin CRM and roster surfaces and their server actions.

export const STAGES = [
  { id: 'enquiry', label: 'Enquiry' },
  { id: 'qualify', label: 'Qualified' },
  { id: 'match', label: 'Match & vet' },
  { id: 'intro', label: 'Intro call' },
  { id: 'placed', label: 'Placed' },
] as const;

export type StageId = (typeof STAGES)[number]['id'];

export const STAGE_IDS = STAGES.map((s) => s.id) as StageId[];

export const STATUS_BY_STAGE: Record<StageId, string> = {
  enquiry: 'New',
  qualify: 'Discovery call booked',
  match: 'Vetting scheduled',
  intro: 'Intro call scheduled',
  placed: 'Placed',
};

// Hard-stop vetting checklist (SOP 2). All must be true to mark complete.
export const VET_CHECKS = [
  { key: 'id', label: 'Government photo ID on file' },
  { key: 'police', label: 'Police / background check, dated within 12 months' },
  { key: 'references', label: 'Two references — actually called' },
  { key: 'health', label: 'Basic health check' },
  { key: 'insurance', label: 'Insurance cover confirmed' },
  { key: 'screen', label: 'Video screen passed' },
  { key: 'backup', label: 'Named backup caregiver exists' },
] as const;

export const VET_KEYS = VET_CHECKS.map((c) => c.key);
