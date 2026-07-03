import { LeadForm } from './LeadForm';

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1>Be there for your parents — even from an ocean away.</h1>
      <p>
        Syahar places vetted, insured caregivers with your ageing parents in
        Nepal, and sends you verified proof of every visit. Managed and paid
        entirely from abroad.
      </p>

      <h2>Request a call</h2>
      <LeadForm />

      <p style={{ marginTop: 24 }}>
        Already a member? <a href="/login">Log in</a>
      </p>
    </main>
  );
}
