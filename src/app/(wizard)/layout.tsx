import { LanguageProvider } from '@/lib/LanguageContext';
import { chooseInitialLanguage } from '@/lib/language';
import { cookies, headers } from 'next/headers';

export default async function WizardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const initialLang = chooseInitialLanguage({
    saved: cookieStore.get('sw-lang')?.value,
    acceptLanguage: headerStore.get('accept-language'),
    country: headerStore.get('x-vercel-ip-country'),
  });

  return (
    <LanguageProvider initialLang={initialLang}>
      {children}
    </LanguageProvider>
  );
}
