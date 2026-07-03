import { getPatient } from '@/lib/family';
import { requestAddon } from '../actions';

// À la carte add-ons the family can request. RLS insert policy requires the
// requester to be linked to the patient; status is server-set to 'Requested'.
const CATALOG = [
  { item: 'Doctor home visit', price: 'Rs 3,500' },
  { item: 'Medicine delivery', price: 'Rs 600' },
  { item: 'Physiotherapy session', price: 'Rs 2,000' },
  { item: 'Festival visit & gift', price: 'Rs 2,500' },
];

export default async function AddonsPage() {
  const { supabase, patient } = await getPatient();
  if (!patient) return <p>No care file yet.</p>;

  const { data: orders } = await supabase
    .from('add_on_orders')
    .select('item, status')
    .eq('patient_id', patient.id);

  const requested = new Set(
    (orders ?? []).filter((o) => o.status === 'Requested').map((o) => o.item),
  );

  return (
    <section style={{ maxWidth: 640 }}>
      <h1>Add-ons for {patient.full_name}</h1>
      <p className="muted">One-off, added to next month&apos;s bill.</p>

      <div className="stack">
        {CATALOG.map((a) => (
          <div
            key={a.item}
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <span style={{ flex: 1 }}>
              <b>{a.item}</b> · <span style={{ color: 'var(--teal-700)' }}>{a.price}</span>
            </span>
            {requested.has(a.item) ? (
              <span className="badge badge-success">Requested</span>
            ) : (
              <form action={requestAddon}>
                <input type="hidden" name="patient_id" value={patient.id} />
                <input type="hidden" name="item" value={a.item} />
                <input type="hidden" name="price" value={a.price} />
                <button type="submit" className="btn-ghost">
                  Request
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
