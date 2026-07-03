import { createClient } from '@/lib/supabase/server';
import { publishContent } from '../actions';

const DEFAULTS = {
  hero: {
    kicker: 'Verified care for the parents left behind',
    title: 'Be there for your parents — even from an ocean away.',
    lead: 'Syahar places vetted, insured caregivers with your ageing parents in Nepal.',
  },
  golden: 'We sell peace of mind, not money transfer.',
  stats: [{ value: '3.5M+', label: 'Nepalis working abroad' }],
  pricing: [{ name: 'Care', npr: 'Rs 32,000', approx: '/mo' }],
  faq: [{ q: 'How do I know the caregiver is trustworthy?', a: 'Hard-stop vetting.' }],
};

export default async function CmsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; published?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from('site_content')
    .select('content')
    .eq('id', 'landing')
    .maybeSingle();

  const c = { ...DEFAULTS, ...((row?.content ?? {}) as typeof DEFAULTS) };

  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Landing page content</h1>
      {sp.published && <p style={{ color: '#0f7b53' }}>Published.</p>}
      {sp.error && <p style={{ color: '#b4232a' }}>{sp.error}</p>}

      <form
        action={publishContent}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <h2>Hero</h2>
        <label>
          Kicker
          <input name="hero_kicker" defaultValue={c.hero.kicker} />
        </label>
        <label>
          Title
          <input name="hero_title" defaultValue={c.hero.title} />
        </label>
        <label>
          Lead
          <textarea name="hero_lead" rows={2} defaultValue={c.hero.lead} />
        </label>

        <label>
          Golden rule (footer)
          <input name="golden" defaultValue={c.golden} />
        </label>

        <h2>Structured blocks (JSON)</h2>
        <p style={{ fontSize: 12, color: '#555' }}>
          Edited as JSON for now; a richer editor is a follow-on. Invalid JSON
          is rejected on publish.
        </p>
        <label>
          Stats
          <textarea
            name="stats"
            rows={4}
            defaultValue={JSON.stringify(c.stats, null, 2)}
          />
        </label>
        <label>
          Pricing
          <textarea
            name="pricing"
            rows={4}
            defaultValue={JSON.stringify(c.pricing, null, 2)}
          />
        </label>
        <label>
          FAQ
          <textarea
            name="faq"
            rows={6}
            defaultValue={JSON.stringify(c.faq, null, 2)}
          />
        </label>

        <button type="submit">Publish changes</button>
      </form>
    </section>
  );
}
