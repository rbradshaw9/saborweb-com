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
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  t: en,
  toggle: () => {},
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to 'en'. Restore any previously saved manual preference on mount.
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('sw-lang') as Lang | null;
    if (saved === 'en' || saved === 'es') setLangState(saved);
  }, []);

  const toggle = useCallback(() => {
    setLangState(prev => {
      const next: Lang = prev === 'es' ? 'en' : 'es';
      localStorage.setItem('sw-lang', next);
      return next;
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem('sw-lang', l);
    setLangState(l);
  }, []);

  const t = lang === 'es' ? es : en;

  return (
    <LanguageContext.Provider value={{ lang, t, toggle, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
