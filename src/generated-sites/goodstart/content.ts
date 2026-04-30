export type GoodstartMenuItem = {
  name: string;
  description: string;
  priceText: string | null;
  badges: string[];
  sourceBacked: boolean;
  inferred: boolean;
  visible?: boolean;
};

export type GoodstartMenuCategory = {
  name: string;
  description: string;
  items: GoodstartMenuItem[];
};

export type GoodstartHoursRow = {
  day: string;
  shortDay: string;
  opens: string;
  closes: string;
  display: string;
  isClosed?: boolean;
};

export type GoodstartRestaurant = {
  name: string;
  alternateName: string;
  cuisine: string;
  address: string;
  streetAddress: string;
  locality: string;
  postalCode: string;
  region: string;
  country: string;
  phone: string;
  phoneHref: string;
  mapsUrl: string;
  facebookUrl: string;
  instagramUrl: string;
};

export type GoodstartContent = {
  restaurant: GoodstartRestaurant;
  hours: GoodstartHoursRow[];
  menuCategories: GoodstartMenuCategory[];
  featuredItemNames: string[];
  ownerConfirmationNotes: string[];
  updatedAt?: string;
  source?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function cleanString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function cleanNullableString(value: unknown, fallback: string | null) {
  if (typeof value === 'string') return value.trim() || null;
  return fallback;
}

function cleanBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function stringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim());
  return cleaned.length ? cleaned : fallback;
}

function normalizeRestaurant(raw: unknown, fallback: GoodstartRestaurant): GoodstartRestaurant {
  const record = asRecord(raw);
  return {
    name: cleanString(record.name, fallback.name),
    alternateName: cleanString(record.alternateName, fallback.alternateName),
    cuisine: cleanString(record.cuisine, fallback.cuisine),
    address: cleanString(record.address, fallback.address),
    streetAddress: cleanString(record.streetAddress, fallback.streetAddress),
    locality: cleanString(record.locality, fallback.locality),
    postalCode: cleanString(record.postalCode, fallback.postalCode),
    region: cleanString(record.region, fallback.region),
    country: cleanString(record.country, fallback.country),
    phone: cleanString(record.phone, fallback.phone),
    phoneHref: cleanString(record.phoneHref, fallback.phoneHref),
    mapsUrl: cleanString(record.mapsUrl, fallback.mapsUrl),
    facebookUrl: cleanString(record.facebookUrl, fallback.facebookUrl),
    instagramUrl: cleanString(record.instagramUrl, fallback.instagramUrl),
  };
}

function normalizeHours(raw: unknown, fallback: GoodstartHoursRow[]) {
  if (!Array.isArray(raw)) return fallback;
  const rows = raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item))
    .map((row, index) => {
      const fallbackRow = fallback[index] ?? fallback[0];
      return {
        day: cleanString(row.day, fallbackRow.day),
        shortDay: cleanString(row.shortDay, fallbackRow.shortDay),
        opens: cleanString(row.opens, fallbackRow.opens),
        closes: cleanString(row.closes, fallbackRow.closes),
        display: cleanString(row.display, fallbackRow.display),
        isClosed: typeof row.isClosed === 'boolean' ? row.isClosed : fallbackRow.isClosed,
      };
    });
  return rows.length ? rows : fallback;
}

function normalizeMenuItem(raw: unknown, fallback: GoodstartMenuItem): GoodstartMenuItem {
  const record = asRecord(raw);
  return {
    name: cleanString(record.name, fallback.name),
    description: cleanString(record.description, fallback.description),
    priceText: cleanNullableString(record.priceText, fallback.priceText),
    badges: stringArray(record.badges, fallback.badges),
    sourceBacked: cleanBoolean(record.sourceBacked, fallback.sourceBacked),
    inferred: cleanBoolean(record.inferred, fallback.inferred),
    visible: typeof record.visible === 'boolean' ? record.visible : fallback.visible,
  };
}

function normalizeMenuCategories(raw: unknown, fallback: GoodstartMenuCategory[]) {
  if (!Array.isArray(raw)) return fallback;
  const categories = raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item))
    .map((category, categoryIndex) => {
      const fallbackCategory = fallback[categoryIndex] ?? fallback[0];
      const fallbackItems = fallbackCategory.items;
      const rawItems = Array.isArray(category.items) ? category.items : [];
      return {
        name: cleanString(category.name, fallbackCategory.name),
        description: cleanString(category.description, fallbackCategory.description),
        items: rawItems
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item))
          .map((item, itemIndex) => normalizeMenuItem(item, fallbackItems[itemIndex] ?? fallbackItems[0]))
          .filter((item) => Boolean(item.name)),
      };
    });
  return categories;
}

export function normalizeGoodstartContent(raw: unknown, fallback: GoodstartContent): GoodstartContent {
  const record = asRecord(raw);
  const contentRecord = asRecord(record.goodstartContent ?? record.content ?? raw);

  return {
    restaurant: normalizeRestaurant(contentRecord.restaurant, fallback.restaurant),
    hours: normalizeHours(contentRecord.hours, fallback.hours),
    menuCategories: normalizeMenuCategories(contentRecord.menuCategories, fallback.menuCategories),
    featuredItemNames: stringArray(contentRecord.featuredItemNames, fallback.featuredItemNames),
    ownerConfirmationNotes: stringArray(contentRecord.ownerConfirmationNotes, fallback.ownerConfirmationNotes),
    updatedAt: typeof contentRecord.updatedAt === 'string' ? contentRecord.updatedAt : fallback.updatedAt,
    source: typeof contentRecord.source === 'string' ? contentRecord.source : fallback.source,
  };
}
