import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin/allowlist';
import { slugifyProjectValue } from '@/lib/admin/slugs';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function authorized() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) return false;
    return isAdminEmail(user?.email);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await authorized())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const rawSlug = request.nextUrl.searchParams.get('slug') ?? '';
  const normalizedSlug = slugifyProjectValue(rawSlug);

  if (!normalizedSlug) {
    return NextResponse.json({
      ok: true,
      slug: '',
      available: false,
      reason: 'Enter a slug with letters or numbers.',
    });
  }

  const supabase = getSupabaseAdmin();
  const [siteResult, requestResult] = await Promise.all([
    supabase.from('restaurant_sites').select('id').eq('slug', normalizedSlug).limit(1).maybeSingle(),
    supabase.from('preview_requests').select('id').eq('client_slug', normalizedSlug).limit(1).maybeSingle(),
  ]);

  if (siteResult.error) {
    console.error('[Admin Slug Availability] Site lookup failed:', siteResult.error);
    return NextResponse.json({ ok: false, error: 'Could not check slug availability.' }, { status: 500 });
  }

  if (requestResult.error) {
    console.error('[Admin Slug Availability] Request lookup failed:', requestResult.error);
    return NextResponse.json({ ok: false, error: 'Could not check slug availability.' }, { status: 500 });
  }

  const takenBy = siteResult.data ? 'site' : requestResult.data ? 'request' : null;

  return NextResponse.json({
    ok: true,
    slug: normalizedSlug,
    available: !takenBy,
    takenBy,
    reason: takenBy ? `This slug is already used by an existing ${takenBy}.` : null,
  });
}
