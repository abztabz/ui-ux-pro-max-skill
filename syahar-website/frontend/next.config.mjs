// Security headers applied to every response. The CSP is intentionally strict:
// self-hosted fonts (next/font) mean no external font source is needed, and
// Supabase is the only allowed connect target (auth, data, storage, functions).
//
// NOTE: script-src still allows 'unsafe-inline'/'unsafe-eval' because Next's
// runtime needs them without a nonce setup. Tightening to nonce-based CSP is a
// production hardening follow-on (see docs/SECURITY-REVIEW.md).
const SUPABASE = 'https://*.supabase.co';

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  `form-action 'self' ${SUPABASE}`,
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
