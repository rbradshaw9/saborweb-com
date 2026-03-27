import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Rebar Gastronomía & Cocteles | Aguadilla, PR',
  description: 'Chef-driven cuisine and handcrafted cocktails in Aguadilla, Puerto Rico. Open Mon & Wed–Sun from 4PM.',
  robots: { index: false, follow: false },
};

export default function RebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${cormorant.variable} ${dmSans.variable}`} style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      {children}
    </div>
  );
}
