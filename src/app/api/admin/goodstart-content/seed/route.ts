import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { GOODSTART_DEFAULT_CONTENT } from '@/generated-sites/goodstart/default-content';

type SeedBody = {
  force?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function hasGoodstartContent(value: unknown) {
  const record = asRecord(value);
  const content = asRecord(record.goodstartContent ?? record.content);
  return Boolean(content.restaurant) || Boolean(content.menuCategories) || Boolean(content.hours);
}

async function requestBody(request: Request): Promise<SeedBody> {
  try {
    const parsed = await request.json();
    return asRecord(parsed) as SeedBody;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await requestBody(request);
  const supabase = getSupabaseAdmin();
  const { data: site, error: siteError } = await supabase
    .from('restaurant_sites')
    .select('id, generated_site_manifest')
    .eq('slug', 'goodstart')
    .limit(1)
    .maybeSingle();

  if (siteError) {
    return NextResponse.json({ error: 'Could not load Goodstart site.' }, { status: 500 });
  }

  if (!site) {
    return NextResponse.json({ error: 'Goodstart site not found.' }, { status: 404 });
  }

  const currentManifest = asRecord(site.generated_site_manifest);
  if (!body.force && hasGoodstartContent(currentManifest)) {
    return NextResponse.json({ seeded: false, reason: 'content_exists' });
  }

  const nextManifest = {
    ...currentManifest,
    goodstartContent: {
      ...GOODSTART_DEFAULT_CONTENT,
      updatedAt: new Date().toISOString(),
      source: 'admin-seed',
    },
  };

  const { error: updateError } = await supabase
    .from('restaurant_sites')
    .update({ generated_site_manifest: nextManifest })
    .eq('id', site.id);

  if (updateError) {
    return NextResponse.json({ error: 'Could not seed Goodstart content.' }, { status: 500 });
  }

  return NextResponse.json({ seeded: true });
}
