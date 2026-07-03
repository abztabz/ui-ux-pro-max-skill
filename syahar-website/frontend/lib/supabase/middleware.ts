// Session refresh + route protection + a per-request nonce Content-Security-
// Policy. The nonce lets us drop 'unsafe-inline'/'unsafe-eval' from script-src:
// Next stamps its own scripts with the nonce (it reads the CSP request header),
// and 'strict-dynamic' lets those trusted scripts load the chunks they need.
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PROTECTED_PREFIXES = ['/family', '/caregiver', '/admin', '/security'];
const SUPABASE = 'https://*.supabase.co';

function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Styles still allow inline (Next injects inline styles + we use style attrs);
    // a nonce for styles is a later refinement.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${SUPABASE}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    `form-action 'self' ${SUPABASE}`,
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export async function updateSession(request: NextRequest) {
  // btoa/crypto are available in the Edge runtime (Buffer is not).
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  // Passing the nonce + CSP on the REQUEST headers is what makes Next apply the
  // nonce to its rendered <script> tags.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Public pages (landing, login, signup) only need the CSP nonce, not an auth
  // check — skip the Supabase getUser() round-trip on them. Session refresh
  // still happens whenever the user is on a protected path.
  const isProtected = PROTECTED_PREFIXES.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );

  if (isProtected) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            supabaseResponse = NextResponse.next({
              request: { headers: requestHeaders },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // Use getUser() (revalidated), never getSession(), for an authz decision.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', request.nextUrl.pathname);
      const redirectRes = NextResponse.redirect(url);
      redirectRes.headers.set('content-security-policy', csp);
      return redirectRes;
    }
  }

  // Enforce the CSP on the response the browser actually receives.
  supabaseResponse.headers.set('content-security-policy', csp);
  return supabaseResponse;
}
