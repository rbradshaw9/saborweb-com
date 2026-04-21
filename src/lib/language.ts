export type SiteLang = 'en' | 'es';

export function isSiteLang(value: unknown): value is SiteLang {
  return value === 'en' || value === 'es';
}

export function languageFromAcceptHeader(header: string | null | undefined): SiteLang | null {
  if (!header) return null;

  const preferred = header
    .split(',')
    .map((part, index) => {
      const [code = '', qValue] = part.trim().split(';q=');
      const q = qValue ? Number.parseFloat(qValue) : 1;
      return { code: code.toLowerCase(), q: Number.isFinite(q) ? q : 0, index };
    })
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .find(({ code }) => code.startsWith('es') || code.startsWith('en'));

  if (!preferred) return null;
  return preferred.code.startsWith('es') ? 'es' : 'en';
}

export function chooseInitialLanguage(input: {
  saved?: string | null;
  acceptLanguage?: string | null;
  country?: string | null;
}): SiteLang {
  if (isSiteLang(input.saved)) return input.saved;

  const browserLang = languageFromAcceptHeader(input.acceptLanguage);
  if (browserLang) return browserLang;

  return input.country?.toUpperCase() === 'PR' ? 'es' : 'en';
}
