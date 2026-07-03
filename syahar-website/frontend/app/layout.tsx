import type { ReactNode } from 'react';
import { Lexend, Source_Sans_3 } from 'next/font/google';
import './globals.css';

// Self-hosted (served from our own origin) so a strict CSP needs no external
// font exception. Exposed as CSS variables consumed by globals.css.
const heading = Lexend({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-heading-next',
  display: 'swap',
});
const body = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-body-next',
  display: 'swap',
});

export const metadata = {
  title: 'Syahar — verified care for the parents left behind',
  description:
    'Vetted, insured caregivers for your ageing parents in Nepal, with verified proof of every visit. Managed and paid from abroad.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
