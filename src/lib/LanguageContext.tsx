'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import type { SiteLang } from '@/lib/language';

type Lang = SiteLang;
type Translations = typeof en;

interface LanguageContextValue {
  lang: Lang;
  t: Translations;
  toggle: () => void;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'es',
  t: es,
  toggle: () => {},
  setLang: () => {},
});

function readInitialLang(initialLang: Lang): Lang {
  return initialLang;
}

function persistLang(lang: Lang) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem('sw-lang', lang);
  window.localStorage.setItem('sw-lang', lang);
  document.cookie = `sw-lang=${lang}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageProvider({ children, initialLang = 'es' }: { children: React.ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => readInitialLang(initialLang));

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = useCallback(() => {
    setLangState(prev => {
      const next: Lang = prev === 'es' ? 'en' : 'es';
      persistLang(next);
      return next;
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    persistLang(l);
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
