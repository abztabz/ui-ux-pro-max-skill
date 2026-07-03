import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Syahar — verified care for the parents left behind',
  description:
    'Vetted, insured caregivers for your ageing parents in Nepal, with verified proof of every visit. Managed and paid from abroad.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
