import { MfaVerify } from './MfaVerify';

export default function VerifyPage() {
  return (
    <section style={{ maxWidth: 480 }}>
      <h1>Two-factor verification</h1>
      <p>
        Enter the current code from your authenticator app to continue to the
        coordinator console.
      </p>
      <MfaVerify />
    </section>
  );
}
