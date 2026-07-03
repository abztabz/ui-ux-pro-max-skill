import { getPatient } from '@/lib/family';
import { raiseAlert } from '../actions';

const LEVELS = [
  {
    level: 3,
    title: 'Medical emergency',
    note: 'Collapse, chest pain, fall with injury, stroke signs. Call 102 first, then alert the coordinator.',
  },
  {
    level: 2,
    title: 'Urgent, not life-threatening',
    note: 'Fever, a fall without obvious injury, medication problem. We assess and come back the same day.',
  },
  {
    level: 1,
    title: 'Care or schedule issue',
    note: 'Caregiver did not arrive, schedule conflict, anything that worries you.',
  },
];

export default async function EmergencyPage({
  searchParams,
}: {
  searchParams: Promise<{ raised?: string }>;
}) {
  const sp = await searchParams;
  const { patient } = await getPatient();
  if (!patient) return <p>No care file yet.</p>;

  return (
    <section style={{ maxWidth: 640 }}>
      <h1 style={{ color: 'var(--rose-600)' }}>Emergency</h1>
      <p>
        Your parent is never left to face this alone. Choose the situation. The
        coordinator and the local emergency contact on the care file are both
        alerted.
      </p>

      {sp.raised && (
        <p className="badge badge-success" style={{ display: 'inline-block' }}>
          Coordinator and local contact alerted. You will be called back within
          minutes.
        </p>
      )}

      <a
        className="btn"
        href="tel:102"
        style={{ background: 'var(--rose-600)', display: 'inline-block', margin: '10px 0' }}
      >
        Call ambulance (102) now
      </a>

      <div className="stack">
        {LEVELS.map((l) => (
          <form key={l.level} action={raiseAlert} className="card">
            <input type="hidden" name="patient_id" value={patient.id} />
            <input type="hidden" name="level" value={l.level} />
            <input
              type="hidden"
              name="local_contact"
              value={patient.emergency_contact ?? ''}
            />
            <b>{l.title}</b>
            <p style={{ margin: '4px 0 8px' }}>{l.note}</p>
            <button type="submit" className={l.level === 1 ? 'btn-ghost' : ''}>
              {l.level === 3 ? 'Alert coordinator' : 'Notify coordinator'}
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
