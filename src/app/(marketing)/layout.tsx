import { LanguageProvider } from '@/lib/LanguageContext';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <Nav />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
    </LanguageProvider>
  );
}
