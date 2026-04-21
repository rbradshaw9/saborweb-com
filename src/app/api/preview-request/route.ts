import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isLang, normalizeUrl, slugify } from '@/lib/intake/shared';
import type { PreviewRequestRecord } from '@/lib/intake/shared';
import {
  asNullableString,
  createIntakeToken,
  getRequestOrigin,
  hashIntakeToken,
  isRecord,
  readString,
  sendPreviewRequestEmail,
} from '@/lib/intake/server';

function makePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const ownerName = readString(body.ownerName);
    const restaurantName = readString(body.restaurantName);
    const phone = readString(body.phone);
    const city = readString(body.city);
    const preferredLanguage = isLang(body.preferredLanguage) ? body.preferredLanguage : 'es';

    if (!ownerName || !restaurantName || !phone || !city) {
      return NextResponse.json(
        { error: 'Owner name, restaurant name, phone, and city are required.' },
        { status: 400 }
      );
    }

    const token = createIntakeToken();
    const intakeTokenHash = hashIntakeToken(token);
    const clientSlug = `${slugify(restaurantName)}-${token.slice(0, 6).toLowerCase()}`;
    const origin = getRequestOrigin(req);

    const supabase = getSupabaseAdmin();
    const insert = {
      owner_name: ownerName,
      email: asNullableString(body.email),
      phone,
      restaurant_name: restaurantName,
      city,
      preferred_language: preferredLanguage,
      source: asNullableString(body.source) ?? 'website',
      notes: asNullableString(body.notes),
      instagram_url: normalizeUrl(asNullableString(body.instagramUrl)),
      google_url: normalizeUrl(asNullableString(body.googleUrl)),
      website_url: normalizeUrl(asNullableString(body.websiteUrl)),
      client_slug: clientSlug,
      intake_token_hash: intakeTokenHash,
      intake_resume_token: token,
    };

    const { data, error } = await supabase
      .from('preview_requests')
      .insert(insert)
      .select(
        'id, owner_name, email, phone, restaurant_name, city, preferred_language, source, status, notes, instagram_url, google_url, website_url, client_slug'
      )
      .single();

    if (error || !data) {
      console.error('[Preview Request] Supabase insert failed:', error);
      return NextResponse.json({ error: 'Could not save preview request.' }, { status: 500 });
    }

    const requestRecord = data as PreviewRequestRecord;
    const intakeUrl = `${origin}/intake?token=${encodeURIComponent(token)}`;
    const previewUrl = makePath(`/preview/${clientSlug}`);
    const claimUrl = makePath(`/claim/${clientSlug}`);

    const { error: siteError } = await supabase
      .from('restaurant_sites')
      .upsert(
        {
          request_id: requestRecord.id,
          slug: clientSlug,
          restaurant_name: requestRecord.restaurant_name,
          city: requestRecord.city,
          preview_type: 'native',
          preview_url: previewUrl,
          external_preview_url: null,
          claim_url: claimUrl,
          status: 'draft',
          owner_name: requestRecord.owner_name,
          owner_email: requestRecord.email,
          owner_phone: requestRecord.phone,
          owner_status: 'unclaimed',
          payment_status: 'unpaid',
          metadata: {
            source: requestRecord.source,
            preferred_language: requestRecord.preferred_language,
          },
        },
        { onConflict: 'request_id' }
      );

    if (siteError) {
      console.error('[Preview Request] Site upsert failed:', siteError);
      return NextResponse.json({ error: 'Could not create preview site record.' }, { status: 500 });
    }

    try {
      await sendPreviewRequestEmail(requestRecord, intakeUrl);
    } catch (emailError) {
      console.error('[Preview Request] Notification failed:', emailError);
    }

    return NextResponse.json({
      success: true,
      requestId: requestRecord.id,
      clientSlug: requestRecord.client_slug,
      previewUrl,
      claimUrl,
      intakeUrl,
    });
  } catch (error) {
    console.error('[Preview Request] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
