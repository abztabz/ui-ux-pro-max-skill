import { signIn } from '@/app/auth/actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkEmail?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main style={{ maxWidth: 380, margin: '10vh auto', padding: 24 }}>
      <h1>Log in to Syahar</h1>

      {sp.checkEmail && (
        <p role="status">
          Check your email to confirm your account, then log in.
        </p>
      )}
      {sp.error && (
        <p role="alert" style={{ color: '#b4232a' }}>
          {sp.error}
        </p>
      )}

      <form
        action={signIn}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
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
            autoComplete="current-password"
          />
        </label>
        <button type="submit">Log in</button>
      </form>

      <p>
        New here? <a href="/signup">Create an account</a>
      </p>
    </main>
  );
}
