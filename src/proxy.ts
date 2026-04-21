import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isAdminEmail } from '@/lib/admin/allowlist';
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

function isAdminPath(request: NextRequest) {
  return request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/');
}

function isAdminLoginPath(request: NextRequest) {
  return request.nextUrl.pathname === '/admin/login';
}

function createSupabaseProxyClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

async function guardAdminRoute(request: NextRequest, response: NextResponse) {
  if (!isAdminPath(request) || isAdminLoginPath(request)) return response;

  const supabase = createSupabaseProxyClient(request, response);
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (isAdminEmail(user?.email)) return response;

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);

  const redirect = NextResponse.redirect(loginUrl);
  copyCookies(response, redirect);
  return redirect;
}

export async function proxy(request: NextRequest) {
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

  return guardAdminRoute(request, withLanguageCookie(request, NextResponse.next({ request })));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
