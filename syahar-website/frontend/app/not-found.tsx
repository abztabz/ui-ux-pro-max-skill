// Rendered per-request so the CSP nonce reaches its scripts (the default
// not-found is static and would trip the strict script-src).
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <main style={{ maxWidth: 480, margin: '10vh auto', padding: 24 }}>
      <h1>Page not found</h1>
      <p>
        The page you&apos;re looking for doesn&apos;t exist. <a href="/">Go home</a>.
      </p>
    </main>
  );
}
