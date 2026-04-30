import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { chooseInitialLanguage } from '@/lib/language';

const ROOT_HOSTS = new Set(['saborweb.com', 'www.saborweb.com']);
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const APP_HOST = 'app.saborweb.com';
const MARKETING_PATHS = new Set([
  '/',
  '/about',
  '/contact',
  '/how-it-works',
  '/local-seo',
  '/portfolio',
  '/services',
  '/thank-you',
]);

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
  return subdomain && subdomain !== 'www' && subdomain !== 'app' ? subdomain : null;
}

function customRestaurantHost(host: string) {
  if (!host || ROOT_HOSTS.has(host)) return null;
  if (LOCAL_HOSTS.has(host) || host.endsWith('.localhost') || host.endsWith('.vercel.app')) return null;
  if (host.endsWith('.saborweb.com')) return null;
  return host;
}

function isMarketingHost(host: string) {
  return !host || ROOT_HOSTS.has(host) || LOCAL_HOSTS.has(host) || host.endsWith('.vercel.app');
}

function stripSpanishPrefix(pathname: string) {
  if (pathname === '/es') return '/';
  if (pathname.startsWith('/es/')) return pathname.slice(3) || '/';
  return null;
}

function isMarketingPath(pathname: string) {
  return MARKETING_PATHS.has(pathname);
}

function setLanguageCookie(response: NextResponse, lang: 'en' | 'es') {
  response.cookies.set('sw-lang', lang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}

function rewriteWithLanguage(request: NextRequest, url: URL, lang: 'en' | 'es') {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-saborweb-lang', lang);
  return setLanguageCookie(NextResponse.rewrite(url, { request: { headers: requestHeaders } }), lang);
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

function isAdminPath(request: NextRequest) {
  return request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/');
}

function isAdminLoginPath(request: NextRequest) {
  return request.nextUrl.pathname === '/admin/login';
}

async function guardAdminRoute(request: NextRequest, response: NextResponse) {
  if (!isAdminPath(request) || isAdminLoginPath(request)) return response;

  // Let the admin layout and page-level auth handle sign-in checks.
  // This keeps local development responsive and avoids duplicate network-bound auth checks in middleware.
  return response;
}

export async function proxy(request: NextRequest) {
  const host = hostWithoutPort(request);

  if (host === APP_HOST) {
    const url = request.nextUrl.clone();
    url.pathname = request.nextUrl.pathname.startsWith('/portal')
      ? request.nextUrl.pathname
      : `/portal${request.nextUrl.pathname === '/' ? '' : request.nextUrl.pathname}`;
    url.search = request.nextUrl.search;
    return withLanguageCookie(request, NextResponse.rewrite(url));
  }

  if (isMarketingHost(host)) {
    const spanishPath = stripSpanishPrefix(request.nextUrl.pathname);
    if (spanishPath && isMarketingPath(spanishPath)) {
      const url = request.nextUrl.clone();
      url.pathname = spanishPath;
      url.search = request.nextUrl.search;
      return rewriteWithLanguage(request, url, 'es');
    }

    const hasSavedLanguage = request.cookies.get('sw-lang')?.value === 'en' || request.cookies.get('sw-lang')?.value === 'es';
    if (!hasSavedLanguage && isMarketingPath(request.nextUrl.pathname) && chooseLang(request) === 'es') {
      const url = request.nextUrl.clone();
      url.pathname = request.nextUrl.pathname === '/' ? '/es' : `/es${request.nextUrl.pathname}`;
      url.search = request.nextUrl.search;
      return setLanguageCookie(NextResponse.redirect(url), 'es');
    }
  }

  const subdomain = previewSubdomain(host);

  if (subdomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/site/${subdomain}${request.nextUrl.pathname === '/' ? '' : request.nextUrl.pathname}`;
    url.search = request.nextUrl.search;
    return withLanguageCookie(request, NextResponse.rewrite(url));
  }

  const customHost = customRestaurantHost(host);
  if (customHost) {
    const url = request.nextUrl.clone();
    url.pathname = `/site-domain/${customHost}${request.nextUrl.pathname === '/' ? '' : request.nextUrl.pathname}`;
    url.search = request.nextUrl.search;
    return withLanguageCookie(request, NextResponse.rewrite(url));
  }

  return guardAdminRoute(request, withLanguageCookie(request, NextResponse.next({ request })));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
