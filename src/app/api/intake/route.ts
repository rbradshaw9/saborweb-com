import { NextRequest, NextResponse } from 'next/server';
import { buildRestaurantBrief, normalizeUrl, toStringArray } from '@/lib/intake/shared';
import type { IntakeRecord, PreviewRequestRecord } from '@/lib/intake/shared';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  asNullableString,
  hashIntakeToken,
  isRecord,
  readString,
  sendIntakeCompleteEmail,
} from '@/lib/intake/server';

async function getRequestByToken(token: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('preview_requests')
    .select(
      'id, owner_name, email, phone, restaurant_name, city, preferred_language, source, status, notes, instagram_url, google_url, website_url, client_slug'
    )
    .eq('intake_token_hash', hashIntakeToken(token))
    .single();

  if (error || !data) return { supabase, requestRecord: null };
  return { supabase, requestRecord: data as PreviewRequestRecord };
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  if (!token) {
    return NextResponse.json({ error: 'Missing intake token.' }, { status: 400 });
  }

  try {
    const { supabase, requestRecord } = await getRequestByToken(token);
    if (!requestRecord) {
      return NextResponse.json({ error: 'Invalid or expired intake link.' }, { status: 404 });
    }

    const { data: intake } = await supabase
      .from('restaurant_intake')
      .select('*')
      .eq('request_id', requestRecord.id)
      .maybeSingle();

    await supabase
      .from('preview_requests')
      .update({
        status: requestRecord.status === 'new' ? 'intake_started' : requestRecord.status,
        intake_started_at: new Date().toISOString(),
      })
      .eq('id', requestRecord.id);

    return NextResponse.json({ request: requestRecord, intake: intake ?? null });
  } catch (error) {
    console.error('[Intake GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const token = readString(body.token);
    if (!token) {
      return NextResponse.json({ error: 'Missing intake token.' }, { status: 400 });
    }

    const { supabase, requestRecord } = await getRequestByToken(token);
    if (!requestRecord) {
      return NextResponse.json({ error: 'Invalid or expired intake link.' }, { status: 404 });
    }

    const intakeRecord: IntakeRecord & { request_id: string } = {
      request_id: requestRecord.id,
      address: asNullableString(body.address),
      neighborhood: asNullableString(body.neighborhood),
      cuisine: asNullableString(body.cuisine),
      current_website: normalizeUrl(asNullableString(body.currentWebsite)),
      google_business_url: normalizeUrl(asNullableString(body.googleBusinessUrl)),
      instagram_url: normalizeUrl(asNullableString(body.instagramUrl)),
      facebook_url: normalizeUrl(asNullableString(body.facebookUrl)),
      menu_url: normalizeUrl(asNullableString(body.menuUrl)),
      ordering_url: normalizeUrl(asNullableString(body.orderingUrl)),
      reservations_url: normalizeUrl(asNullableString(body.reservationsUrl)),
      domain_status: asNullableString(body.domainStatus),
      launch_urgency: asNullableString(body.launchUrgency),
      brand_style: asNullableString(body.brandStyle),
      brand_notes: asNullableString(body.brandNotes),
      ideal_guest: asNullableString(body.idealGuest),
      differentiators: asNullableString(body.differentiators),
      owner_goals: asNullableString(body.ownerGoals),
      hours: { raw: asNullableString(body.hours) },
      menu_notes: {
        source: asNullableString(body.menuSource),
        notes: asNullableString(body.menuNotes),
        highlights: asNullableString(body.menuHighlights),
        categories: asNullableString(body.menuCategories),
        priceAccuracy: asNullableString(body.priceAccuracy),
        creativeDirection: {
          colorNotes: asNullableString(body.colorNotes),
          fontMood: asNullableString(body.fontMood),
          photoDirection: asNullableString(body.photoDirection),
          brandVoice: asNullableString(body.brandVoice),
          visualReferences: asNullableString(body.visualReferences),
          avoidStyles: asNullableString(body.avoidStyles),
        },
        pagePlan: {
          primaryAction: asNullableString(body.primaryAction),
          secondaryAction: asNullableString(body.secondaryAction),
          mustHavePages: asNullableString(body.mustHavePages),
          launchNotes: asNullableString(body.launchNotes),
        },
        researchInputs: {
          logoStatus: asNullableString(body.logoStatus),
          photoStatus: asNullableString(body.photoStatus),
          researchPermission: asNullableString(body.researchPermission),
          otherSocialLinks: asNullableString(body.otherSocialLinks),
        },
      },
      feature_requests: toStringArray(body.featureRequests),
      asset_links: toStringArray(body.assetLinks),
    };

    const { data: files } = await supabase
      .from('intake_files')
      .select('file_name')
      .eq('request_id', requestRecord.id);

    const fileNames = Array.isArray(files)
      ? files.map((file) => String(file.file_name)).filter(Boolean)
      : [];
    const generatedBrief = buildRestaurantBrief(requestRecord, intakeRecord, fileNames);
    const briefJson = {
      clientSlug: requestRecord.client_slug,
      generatedAt: new Date().toISOString(),
      requestedFeatures: intakeRecord.feature_requests,
      assetLinks: intakeRecord.asset_links,
      uploadedFiles: fileNames,
      buildHandoff: {
        restaurant: requestRecord.restaurant_name,
        city: requestRecord.city,
        cuisine: intakeRecord.cuisine,
        primaryAction: asNullableString(body.primaryAction),
        secondaryAction: asNullableString(body.secondaryAction),
        visualStyle: intakeRecord.brand_style,
        colorNotes: asNullableString(body.colorNotes),
        fontMood: asNullableString(body.fontMood),
        photoDirection: asNullableString(body.photoDirection),
        brandVoice: asNullableString(body.brandVoice),
        visualReferences: asNullableString(body.visualReferences),
        avoidStyles: asNullableString(body.avoidStyles),
        menuHighlights: asNullableString(body.menuHighlights),
        menuCategories: asNullableString(body.menuCategories),
        mustHavePages: asNullableString(body.mustHavePages),
        researchInputs: {
          currentWebsite: intakeRecord.current_website,
          instagram: intakeRecord.instagram_url ?? requestRecord.instagram_url,
          facebook: intakeRecord.facebook_url,
          googleBusiness: intakeRecord.google_business_url ?? requestRecord.google_url,
          otherSocialLinks: asNullableString(body.otherSocialLinks),
          logoStatus: asNullableString(body.logoStatus),
          photoStatus: asNullableString(body.photoStatus),
          researchPermission: asNullableString(body.researchPermission),
        },
      },
    };

    const { data: intake, error } = await supabase
      .from('restaurant_intake')
      .upsert(
        {
          ...intakeRecord,
          generated_brief: generatedBrief,
          brief_json: briefJson,
        },
        { onConflict: 'request_id' }
      )
      .select('*')
      .single();

    if (error || !intake) {
      console.error('[Intake POST] Supabase upsert failed:', error);
      return NextResponse.json({ error: 'Could not save intake.' }, { status: 500 });
    }

    await supabase
      .from('preview_requests')
      .update({
        status: 'brief_ready',
        intake_submitted_at: new Date().toISOString(),
        generated_brief: generatedBrief,
        brief_json: briefJson,
      })
      .eq('id', requestRecord.id);

    try {
      await sendIntakeCompleteEmail(requestRecord, generatedBrief);
    } catch (emailError) {
      console.error('[Intake POST] Notification failed:', emailError);
    }

    return NextResponse.json({
      success: true,
      request: requestRecord,
      intake,
      generatedBrief,
    });
  } catch (error) {
    console.error('[Intake POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
