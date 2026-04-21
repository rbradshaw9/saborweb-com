import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { chooseInitialLanguage } from '@/lib/language';

function chooseLang(request: NextRequest) {
  return chooseInitialLanguage({
    acceptLanguage: request.headers.get('accept-language'),
    country: request.headers.get('x-vercel-ip-country'),
  });
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
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

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
