import type { Metadata } from 'next';
import { Bebas_Neue, Nunito } from 'next/font/google';

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
  weight: ['400'],
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: '¡Cinco de Maya! | Tacos · Burritos · Margaritas · Aguadilla, PR',
  description:
    'The most vibrant Mexican restaurant in Puerto Rico. Tacos, birria, burritos, quesadillas, fajitas, and the best margaritas on the island. Aguadilla, PR · Wed–Sun 11:30AM–9:30PM.',
  robots: { index: false, follow: false },
};

export default function CincoDeMayaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${bebasNeue.variable} ${nunito.variable}`}
      style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
    >
      {children}
    </div>
  );
}
