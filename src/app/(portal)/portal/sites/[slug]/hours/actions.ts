'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { GOODSTART_DEFAULT_CONTENT } from '@/generated-sites/goodstart/default-content';
import { normalizeGoodstartContent, type GoodstartHoursRow } from '@/generated-sites/goodstart/content';
import { assertOwnsRestaurant, requirePortalUser } from '@/lib/portal/auth';
import { recordPortalChangeRequest } from '@/lib/portal/change-requests';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const DAYS = [
  ['Monday', 'Mon'],
  ['Tuesday', 'Tue'],
  ['Wednesday', 'Wed'],
  ['Thursday', 'Thu'],
  ['Friday', 'Fri'],
  ['Saturday', 'Sat'],
  ['Sunday', 'Sun'],
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function manifestContent(manifest: unknown) {
  const record = asRecord(manifest);
  return record.goodstartContent ?? record.content ?? record;
}

function formatTime(value: string) {
  const [hourValue, minuteValue] = value.split(':').map(Number);
  const date = new Date(Date.UTC(2026, 0, 1, hourValue, minuteValue));
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}

function cleanHoursRow(formData: FormData, index: number, fallback: GoodstartHoursRow): GoodstartHoursRow | null {
  const [defaultDay, defaultShortDay] = DAYS[index] ?? [fallback.day, fallback.shortDay];
  const isClosed = formData.get(`closed-${index}`) === 'on';
  const opens = formString(formData, `opens-${index}`) || fallback.opens;
  const closes = formString(formData, `closes-${index}`) || fallback.closes;

  if (!isClosed && opens >= closes) return null;

  return {
    day: defaultDay,
    shortDay: defaultShortDay,
    opens,
    closes,
    display: isClosed ? 'Closed' : `${formatTime(opens)}-${formatTime(closes)}`,
    isClosed,
  };
}

export async function updateGoodstartHours(formData: FormData) {
  const slug = formData.get('slug');
  if (slug !== 'goodstart') redirect('/portal/sites?error=unsupported-editor');

  const user = await requirePortalUser('/portal/sites/goodstart/hours');
  const access = await assertOwnsRestaurant(user.id, slug, { access: 'edit' });

  const supabase = getSupabaseAdmin();
  const { data: site, error: siteError } = await supabase
    .from('restaurant_sites')
    .select('id, generated_site_manifest')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();

  if (siteError || !site) redirect('/portal/sites/goodstart/hours?error=load-failed');

  const currentManifest = asRecord(site.generated_site_manifest);
  const currentContent = normalizeGoodstartContent(manifestContent(currentManifest), GOODSTART_DEFAULT_CONTENT);
  const nextHours = DAYS.map((_, index) => cleanHoursRow(formData, index, currentContent.hours[index] ?? GOODSTART_DEFAULT_CONTENT.hours[index]));

  if (nextHours.some((row) => !row)) {
    redirect('/portal/sites/goodstart/hours?error=invalid-hours');
  }

  const nextContent = {
    ...currentContent,
    hours: nextHours as GoodstartHoursRow[],
    updatedAt: new Date().toISOString(),
    source: 'portal-hours-editor',
  };

  const nextManifest = {
    ...currentManifest,
    goodstartContent: nextContent,
  };

  const { error: updateError } = await supabase
    .from('restaurant_sites')
    .update({ generated_site_manifest: nextManifest })
    .eq('id', site.id);

  if (updateError) redirect('/portal/sites/goodstart/hours?error=save-failed');

  await recordPortalChangeRequest({
    access,
    requestType: 'menu_hours',
    title: 'Business hours updated',
    description: 'Owner-edited business hours were published from the customer portal.',
    payload: {
      editor: 'hours',
      closedDays: nextContent.hours.filter((row) => row.isClosed).map((row) => row.day),
    },
  });

  revalidatePath('/portal/sites/goodstart');
  revalidatePath('/portal/sites/goodstart/hours');
  revalidatePath('/site/goodstart');
  revalidatePath('/preview/goodstart');
  redirect('/portal/sites/goodstart/hours?saved=1');
}
