import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { chooseInitialLanguage } from '@/lib/language';

const ROOT_HOSTS = new Set(['saborweb.com', 'www.saborweb.com']);
const NATIVE_PREVIEW_SUBDOMAINS: Record<string, string> = {
  'cinco-de-maya': '/preview/cinco-de-maya',
};
const EXTERNAL_PREVIEW_URLS: Record<string, string> = {
  rebar: 'https://rebar.saborweb.com',
};

function chooseLang(request: NextRequest) {
  return chooseInitialLanguage({
    acceptLanguage: request.headers.get('accept-language'),
    country: request.headers.get('x-vercel-ip-country'),
  });
}

function hostWithoutPort(request: NextRequest) {
  return (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '')
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '');
}

function previewSubdomain(host: string) {
  if (!host.endsWith('.saborweb.com') || ROOT_HOSTS.has(host)) return null;
  const subdomain = host.slice(0, -'.saborweb.com'.length);
  return subdomain && subdomain !== 'www' ? subdomain : null;
}

function withLanguageCookie(request: NextRequest, response: NextResponse) {
  const saved = request.cookies.get('sw-lang')?.value;

  if (saved !== 'en' && saved !== 'es') {
    response.cookies.set('sw-lang', chooseLang(request), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  return response;
}

export function proxy(request: NextRequest) {
  const host = hostWithoutPort(request);
  const subdomain = previewSubdomain(host);

  if (subdomain) {
    const nativePath = NATIVE_PREVIEW_SUBDOMAINS[subdomain];
    if (nativePath) {
      const url = request.nextUrl.clone();
      url.pathname = nativePath;
      url.search = request.nextUrl.search;
      return withLanguageCookie(request, NextResponse.rewrite(url));
    }

    const externalUrl = EXTERNAL_PREVIEW_URLS[subdomain];
    if (externalUrl) {
      const target = new URL(externalUrl);
      if (target.host !== host) {
        return NextResponse.redirect(target);
      }
    }
  }

  return withLanguageCookie(request, NextResponse.next());
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
