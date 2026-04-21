import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter        = Inter({ subsets: ['latin'], variable: '--font-inter',   display: 'swap', weight: ['400', '500', '600', '700', '800'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', display: 'swap', weight: ['500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Sabor Web - Restaurant Websites for Puerto Rico',
  description: 'Premium restaurant websites for Puerto Rico. Request a free live preview before you pay.',
  metadataBase: new URL('https://saborweb.com'),
  alternates: { canonical: 'https://saborweb.com' },
  keywords: 'restaurant website Puerto Rico, pagina web restaurante Puerto Rico, web design PR, diseno web restaurante PR, Google Business restaurant',
  openGraph: {
    title: 'Sabor Web - Restaurant Websites for Puerto Rico',
    description: 'See your restaurant website preview before you pay.',
    type: 'website',
    locale: 'es_PR',
    siteName: 'Sabor Web',
    url: 'https://saborweb.com',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sabor Web - Restaurant Websites for Puerto Rico',
    description: 'Premium restaurant websites for PR. Preview first, pay after.',
    images: ['/opengraph-image'],
  },
  robots: { index: true, follow: true },
  other: {
    'geo.region': 'US-PR',
    'geo.placename': 'Puerto Rico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" translate="no" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
