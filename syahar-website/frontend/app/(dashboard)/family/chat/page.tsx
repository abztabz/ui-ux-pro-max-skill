import { requireUser } from '@/lib/auth';
import { getPatient } from '@/lib/family';
import { sendMessage } from '../actions';

// Chat thread with the caregiver. Server-rendered; sending posts a server
// action and revalidates. (Realtime updates via Supabase channels are a
// nice-to-have follow-on, not required for correctness.)
export default async function ChatPage() {
  const { user } = await requireUser();
  const { supabase, patient } = await getPatient();
  if (!patient) return <p>No care file yet.</p>;

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('patient_id', patient.id)
    .order('created_at');

  return (
    <section style={{ maxWidth: 560 }}>
      <h1>Chat</h1>

      <div
        style={{
          border: '1px solid #eee',
          borderRadius: 8,
          padding: 12,
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {(messages ?? []).map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: mine ? 'flex-end' : 'flex-start',
                background: mine ? '#0f7b53' : '#f1f5f9',
                color: mine ? '#fff' : '#111',
                padding: '6px 10px',
                borderRadius: 10,
                maxWidth: '80%',
              }}
            >
              {m.body}
            </div>
          );
        })}
        {(messages ?? []).length === 0 && <p>No messages yet.</p>}
      </div>

      <form
        action={sendMessage}
        style={{ display: 'flex', gap: 8, marginTop: 12 }}
      >
        <input type="hidden" name="patient_id" value={patient.id} />
        <input
          name="body"
          placeholder="Write a message…"
          autoComplete="off"
          required
          style={{ flex: 1 }}
        />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}
