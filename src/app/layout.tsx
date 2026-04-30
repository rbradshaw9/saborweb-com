import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import { AnalyticsPageView } from '@/components/AnalyticsPageView';
import './globals.css';

const inter        = Inter({ subsets: ['latin'], variable: '--font-inter',   display: 'swap', weight: ['400', '500', '600', '700', '800'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', display: 'swap', weight: ['500', '600', '700'] });

export const metadata: Metadata = {
  title: {
    default: 'Sabor Web - Restaurant Websites for Puerto Rico',
    template: '%s | Sabor Web',
  },
  description: 'Premium restaurant websites for Puerto Rico. Request a free live preview before you pay.',
  metadataBase: new URL('https://saborweb.com'),
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
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const analyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true' && Boolean(gtmId);

  return (
    <html lang="es" translate="no" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        {analyticsEnabled && (
          <Script id="google-tag-manager" strategy="beforeInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        )}
        {analyticsEnabled && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        {children}
        {analyticsEnabled && <AnalyticsPageView />}
      </body>
    </html>
  );
}
