import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter        = Inter({ subsets: ['latin'], variable: '--font-inter',   display: 'swap', weight: ['400', '500', '600', '700', '800'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', display: 'swap', weight: ['500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Sabor Web — Restaurant Websites for Puerto Rico',
  description: 'We build stunning, fast, bilingual websites for Puerto Rico restaurants. See your free preview before you buy — no deposit, no risk.',
  metadataBase: new URL('https://saborweb.com'),
  alternates: { canonical: 'https://saborweb.com' },
  keywords: 'restaurant website Puerto Rico, página web restaurante Puerto Rico, web design PR, diseño web restaurante PR, Google My Business restaurante',
  openGraph: {
    title: 'Sabor Web — Restaurant Websites for Puerto Rico',
    description: 'Bilingual restaurant websites built for PR. See your site before you pay.',
    type: 'website',
    locale: 'es_PR',
    siteName: 'Sabor Web',
    url: 'https://saborweb.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sabor Web — Restaurant Websites for Puerto Rico',
    description: 'Bilingual restaurant websites for PR. See your site before you pay.',
  },
  robots: { index: true, follow: true },
  other: {
    'geo.region': 'US-PR',
    'geo.placename': 'Puerto Rico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
