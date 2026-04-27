import { NextRequest, NextResponse } from 'next/server';
import { getRequestOrigin, hashIntakeToken } from '@/lib/intake/server';
import { logSiteEvent } from '@/lib/site-events';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const origin = getRequestOrigin(req);
  const intakeUrl = new URL('/intake', origin);
  intakeUrl.searchParams.set('token', token);

  if (!token) {
    return NextResponse.redirect(new URL('/brief-builder?error=missing-token', origin));
  }

  const supabase = getSupabaseAdmin();
  const verifiedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('preview_requests')
    .update({
      email_verified_at: verifiedAt,
    })
    .eq('intake_token_hash', hashIntakeToken(token))
    .select('id, client_slug, restaurant_name')
    .maybeSingle();

  if (error || !data) {
    console.error('[Preview Request Verify] Verification failed:', error);
    return NextResponse.redirect(new URL('/brief-builder?error=invalid-token', origin));
  }

  await supabase
    .from('preview_requests')
    .update({ status: 'intake_started' })
    .eq('id', data.id)
    .in('status', ['new']);

  const { data: site } = await supabase
    .from('restaurant_sites')
    .select('id, metadata')
    .eq('request_id', data.id)
    .maybeSingle();

  if (site?.id) {
    const metadata =
      typeof site.metadata === 'object' && site.metadata !== null && !Array.isArray(site.metadata)
        ? site.metadata
        : {};
    await supabase.from('restaurant_sites').update({
      metadata: {
        ...metadata,
        email_verification: {
          status: 'verified',
          verified_at: verifiedAt,
        },
      },
    }).eq('id', site.id);
  }

  await logSiteEvent({
    eventType: 'owner_email_verified',
    requestId: data.id,
    actorType: 'visitor',
    message: `Owner email verified for ${data.restaurant_name}`,
    metadata: {
      client_slug: data.client_slug,
      verified_at: verifiedAt,
    },
  });

  return NextResponse.redirect(intakeUrl);
}
