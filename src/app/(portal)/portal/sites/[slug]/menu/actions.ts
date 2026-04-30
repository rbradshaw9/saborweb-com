'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { GOODSTART_DEFAULT_CONTENT } from '@/generated-sites/goodstart/default-content';
import {
  normalizeGoodstartContent,
  type GoodstartMenuCategory,
  type GoodstartMenuItem,
} from '@/generated-sites/goodstart/content';
import { assertOwnsRestaurant, requirePortalUser } from '@/lib/portal/auth';
import { recordPortalChangeRequest } from '@/lib/portal/change-requests';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function formOrder(formData: FormData, key: string, fallback: number) {
  const value = Number.parseInt(formString(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function manifestContent(manifest: unknown) {
  const record = asRecord(manifest);
  return record.goodstartContent ?? record.content ?? record;
}

function badgesFromText(value: string, fallback: string[]) {
  if (!value.trim()) return [];
  const badges = value
    .split(',')
    .map((badge) => badge.trim())
    .filter(Boolean);
  return badges.length ? badges : fallback;
}

function cleanMenuItem(formData: FormData, categoryIndex: number, itemIndex: number, fallback: GoodstartMenuItem): GoodstartMenuItem | null {
  const prefix = `item-${categoryIndex}-${itemIndex}`;
  if (formData.get(`${prefix}-delete`) === 'on') return null;

  const name = formString(formData, `${prefix}-name`) || fallback.name;
  const description = formString(formData, `${prefix}-description`);
  const priceText = formString(formData, `${prefix}-priceText`);
  const badgeText = formString(formData, `${prefix}-badges`);

  return {
    ...fallback,
    name,
    description,
    priceText: priceText || null,
    badges: badgesFromText(badgeText, fallback.badges),
    visible: formData.get(`${prefix}-visible`) === 'on',
  };
}

function newMenuItem(formData: FormData, categoryIndex: number): GoodstartMenuItem | null {
  const prefix = `new-item-${categoryIndex}`;
  const name = formString(formData, `${prefix}-name`);
  if (!name) return null;

  return {
    name,
    description: formString(formData, `${prefix}-description`),
    priceText: formString(formData, `${prefix}-priceText`) || null,
    badges: badgesFromText(formString(formData, `${prefix}-badges`), []),
    sourceBacked: false,
    inferred: false,
    visible: true,
  };
}

function sortedExistingItems(formData: FormData, categoryIndex: number, fallback: GoodstartMenuCategory) {
  return fallback.items
    .map((item, itemIndex) => ({
      item: cleanMenuItem(formData, categoryIndex, itemIndex, item),
      order: formOrder(formData, `item-${categoryIndex}-${itemIndex}-order`, itemIndex + 1),
      originalIndex: itemIndex,
    }))
    .filter((entry): entry is { item: GoodstartMenuItem; order: number; originalIndex: number } => Boolean(entry.item))
    .sort((a, b) => a.order - b.order || a.originalIndex - b.originalIndex)
    .map((entry) => entry.item);
}

function cleanMenuCategory(formData: FormData, categoryIndex: number, fallback: GoodstartMenuCategory): GoodstartMenuCategory | null {
  if (formData.get(`category-${categoryIndex}-delete`) === 'on') return null;

  const items = sortedExistingItems(formData, categoryIndex, fallback);
  const itemToAdd = newMenuItem(formData, categoryIndex);
  if (itemToAdd) items.push(itemToAdd);

  return {
    ...fallback,
    name: formString(formData, `category-${categoryIndex}-name`) || fallback.name,
    description: formString(formData, `category-${categoryIndex}-description`),
    items,
  };
}

function newMenuCategory(formData: FormData, fallbackOrder: number) {
  const name = formString(formData, 'new-category-name');
  if (!name) return null;

  const firstItemName = formString(formData, 'new-category-item-name');
  const items = firstItemName
    ? [
        {
          name: firstItemName,
          description: formString(formData, 'new-category-item-description'),
          priceText: formString(formData, 'new-category-item-priceText') || null,
          badges: badgesFromText(formString(formData, 'new-category-item-badges'), []),
          sourceBacked: false,
          inferred: false,
          visible: true,
        },
      ]
    : [];

  return {
    category: {
      name,
      description: formString(formData, 'new-category-description'),
      items,
    },
    order: formOrder(formData, 'new-category-order', fallbackOrder),
    originalIndex: fallbackOrder,
  };
}

export async function updateGoodstartMenu(formData: FormData) {
  const slug = formData.get('slug');
  if (slug !== 'goodstart') redirect('/portal/sites?error=unsupported-editor');

  const user = await requirePortalUser('/portal/sites/goodstart/menu');
  const access = await assertOwnsRestaurant(user.id, slug, { access: 'edit' });

  const supabase = getSupabaseAdmin();
  const { data: site, error: siteError } = await supabase
    .from('restaurant_sites')
    .select('id, generated_site_manifest')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();

  if (siteError || !site) redirect('/portal/sites/goodstart/menu?error=load-failed');

  const currentManifest = asRecord(site.generated_site_manifest);
  const currentContent = normalizeGoodstartContent(manifestContent(currentManifest), GOODSTART_DEFAULT_CONTENT);
  const categoryEntries = currentContent.menuCategories
    .map((category, categoryIndex) => ({
      category: cleanMenuCategory(formData, categoryIndex, category),
      order: formOrder(formData, `category-${categoryIndex}-order`, categoryIndex + 1),
      originalIndex: categoryIndex,
    }))
    .filter((entry): entry is { category: GoodstartMenuCategory; order: number; originalIndex: number } => Boolean(entry.category));

  const categoryToAdd = newMenuCategory(formData, currentContent.menuCategories.length + 1);
  if (categoryToAdd) categoryEntries.push(categoryToAdd);

  const nextMenuCategories = categoryEntries
    .sort((a, b) => a.order - b.order || a.originalIndex - b.originalIndex)
    .map((entry) => entry.category);

  const nextContent = {
    ...currentContent,
    menuCategories: nextMenuCategories,
    updatedAt: new Date().toISOString(),
    source: 'portal-menu-editor',
  };

  const nextManifest = {
    ...currentManifest,
    goodstartContent: nextContent,
  };

  const { error: updateError } = await supabase
    .from('restaurant_sites')
    .update({ generated_site_manifest: nextManifest })
    .eq('id', site.id);

  if (updateError) redirect('/portal/sites/goodstart/menu?error=save-failed');

  await recordPortalChangeRequest({
    access,
    requestType: 'menu_hours',
    title: 'Menu updated',
    description: 'Owner-edited menu content was published from the customer portal.',
    payload: {
      editor: 'menu',
      categoryCount: nextMenuCategories.length,
      itemCount: nextMenuCategories.reduce((count, category) => count + category.items.length, 0),
    },
  });

  revalidatePath('/portal/sites/goodstart');
  revalidatePath('/portal/sites/goodstart/menu');
  revalidatePath('/site/goodstart');
  revalidatePath('/preview/goodstart');
  redirect('/portal/sites/goodstart/menu?saved=1');
}
