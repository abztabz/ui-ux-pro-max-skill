import { signUp } from '@/app/auth/actions';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main style={{ maxWidth: 380, margin: '10vh auto', padding: 24 }}>
      <h1>Create your Syahar account</h1>

      {sp.error && (
        <p role="alert" style={{ color: '#b4232a' }}>
          {sp.error}
        </p>
      )}

      <form
        action={signUp}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <label>
          Full name
          <input name="fullName" type="text" required autoComplete="name" />
        </label>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <button type="submit">Create account</button>
      </form>

      <p>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </main>
  );
}
