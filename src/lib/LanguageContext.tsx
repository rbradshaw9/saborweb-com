'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

type Lang = 'en' | 'es';
type Translations = typeof en;

interface LanguageContextValue {
  lang: Lang;
  t: Translations;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  t: en,
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to 'en'. Restore any previously saved manual preference on mount.
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('sw-lang') as Lang | null;
    if (saved === 'en' || saved === 'es') setLang(saved);
  }, []);

  const toggle = useCallback(() => {
    setLang(prev => {
      const next: Lang = prev === 'es' ? 'en' : 'es';
      localStorage.setItem('sw-lang', next);
      return next;
    });
  }, []);

  const t = lang === 'es' ? es : en;

  return (
    <LanguageContext.Provider value={{ lang, t, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
