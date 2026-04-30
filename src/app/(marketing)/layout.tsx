import { LanguageProvider } from '@/lib/LanguageContext';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { chooseInitialLanguage } from '@/lib/language';
import { cookies, headers } from 'next/headers';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const initialLang = chooseInitialLanguage({
    saved: headerStore.get('x-saborweb-lang') ?? cookieStore.get('sw-lang')?.value,
    acceptLanguage: headerStore.get('accept-language'),
    country: headerStore.get('x-vercel-ip-country'),
  });

  return (
    <LanguageProvider initialLang={initialLang}>
      <Nav />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
    </LanguageProvider>
  );
}
