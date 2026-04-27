"use client";

import type { GeneratedSiteComponentProps } from '@/generated-sites/components';

type MenuItem = {
  name: string;
  description: string;
  priceText: string | null;
  badges: string[];
  sourceBacked: boolean;
  inferred: boolean;
};

type MenuCategory = {
  name: string;
  description: string;
  items: MenuItem[];
};

type HourRow = {
  day: string;
  schemaDay: string;
  opens: string;
  closes: string;
  display: string;
};

const restaurant = {
  name: 'Good Start Costal Cafe',
  alternateName: 'Good Start 466',
  cuisine: 'Cafe',
  city: 'Isabela, Puerto Rico',
  addressLine: 'GW67+XCR, Isabela, 00690, Puerto Rico',
  streetAddress: 'GW67+XCR',
  locality: 'Isabela',
  region: 'PR',
  postalCode: '00690',
  country: 'PR',
  phone: '(787) 830-9500',
  phoneHref: 'tel:+17878309500',
  mapsUrl: 'https://maps.google.com/?cid=2958274291943456299',
  facebookUrl: 'https://www.facebook.com/goodstart466',
  instagramUrl: 'https://www.instagram.com/goodstart466',
  previewUrl: '/preview/goodstart',
  claimUrl: '/claim/goodstart',
};

const hours: HourRow[] = [
  { day: 'Monday', schemaDay: 'Monday', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
  { day: 'Tuesday', schemaDay: 'Tuesday', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
  { day: 'Wednesday', schemaDay: 'Wednesday', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
  { day: 'Thursday', schemaDay: 'Thursday', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
  { day: 'Friday', schemaDay: 'Friday', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
  { day: 'Saturday', schemaDay: 'Saturday', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
  { day: 'Sunday', schemaDay: 'Sunday', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
];

// Owner-facing implementation note: this menu is an editable starter menu generated from the provided café/breakfast concept.
// Source-backed item names, descriptions, prices, options, and allergen details should be confirmed by the restaurant before public launch.
const menuCategories: MenuCategory[] = [
  {
    name: 'Breakfast Plates',
    description: 'Generated breakfast offerings for a coastal Puerto Rico café concept.',
    items: [
      {
        name: 'Good Start Breakfast',
        description: 'Two eggs any style with toast, breakfast potatoes, and your choice of bacon, ham, or sausage.',
        priceText: null,
        badges: ['Breakfast'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Puerto Rican Breakfast Plate',
        description: 'Eggs with sautéed onions and peppers, local cheese, toast, and a side of sweet plantains.',
        priceText: null,
        badges: ['Local Style'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Pancake Stack',
        description: 'Fluffy pancakes served with butter and syrup; add fruit if available.',
        priceText: null,
        badges: ['Sweet Breakfast'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'French Toast',
        description: 'Golden griddled toast dusted with cinnamon sugar and served with syrup.',
        priceText: null,
        badges: ['Sweet Breakfast'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Omelet Your Way',
        description: 'Three-egg omelet with your choice of cheese, vegetables, ham, bacon, or sausage, served with toast.',
        priceText: null,
        badges: ['Breakfast'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Breakfast Burrito',
        description: 'Scrambled eggs, cheese, potatoes, peppers, and your choice of bacon, ham, or sausage wrapped in a warm tortilla.',
        priceText: null,
        badges: ['Breakfast'],
        sourceBacked: false,
        inferred: true,
      },
    ],
  },
  {
    name: 'Eggs, Toasts & Lighter Starts',
    description: 'Generated lighter morning options suitable for a café menu.',
    items: [
      {
        name: 'Avocado Toast',
        description: 'Toasted bread topped with avocado, tomato, olive oil, and a light seasoning.',
        priceText: null,
        badges: ['Vegetarian'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Egg & Cheese Sandwich',
        description: 'Scrambled or fried egg with melted cheese on toast, croissant, or bread of choice if available.',
        priceText: null,
        badges: ['Breakfast'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Bacon, Egg & Cheese Sandwich',
        description: 'Crispy bacon, egg, and cheese served on toasted bread.',
        priceText: null,
        badges: ['Breakfast'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Yogurt Parfait',
        description: 'Yogurt layered with fruit and granola.',
        priceText: null,
        badges: ['Light'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Fruit Bowl',
        description: 'Seasonal fresh fruit served chilled.',
        priceText: null,
        badges: ['Light', 'Vegetarian'],
        sourceBacked: false,
        inferred: true,
      },
    ],
  },
  {
    name: 'Sandwiches & Wraps',
    description: 'Generated lunch-friendly café sandwiches and wraps.',
    items: [
      {
        name: 'Turkey Club Sandwich',
        description: 'Turkey, bacon, lettuce, tomato, cheese, and mayo on toasted bread.',
        priceText: null,
        badges: ['Lunch'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Ham & Cheese Sandwich',
        description: 'Classic ham and cheese served hot or cold with lettuce, tomato, and mayo.',
        priceText: null,
        badges: ['Lunch'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Chicken Wrap',
        description: 'Grilled chicken, lettuce, tomato, cheese, and house sauce wrapped in a flour tortilla.',
        priceText: null,
        badges: ['Lunch'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Veggie Wrap',
        description: 'Avocado, lettuce, tomato, peppers, onions, cheese, and a light dressing in a tortilla.',
        priceText: null,
        badges: ['Vegetarian'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Tuna Melt',
        description: 'Tuna salad with melted cheese on toasted bread.',
        priceText: null,
        badges: ['Lunch'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Tripleta-Style Sandwich',
        description: 'Puerto Rican-style pressed sandwich with mixed meats, cheese, potato sticks, and house sauce.',
        priceText: null,
        badges: ['Local Style'],
        sourceBacked: false,
        inferred: true,
      },
    ],
  },
  {
    name: 'Bowls & Salads',
    description: 'Generated fresh options for lunch or brunch.',
    items: [
      {
        name: 'Grilled Chicken Salad',
        description: 'Mixed greens with grilled chicken, tomato, cucumber, cheese, and dressing on the side.',
        priceText: null,
        badges: ['Lunch'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Tropical Salad',
        description: 'Mixed greens with seasonal fruit, avocado, tomato, and a citrus-style dressing.',
        priceText: null,
        badges: ['Vegetarian', 'Tropical'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Breakfast Bowl',
        description: 'Breakfast potatoes topped with eggs, cheese, peppers, onions, and your choice of protein.',
        priceText: null,
        badges: ['Breakfast'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Açaí Bowl',
        description: 'Açaí blend topped with granola, banana, berries, and honey.',
        priceText: null,
        badges: ['Cold', 'Fruit'],
        sourceBacked: false,
        inferred: true,
      },
    ],
  },
  {
    name: 'Sides',
    description: 'Generated add-ons and sides.',
    items: [
      {
        name: 'Breakfast Potatoes',
        description: 'Seasoned potatoes cooked until golden.',
        priceText: null,
        badges: [],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Bacon',
        description: 'Side of crispy bacon.',
        priceText: null,
        badges: [],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Sausage',
        description: 'Side of breakfast sausage.',
        priceText: null,
        badges: [],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Sweet Plantains',
        description: 'Fried ripe plantains.',
        priceText: null,
        badges: ['Local Style'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Toast',
        description: 'Toasted bread with butter or jam if available.',
        priceText: null,
        badges: [],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Side Salad',
        description: 'Small mixed green salad with dressing.',
        priceText: null,
        badges: ['Vegetarian'],
        sourceBacked: false,
        inferred: true,
      },
    ],
  },
  {
    name: 'Coffee & Espresso',
    description: 'Generated café beverage menu.',
    items: [
      {
        name: 'Coffee',
        description: 'Fresh brewed hot coffee.',
        priceText: null,
        badges: ['Hot'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Café con Leche',
        description: 'Puerto Rican-style coffee with steamed milk.',
        priceText: null,
        badges: ['Hot', 'Local Style'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Espresso',
        description: 'Single or double espresso, depending on availability.',
        priceText: null,
        badges: ['Hot'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Cappuccino',
        description: 'Espresso with steamed milk and foam.',
        priceText: null,
        badges: ['Hot'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Latte',
        description: 'Espresso with steamed milk; available hot or iced if offered.',
        priceText: null,
        badges: ['Hot', 'Iced Option'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Iced Coffee',
        description: 'Chilled coffee served over ice.',
        priceText: null,
        badges: ['Iced'],
        sourceBacked: false,
        inferred: true,
      },
    ],
  },
  {
    name: 'Smoothies & Cold Drinks',
    description: 'Generated refreshing drinks for a coastal café.',
    items: [
      {
        name: 'Mango Smoothie',
        description: 'Blended mango smoothie served cold.',
        priceText: null,
        badges: ['Cold', 'Fruit'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Strawberry Banana Smoothie',
        description: 'Strawberry and banana blended into a creamy smoothie.',
        priceText: null,
        badges: ['Cold', 'Fruit'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Piña Colada Smoothie',
        description: 'Pineapple and coconut blended into a tropical non-alcoholic smoothie.',
        priceText: null,
        badges: ['Cold', 'Tropical'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Fresh Juice',
        description: 'Seasonal juice selection, depending on availability.',
        priceText: null,
        badges: ['Cold'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Lemonade',
        description: 'House-style lemonade served over ice.',
        priceText: null,
        badges: ['Cold'],
        sourceBacked: false,
        inferred: true,
      },
      {
        name: 'Bottled Water & Sodas',
        description: 'Assorted bottled drinks and soft drinks.',
        priceText: null,
        badges: ['Cold'],
        sourceBacked: false,
        inferred: true,
      },
    ],
  },
];

const ownerConfirmationNotes = [
  'Confirm public name spelling and whether Good Start 466 should appear as the primary name.',
  'Confirm the best public phone number before launch.',
  'Replace starter menu details with owner-approved item names, descriptions, prices, and options.',
  'Add approved logo, brand colors, and photography when available.',
  'Confirm whether there is an official website beyond the current social profiles.',
];

const featuredMenuNames = [
  'Good Start Breakfast',
  'Café con Leche',
  'Avocado Toast',
  'Tripleta-Style Sandwich',
  'Açaí Bowl',
  'Piña Colada Smoothie',
];

const primaryActions = [
  { label: 'View Menu', href: '#menu', kind: 'anchor' },
  { label: 'Hours', href: '#hours', kind: 'anchor' },
  { label: 'Directions', href: restaurant.mapsUrl, kind: 'external' },
  { label: 'Call', href: restaurant.phoneHref, kind: 'phone' },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getFeaturedItems() {
  return featuredMenuNames
    .map((featureName) => {
      for (const category of menuCategories) {
        const item = category.items.find((candidate) => candidate.name === featureName);
        if (item) {
          return { ...item, categoryName: category.name };
        }
      }
      return null;
    })
    .filter((item): item is MenuItem & { categoryName: string } => item !== null);
}

const featuredItems = getFeaturedItems();
const menuItemCount = menuCategories.reduce((total, category) => total + category.items.length, 0);

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CafeOrCoffeeShop',
  name: restaurant.name,
  alternateName: restaurant.alternateName,
  servesCuisine: ['Cafe', 'Breakfast', 'Coffee'],
  priceRange: undefined,
  telephone: restaurant.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: restaurant.streetAddress,
    addressLocality: restaurant.locality,
    addressRegion: restaurant.region,
    postalCode: restaurant.postalCode,
    addressCountry: restaurant.country,
  },
  hasMap: restaurant.mapsUrl,
  sameAs: [restaurant.facebookUrl, restaurant.instagramUrl],
  openingHours: ['Mo-Su 08:00-14:00'],
  openingHoursSpecification: hours.map((row) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: `https://schema.org/${row.schemaDay}`,
    opens: row.opens,
    closes: row.closes,
  })),
  hasMenu: {
    '@type': 'Menu',
    name: `${restaurant.name} Menu`,
    hasMenuSection: menuCategories.map((category) => ({
      '@type': 'MenuSection',
      name: category.name,
      description: category.description,
      hasMenuItem: category.items.map((item) => ({
        '@type': 'MenuItem',
        name: item.name,
        description: item.description,
        suitableForDiet: item.badges.includes('Vegetarian') ? 'https://schema.org/VegetarianDiet' : undefined,
      })),
    })),
  },
};

export default function GoodstartSite({ mode, lang }: GeneratedSiteComponentProps) {
  const normalizedMode = String(mode ?? 'preview').toLowerCase();
  const languageCode = String(lang ?? 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
  const showOwnerNotes = ['preview', 'claim', 'draft', 'admin'].includes(normalizedMode);
  const robots = normalizedMode === 'live' || normalizedMode === 'published' ? 'index,follow' : 'noindex,nofollow';
  const jsonLdText = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <>
      <title>Good Start Costal Cafe | Breakfast & Coffee in Isabela, Puerto Rico</title>
      <meta
        name="description"
        content="Good Start Costal Cafe is a bright cafe in Isabela, Puerto Rico serving breakfast, coffee, lunch-friendly cafe options, and cold drinks daily from 8 AM to 2 PM."
      />
      <meta
        name="keywords"
        content="Good Start Costal Cafe, Good Start 466, cafe in Isabela Puerto Rico, breakfast in Isabela PR, coffee in Isabela, Puerto Rico breakfast cafe"
      />
      <meta name="robots" content={robots} />
      <meta property="og:title" content="Good Start Costal Cafe | Isabela, Puerto Rico" />
      <meta
        property="og:description"
        content="A sunny Isabela cafe for breakfast, coffee, easy lunch options, and cold drinks. Open daily 8 AM–2 PM."
      />
      <meta property="og:type" content="website" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText }} />

      <div id="top" className="gs-site" lang={languageCode} data-mode={normalizedMode}>
        <a className="gs-skip" href="#menu">Skip to menu</a>

        <header className="gs-header" aria-label="Good Start Costal Cafe site header">
          <div className="gs-header-inner">
            <a className="gs-logo" href="#top" aria-label="Good Start Costal Cafe home">
              <span className="gs-logo-mark" aria-hidden="true">GS</span>
              <span className="gs-logo-copy">
                <span className="gs-logo-primary">Good Start</span>
                <span className="gs-logo-secondary">Costal Cafe • Isabela</span>
              </span>
            </a>

            <nav className="gs-nav" aria-label="Primary navigation">
              <a href="#featured">Favorites</a>
              <a href="#menu">Menu</a>
              <a href="#about">About</a>
              <a href="#hours">Hours</a>
              <a href="#connect">Connect</a>
            </nav>

            <div className="gs-header-actions" aria-label="Quick actions">
              <a className="gs-pill-link" href="#menu">View Menu</a>
              <a className="gs-pill-link gs-pill-link-strong" href={restaurant.phoneHref}>Call</a>
            </div>
          </div>
        </header>

        <main>
          <section className="gs-hero" aria-labelledby="hero-title">
            <div className="gs-shell gs-hero-grid">
              <div className="gs-hero-copy">
                <p className="gs-eyebrow">Isabela café • Open daily 8 AM–2 PM</p>
                <h1 id="hero-title">A bright café start in Isabela.</h1>
                <p className="gs-hero-lede">
                  Good Start Costal Cafe brings breakfast, coffee, easy lunch options, and cold drinks together in a warm Puerto Rico café experience.
                </p>

                <div className="gs-hero-actions" aria-label="Primary visitor actions">
                  <a className="gs-button gs-button-primary" href="#menu">View Menu</a>
                  <a className="gs-button gs-button-secondary" href={restaurant.mapsUrl} target="_blank" rel="noreferrer">Get Directions</a>
                </div>

                <dl className="gs-hero-facts" aria-label="Restaurant quick facts">
                  <div>
                    <dt>Hours</dt>
                    <dd>Daily 8 AM–2 PM</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>Isabela, PR</dd>
                  </div>
                  <div>
                    <dt>Call</dt>
                    <dd><a href={restaurant.phoneHref}>{restaurant.phone}</a></dd>
                  </div>
                </dl>
              </div>

              <div className="gs-hero-art" aria-hidden="true">
                <div className="gs-sunburst" />
                <div className="gs-wave gs-wave-one" />
                <div className="gs-wave gs-wave-two" />
                <div className="gs-art-card gs-art-card-main">
                  <span className="gs-art-kicker">Morning café rhythm</span>
                  <div className="gs-cup">
                    <span className="gs-steam gs-steam-one" />
                    <span className="gs-steam gs-steam-two" />
                    <span className="gs-steam gs-steam-three" />
                    <span className="gs-cup-body" />
                  </div>
                  <strong>Daily 8–2</strong>
                  <span>Breakfast • Coffee • Cold drinks</span>
                </div>
                <div className="gs-art-card gs-art-card-small">
                  <span className="gs-route-badge">466</span>
                  <span>Good Start in Isabela</span>
                </div>
              </div>
            </div>
          </section>

          <section className="gs-quick-strip" aria-label="Quick restaurant information">
            <div className="gs-shell gs-quick-grid">
              <article>
                <span className="gs-info-label">Today</span>
                <strong>Open daily</strong>
                <p>8:00 AM–2:00 PM</p>
              </article>
              <article>
                <span className="gs-info-label">Call</span>
                <strong><a href={restaurant.phoneHref}>{restaurant.phone}</a></strong>
                <p>Tap to call the café</p>
              </article>
              <article>
                <span className="gs-info-label">Address</span>
                <strong>{restaurant.locality}, Puerto Rico</strong>
                <p>{restaurant.addressLine}</p>
              </article>
              <article className="gs-quick-cta-card">
                <span className="gs-info-label">Directions</span>
                <strong>Open in Maps</strong>
                <p><a href={restaurant.mapsUrl} target="_blank" rel="noreferrer">Get directions to Good Start</a></p>
              </article>
            </div>
          </section>

          <section id="featured" className="gs-section gs-featured" aria-labelledby="featured-title">
            <div className="gs-shell">
              <div className="gs-section-heading">
                <p className="gs-eyebrow">Cafe favorites</p>
                <h2 id="featured-title">Start here for breakfast, coffee, and cool coastal café picks.</h2>
                <p>
                  A quick look at selected items from the café menu, with details organized for easy scanning before you visit.
                </p>
              </div>

              <div className="gs-feature-grid">
                {featuredItems.map((item) => (
                  <article className="gs-feature-card" key={item.name}>
                    <span className="gs-card-category">{item.categoryName}</span>
                    <div className="gs-card-title-row">
                      <h3>{item.name}</h3>
                      {item.priceText ? <span className="gs-price">{item.priceText}</span> : null}
                    </div>
                    <p>{item.description}</p>
                    {item.badges.length > 0 ? (
                      <ul className="gs-badges" aria-label={`${item.name} labels`}>
                        {item.badges.map((badge) => <li key={badge}>{badge}</li>)}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="menu" className="gs-section gs-menu-section" aria-labelledby="menu-title">
            <div className="gs-shell">
              <div className="gs-menu-intro">
                <div className="gs-section-heading gs-menu-heading">
                  <p className="gs-eyebrow">Full menu</p>
                  <h2 id="menu-title">Browse the Good Start menu.</h2>
                  <p>{menuCategories.length} categories and {menuItemCount} café items, organized for breakfast plans, coffee stops, and midday bites.</p>
                </div>
                <div className="gs-menu-note" aria-label="Menu note">
                  <strong>Prices</strong>
                  <span>Ask at the café for current pricing.</span>
                </div>
              </div>

              <nav className="gs-category-nav" aria-label="Menu categories">
                {menuCategories.map((category) => (
                  <a key={category.name} href={`#menu-${slugify(category.name)}`}>
                    <span>{category.name}</span>
                    <em>{category.items.length}</em>
                  </a>
                ))}
              </nav>

              <div className="gs-menu-stack">
                {menuCategories.map((category) => (
                  <section className="gs-menu-category" id={`menu-${slugify(category.name)}`} key={category.name} aria-labelledby={`heading-${slugify(category.name)}`}>
                    <div className="gs-category-heading">
                      <div>
                        <p className="gs-category-count">{category.items.length} items</p>
                        <h3 id={`heading-${slugify(category.name)}`}>{category.name}</h3>
                      </div>
                      <p>{category.description}</p>
                    </div>

                    <div className="gs-items-grid">
                      {category.items.map((item) => (
                        <article className="gs-menu-item" key={`${category.name}-${item.name}`}>
                          <div className="gs-card-title-row">
                            <h4>{item.name}</h4>
                            {item.priceText ? <span className="gs-price">{item.priceText}</span> : null}
                          </div>
                          <p>{item.description}</p>
                          {item.badges.length > 0 ? (
                            <ul className="gs-badges" aria-label={`${item.name} labels`}>
                              {item.badges.map((badge) => <li key={badge}>{badge}</li>)}
                            </ul>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </section>

          <section id="about" className="gs-section gs-about" aria-labelledby="about-title">
            <div className="gs-shell gs-about-grid">
              <div>
                <p className="gs-eyebrow">A sunny café stop</p>
                <h2 id="about-title">Breakfast and coffee, rooted in Isabela.</h2>
                <p className="gs-large-copy">
                  Good Start Costal Cafe is a café in Isabela, Puerto Rico built around a simple morning idea: make it easy to start the day with coffee, breakfast plates, lighter café bites, sandwiches, bowls, sides, and cold drinks.
                </p>
                <p>
                  The site keeps the essentials close—menu, hours, directions, and call—so guests can plan a visit quickly from home or on the go.
                </p>
              </div>

              <div className="gs-about-cards" aria-label="Cafe highlights">
                <article>
                  <span>01</span>
                  <strong>Open every day</strong>
                  <p>Daily 8:00 AM–2:00 PM hours make the café easy to fit into a morning or early afternoon plan.</p>
                </article>
                <article>
                  <span>02</span>
                  <strong>Café-focused menu</strong>
                  <p>Breakfast, coffee, lunch-friendly options, bowls, sides, and cold drinks are organized in one complete menu.</p>
                </article>
                <article>
                  <span>03</span>
                  <strong>Easy Isabela directions</strong>
                  <p>Use the map link for directions to GW67+XCR, Isabela, 00690, Puerto Rico.</p>
                </article>
              </div>
            </div>
          </section>

          <section id="hours" className="gs-section gs-hours" aria-labelledby="hours-title">
            <div className="gs-shell gs-hours-grid">
              <div className="gs-hours-card">
                <p className="gs-eyebrow">Hours</p>
                <h2 id="hours-title">Visit Good Start Costal Cafe.</h2>
                <p className="gs-hours-summary">Open Monday through Sunday from 8:00 AM to 2:00 PM.</p>

                <div className="gs-hours-table" role="table" aria-label="Good Start Costal Cafe hours">
                  {hours.map((row) => (
                    <div className="gs-hours-row" role="row" key={row.day}>
                      <span role="cell">{row.day}</span>
                      <strong role="cell">{row.display}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gs-location-card">
                <div className="gs-map-abstract" aria-hidden="true">
                  <span className="gs-map-pin" />
                  <span className="gs-map-line gs-map-line-one" />
                  <span className="gs-map-line gs-map-line-two" />
                  <span className="gs-map-line gs-map-line-three" />
                </div>
                <p className="gs-eyebrow">Location</p>
                <h3>{restaurant.addressLine}</h3>
                <p>Find the café in Isabela, Puerto Rico. Use Google Maps for current routing and arrival details.</p>
                <div className="gs-location-actions">
                  <a className="gs-button gs-button-primary" href={restaurant.mapsUrl} target="_blank" rel="noreferrer">Get Directions</a>
                  <a className="gs-button gs-button-secondary" href={restaurant.phoneHref}>Call {restaurant.phone}</a>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer id="connect" className="gs-footer" aria-labelledby="connect-title">
          <div className="gs-shell gs-footer-grid">
            <div>
              <a className="gs-logo gs-footer-logo" href="#top" aria-label="Good Start Costal Cafe home">
                <span className="gs-logo-mark" aria-hidden="true">GS</span>
                <span className="gs-logo-copy">
                  <span className="gs-logo-primary">Good Start</span>
                  <span className="gs-logo-secondary">Costal Cafe</span>
                </span>
              </a>
              <p className="gs-footer-copy">
                A welcoming cafe in Isabela, Puerto Rico for breakfast, coffee, easy lunch options, and cold drinks. Also discoverable online as Good Start 466.
              </p>
            </div>

            <div>
              <h2 id="connect-title">Connect</h2>
              <address>
                <span>{restaurant.addressLine}</span>
                <a href={restaurant.phoneHref}>{restaurant.phone}</a>
              </address>
              <div className="gs-socials" aria-label="Social links">
                <a href={restaurant.facebookUrl} target="_blank" rel="noreferrer">Facebook</a>
                <a href={restaurant.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>
              </div>
            </div>

            <div>
              <h2>Quick actions</h2>
              <ul className="gs-footer-actions">
                {primaryActions.map((action) => (
                  <li key={action.label}>
                    <a href={action.href} target={action.kind === 'external' ? '_blank' : undefined} rel={action.kind === 'external' ? 'noreferrer' : undefined}>
                      {action.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {showOwnerNotes ? (
            <aside className="gs-owner-note" aria-label="Owner confirmation notes for preview">
              <strong>Owner confirmation before launch</strong>
              <ul>
                {ownerConfirmationNotes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </aside>
          ) : null}
        </footer>

        <nav className="gs-mobile-bar" aria-label="Mobile quick actions">
          <a href="#menu"><span aria-hidden="true">☕</span>Menu</a>
          <a href="#hours"><span aria-hidden="true">◷</span>Hours</a>
          <a href={restaurant.mapsUrl} target="_blank" rel="noreferrer"><span aria-hidden="true">⌖</span>Directions</a>
          <a href={restaurant.phoneHref}><span aria-hidden="true">☎</span>Call</a>
        </nav>
      </div>

      <style>{`
        .gs-site,
        .gs-site * {
          box-sizing: border-box;
        }

        .gs-site {
          --cream: #fff8ea;
          --cream-strong: #fff1d3;
          --sand: #f4d8b8;
          --sand-deep: #dfb786;
          --navy: #12324a;
          --espresso: #432b21;
          --ocean: #0e6674;
          --teal: #128f95;
          --mint: #def7ef;
          --coral: #e85f43;
          --citrus: #ffb84d;
          --white: #ffffff;
          --ink-muted: #5f6f73;
          --line: rgba(18, 50, 74, 0.14);
          --shadow: 0 22px 60px rgba(18, 50, 74, 0.14);
          --soft-shadow: 0 12px 34px rgba(18, 50, 74, 0.1);
          min-height: 100vh;
          overflow-x: hidden;
          color: var(--navy);
          background:
            radial-gradient(circle at 15% 8%, rgba(255, 184, 77, 0.28), transparent 28rem),
            radial-gradient(circle at 92% 3%, rgba(18, 143, 149, 0.2), transparent 24rem),
            linear-gradient(180deg, var(--cream) 0%, #fffaf1 42%, #f8ead8 100%);
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          line-height: 1.5;
        }

        .gs-site a {
          color: inherit;
          text-decoration: none;
        }

        .gs-site a:focus-visible,
        .gs-site button:focus-visible {
          outline: 3px solid var(--citrus);
          outline-offset: 4px;
          border-radius: 14px;
        }

        .gs-skip {
          position: fixed;
          top: 12px;
          left: 12px;
          z-index: 1000;
          transform: translateY(-160%);
          background: var(--navy);
          color: var(--white);
          padding: 0.75rem 1rem;
          border-radius: 999px;
          box-shadow: var(--soft-shadow);
        }

        .gs-skip:focus {
          transform: translateY(0);
        }

        .gs-shell {
          width: min(1160px, calc(100% - 32px));
          margin: 0 auto;
        }

        .gs-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 248, 234, 0.9);
          border-bottom: 1px solid rgba(18, 50, 74, 0.1);
          backdrop-filter: blur(18px);
        }

        .gs-header-inner {
          width: min(1200px, calc(100% - 28px));
          min-height: 76px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .gs-logo {
          display: inline-flex;
          align-items: center;
          gap: 0.72rem;
          min-width: max-content;
        }

        .gs-logo-mark {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          color: var(--navy);
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 900;
          letter-spacing: -0.08em;
          background:
            linear-gradient(135deg, rgba(255, 184, 77, 0.95), rgba(232, 95, 67, 0.82)),
            var(--citrus);
          border: 2px solid rgba(67, 43, 33, 0.12);
          border-radius: 17px 17px 17px 6px;
          box-shadow: 0 10px 22px rgba(232, 95, 67, 0.2);
        }

        .gs-logo-copy {
          display: grid;
          gap: 0.05rem;
        }

        .gs-logo-primary {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.15rem;
          font-weight: 900;
          letter-spacing: -0.035em;
          color: var(--espresso);
        }

        .gs-logo-secondary {
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ocean);
        }

        .gs-nav {
          display: flex;
          align-items: center;
          gap: 0.18rem;
          padding: 0.28rem;
          border: 1px solid rgba(18, 50, 74, 0.09);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.52);
        }

        .gs-nav a,
        .gs-pill-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0.58rem 0.86rem;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--navy);
        }

        .gs-nav a:hover {
          background: var(--mint);
          color: var(--ocean);
        }

        .gs-header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .gs-pill-link {
          border: 1px solid rgba(18, 50, 74, 0.14);
          background: rgba(255, 255, 255, 0.62);
        }

        .gs-pill-link-strong {
          border-color: transparent;
          color: var(--white);
          background: var(--ocean);
          box-shadow: 0 12px 22px rgba(14, 102, 116, 0.18);
        }

        .gs-hero {
          position: relative;
          padding: clamp(3rem, 6vw, 6.5rem) 0 clamp(2.2rem, 5vw, 4.5rem);
        }

        .gs-hero::before {
          content: "";
          position: absolute;
          inset: auto -8vw 0 -8vw;
          height: 180px;
          background:
            radial-gradient(closest-side at 20% 72%, rgba(18, 143, 149, 0.18), transparent 70%),
            linear-gradient(180deg, transparent, rgba(244, 216, 184, 0.42));
          pointer-events: none;
        }

        .gs-hero-grid {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1.04fr) minmax(340px, 0.82fr);
          align-items: center;
          gap: clamp(2rem, 6vw, 5rem);
        }

        .gs-eyebrow {
          margin: 0 0 0.75rem;
          color: var(--ocean);
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .gs-hero h1,
        .gs-section-heading h2,
        .gs-about h2,
        .gs-hours h2 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 950;
          letter-spacing: -0.055em;
          color: var(--espresso);
          line-height: 0.98;
        }

        .gs-hero h1 {
          max-width: 760px;
          font-size: clamp(3.2rem, 9vw, 7.7rem);
        }

        .gs-hero-lede {
          max-width: 690px;
          margin: 1.35rem 0 0;
          color: #425a61;
          font-size: clamp(1.08rem, 2vw, 1.34rem);
        }

        .gs-hero-actions,
        .gs-location-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          margin-top: 1.6rem;
        }

        .gs-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 50px;
          padding: 0.86rem 1.14rem;
          border-radius: 999px;
          font-weight: 950;
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        .gs-button:hover {
          transform: translateY(-2px);
        }

        .gs-button-primary {
          color: var(--white);
          background: linear-gradient(135deg, var(--ocean), var(--teal));
          box-shadow: 0 16px 30px rgba(14, 102, 116, 0.22);
        }

        .gs-button-secondary {
          color: var(--navy);
          background: rgba(255, 255, 255, 0.68);
          border: 1px solid rgba(18, 50, 74, 0.16);
          box-shadow: 0 12px 24px rgba(18, 50, 74, 0.08);
        }

        .gs-hero-facts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.9rem;
          margin: 2rem 0 0;
        }

        .gs-hero-facts div {
          min-width: 0;
          padding: 1rem;
          border: 1px solid rgba(18, 50, 74, 0.12);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.54);
          box-shadow: 0 14px 28px rgba(18, 50, 74, 0.07);
        }

        .gs-hero-facts dt {
          color: var(--ocean);
          font-size: 0.72rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .gs-hero-facts dd {
          margin: 0.28rem 0 0;
          color: var(--espresso);
          font-weight: 900;
        }

        .gs-hero-art {
          position: relative;
          min-height: 540px;
          border-radius: 48px;
          overflow: hidden;
          background:
            linear-gradient(180deg, rgba(255, 248, 234, 0.2), rgba(255, 255, 255, 0.58)),
            radial-gradient(circle at 50% 28%, rgba(255, 184, 77, 0.72), transparent 8rem),
            linear-gradient(150deg, #dff8f0 0%, #f7e1bd 58%, #f8c39d 100%);
          border: 1px solid rgba(18, 50, 74, 0.13);
          box-shadow: var(--shadow);
        }

        .gs-sunburst {
          position: absolute;
          top: 58px;
          left: 50%;
          width: 210px;
          height: 210px;
          transform: translateX(-50%);
          border-radius: 50%;
          background:
            radial-gradient(circle, #ffe3a1 0 42%, rgba(255, 184, 77, 0.72) 43% 62%, rgba(232, 95, 67, 0.08) 63% 100%);
          box-shadow: 0 0 0 34px rgba(255, 184, 77, 0.16), 0 0 0 70px rgba(255, 255, 255, 0.18);
        }

        .gs-wave {
          position: absolute;
          left: -8%;
          width: 116%;
          height: 120px;
          border-radius: 50%;
          border: 3px solid rgba(14, 102, 116, 0.23);
          border-left-color: transparent;
          border-right-color: transparent;
        }

        .gs-wave-one { bottom: 150px; transform: rotate(-4deg); }
        .gs-wave-two { bottom: 105px; transform: rotate(3deg); opacity: 0.8; }

        .gs-art-card {
          position: absolute;
          display: grid;
          gap: 0.36rem;
          border: 1px solid rgba(18, 50, 74, 0.14);
          background: rgba(255, 255, 255, 0.72);
          box-shadow: var(--soft-shadow);
          backdrop-filter: blur(12px);
        }

        .gs-art-card-main {
          right: 34px;
          bottom: 34px;
          width: min(310px, calc(100% - 68px));
          padding: 1.25rem;
          border-radius: 28px;
        }

        .gs-art-kicker {
          color: var(--ocean);
          font-size: 0.72rem;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .gs-art-card-main strong {
          color: var(--espresso);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 2rem;
          letter-spacing: -0.045em;
          line-height: 1;
        }

        .gs-art-card-main > span:last-child {
          color: #526a70;
          font-weight: 800;
        }

        .gs-art-card-small {
          top: 30px;
          left: 28px;
          display: flex;
          align-items: center;
          gap: 0.72rem;
          padding: 0.85rem 1rem;
          border-radius: 999px;
          font-weight: 950;
        }

        .gs-route-badge {
          display: grid;
          place-items: center;
          width: 44px;
          height: 32px;
          border-radius: 999px;
          color: var(--white);
          background: var(--coral);
          font-size: 0.85rem;
        }

        .gs-cup {
          position: relative;
          width: 92px;
          height: 78px;
          margin: 0.5rem 0 0.25rem;
        }

        .gs-cup-body {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 74px;
          height: 46px;
          border-radius: 8px 8px 24px 24px;
          background: linear-gradient(135deg, var(--ocean), var(--teal));
          box-shadow: inset 0 -12px 0 rgba(18, 50, 74, 0.13);
        }

        .gs-cup-body::after {
          content: "";
          position: absolute;
          right: -18px;
          top: 9px;
          width: 24px;
          height: 22px;
          border: 6px solid var(--teal);
          border-left: 0;
          border-radius: 0 20px 20px 0;
        }

        .gs-steam {
          position: absolute;
          bottom: 52px;
          width: 11px;
          height: 34px;
          border-radius: 999px;
          border-left: 3px solid rgba(67, 43, 33, 0.33);
          transform: rotate(12deg);
        }

        .gs-steam-one { left: 12px; }
        .gs-steam-two { left: 32px; height: 42px; opacity: 0.75; }
        .gs-steam-three { left: 54px; opacity: 0.55; }

        .gs-quick-strip {
          position: relative;
          padding: 0 0 clamp(3rem, 6vw, 5rem);
        }

        .gs-quick-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.85rem;
          padding: 0.85rem;
          border: 1px solid rgba(18, 50, 74, 0.12);
          border-radius: 32px;
          background: rgba(255, 255, 255, 0.64);
          box-shadow: var(--soft-shadow);
          backdrop-filter: blur(14px);
        }

        .gs-quick-grid article {
          min-width: 0;
          padding: 1rem;
          border-radius: 24px;
          background: rgba(255, 248, 234, 0.58);
        }

        .gs-quick-cta-card {
          background: linear-gradient(135deg, rgba(222, 247, 239, 0.88), rgba(255, 255, 255, 0.56)) !important;
        }

        .gs-info-label,
        .gs-card-category,
        .gs-category-count {
          display: block;
          color: var(--ocean);
          font-size: 0.72rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .gs-quick-grid strong {
          display: block;
          margin-top: 0.25rem;
          color: var(--espresso);
          font-size: 1rem;
        }

        .gs-quick-grid p {
          margin: 0.22rem 0 0;
          color: var(--ink-muted);
          font-size: 0.92rem;
        }

        .gs-quick-grid a {
          font-weight: 900;
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 3px;
        }

        .gs-section {
          padding: clamp(3.3rem, 7vw, 6.4rem) 0;
        }

        .gs-featured {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(222, 247, 239, 0.28)),
            linear-gradient(90deg, transparent, rgba(18, 143, 149, 0.08), transparent);
          border-top: 1px solid rgba(18, 50, 74, 0.08);
          border-bottom: 1px solid rgba(18, 50, 74, 0.08);
        }

        .gs-section-heading {
          max-width: 780px;
        }

        .gs-section-heading h2,
        .gs-about h2,
        .gs-hours h2 {
          font-size: clamp(2.25rem, 5.8vw, 4.8rem);
        }

        .gs-section-heading p:not(.gs-eyebrow),
        .gs-about p,
        .gs-hours-summary,
        .gs-location-card p {
          color: #4d666d;
          font-size: 1.04rem;
        }

        .gs-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 2rem;
        }

        .gs-feature-card,
        .gs-menu-item,
        .gs-hours-card,
        .gs-location-card,
        .gs-about-cards article {
          border: 1px solid rgba(18, 50, 74, 0.12);
          background: rgba(255, 255, 255, 0.72);
          box-shadow: 0 16px 34px rgba(18, 50, 74, 0.08);
        }

        .gs-feature-card {
          position: relative;
          min-height: 248px;
          padding: 1.25rem;
          border-radius: 30px;
          overflow: hidden;
        }

        .gs-feature-card::after {
          content: "";
          position: absolute;
          right: -46px;
          bottom: -52px;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 184, 77, 0.45), rgba(18, 143, 149, 0.12) 64%, transparent 65%);
          pointer-events: none;
        }

        .gs-card-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .gs-feature-card h3,
        .gs-menu-item h4,
        .gs-category-heading h3,
        .gs-location-card h3,
        .gs-footer h2 {
          margin: 0;
          color: var(--espresso);
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.04;
        }

        .gs-feature-card h3 {
          margin-top: 0.8rem;
          font-size: 1.72rem;
        }

        .gs-feature-card p,
        .gs-menu-item p {
          margin: 0.78rem 0 0;
          color: #53666b;
        }

        .gs-price {
          flex: 0 0 auto;
          color: var(--ocean);
          font-weight: 950;
        }

        .gs-badges {
          position: relative;
          z-index: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 0.42rem;
          margin: 1rem 0 0;
          padding: 0;
          list-style: none;
        }

        .gs-badges li {
          padding: 0.3rem 0.55rem;
          border: 1px solid rgba(14, 102, 116, 0.15);
          border-radius: 999px;
          color: var(--ocean);
          background: rgba(222, 247, 239, 0.76);
          font-size: 0.74rem;
          font-weight: 900;
        }

        .gs-menu-section {
          background:
            radial-gradient(circle at 0% 20%, rgba(255, 184, 77, 0.16), transparent 24rem),
            radial-gradient(circle at 100% 46%, rgba(18, 143, 149, 0.14), transparent 22rem);
        }

        .gs-menu-intro {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: end;
          gap: 1.5rem;
        }

        .gs-menu-note {
          display: grid;
          gap: 0.18rem;
          max-width: 250px;
          padding: 1rem;
          border: 1px solid rgba(18, 50, 74, 0.12);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.64);
          box-shadow: var(--soft-shadow);
        }

        .gs-menu-note strong {
          color: var(--espresso);
        }

        .gs-menu-note span {
          color: #586b70;
          font-size: 0.92rem;
        }

        .gs-category-nav {
          position: sticky;
          top: 88px;
          z-index: 20;
          display: flex;
          gap: 0.55rem;
          margin: 2rem 0;
          padding: 0.65rem;
          overflow-x: auto;
          border: 1px solid rgba(18, 50, 74, 0.11);
          border-radius: 999px;
          background: rgba(255, 248, 234, 0.88);
          box-shadow: 0 14px 28px rgba(18, 50, 74, 0.08);
          scrollbar-width: thin;
        }

        .gs-category-nav a {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          min-height: 42px;
          padding: 0.56rem 0.78rem;
          border: 1px solid rgba(18, 50, 74, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          color: var(--navy);
          font-weight: 900;
          font-size: 0.88rem;
        }

        .gs-category-nav a:hover {
          color: var(--white);
          background: var(--ocean);
        }

        .gs-category-nav em {
          display: grid;
          place-items: center;
          min-width: 25px;
          height: 25px;
          padding: 0 0.36rem;
          border-radius: 999px;
          color: var(--espresso);
          background: var(--citrus);
          font-style: normal;
          font-size: 0.75rem;
        }

        .gs-menu-stack {
          display: grid;
          gap: 1.6rem;
        }

        .gs-menu-category {
          scroll-margin-top: 172px;
          padding: clamp(1rem, 2.2vw, 1.4rem);
          border: 1px solid rgba(18, 50, 74, 0.1);
          border-radius: 34px;
          background: rgba(255, 255, 255, 0.44);
        }

        .gs-category-heading {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 1.2rem;
          align-items: end;
          padding: 0.35rem 0.3rem 1rem;
        }

        .gs-category-heading h3 {
          margin-top: 0.24rem;
          font-size: clamp(1.9rem, 4vw, 3.1rem);
        }

        .gs-category-heading p:last-child {
          margin: 0;
          color: #53666b;
        }

        .gs-items-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.85rem;
        }

        .gs-menu-item {
          min-height: 172px;
          padding: 1.05rem;
          border-radius: 24px;
        }

        .gs-menu-item h4 {
          font-size: 1.28rem;
        }

        .gs-about {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(255, 248, 234, 0.74));
          border-top: 1px solid rgba(18, 50, 74, 0.08);
          border-bottom: 1px solid rgba(18, 50, 74, 0.08);
        }

        .gs-about-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(320px, 0.75fr);
          gap: clamp(1.5rem, 5vw, 4rem);
          align-items: start;
        }

        .gs-large-copy {
          margin-top: 1.2rem;
          font-size: clamp(1.12rem, 2vw, 1.34rem) !important;
        }

        .gs-about-cards {
          display: grid;
          gap: 0.85rem;
        }

        .gs-about-cards article {
          display: grid;
          gap: 0.28rem;
          padding: 1.08rem;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.68);
        }

        .gs-about-cards span {
          width: max-content;
          padding: 0.2rem 0.48rem;
          border-radius: 999px;
          color: var(--white);
          background: var(--coral);
          font-size: 0.72rem;
          font-weight: 950;
        }

        .gs-about-cards strong {
          color: var(--espresso);
          font-size: 1.05rem;
        }

        .gs-about-cards p {
          margin: 0;
          font-size: 0.95rem;
        }

        .gs-hours-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.82fr) minmax(320px, 1fr);
          gap: 1rem;
          align-items: stretch;
        }

        .gs-hours-card,
        .gs-location-card {
          border-radius: 34px;
          padding: clamp(1.2rem, 3vw, 2rem);
        }

        .gs-hours-table {
          display: grid;
          gap: 0.5rem;
          margin-top: 1.25rem;
        }

        .gs-hours-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.78rem 0.9rem;
          border-radius: 16px;
          background: rgba(255, 248, 234, 0.72);
          border: 1px solid rgba(18, 50, 74, 0.08);
        }

        .gs-hours-row span {
          color: var(--navy);
          font-weight: 850;
        }

        .gs-hours-row strong {
          color: var(--espresso);
        }

        .gs-location-card {
          position: relative;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(222, 247, 239, 0.74), rgba(255, 255, 255, 0.72)),
            var(--white);
        }

        .gs-location-card > *:not(.gs-map-abstract) {
          position: relative;
          z-index: 1;
        }

        .gs-location-card h3 {
          max-width: 600px;
          font-size: clamp(1.9rem, 4vw, 3rem);
        }

        .gs-map-abstract {
          position: absolute;
          inset: 0;
          opacity: 0.55;
          pointer-events: none;
        }

        .gs-map-line {
          position: absolute;
          height: 3px;
          border-radius: 999px;
          background: rgba(14, 102, 116, 0.22);
          transform-origin: left center;
        }

        .gs-map-line-one { width: 78%; left: 13%; top: 28%; transform: rotate(-11deg); }
        .gs-map-line-two { width: 92%; left: 6%; top: 55%; transform: rotate(8deg); }
        .gs-map-line-three { width: 60%; left: 38%; top: 76%; transform: rotate(-18deg); }

        .gs-map-pin {
          position: absolute;
          right: 16%;
          top: 30%;
          width: 54px;
          height: 54px;
          border-radius: 50% 50% 50% 10px;
          background: var(--coral);
          transform: rotate(-45deg);
          box-shadow: 0 14px 30px rgba(232, 95, 67, 0.22);
        }

        .gs-map-pin::after {
          content: "";
          position: absolute;
          inset: 16px;
          border-radius: 50%;
          background: var(--cream);
        }

        .gs-footer {
          padding: clamp(2.5rem, 6vw, 4.5rem) 0 1.5rem;
          color: rgba(255, 255, 255, 0.86);
          background:
            radial-gradient(circle at 12% 0%, rgba(255, 184, 77, 0.18), transparent 24rem),
            linear-gradient(135deg, #12324a, #0b4754 70%, #083943);
        }

        .gs-footer-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.8fr 0.55fr;
          gap: 2rem;
        }

        .gs-footer .gs-logo-primary,
        .gs-footer h2 {
          color: var(--white);
        }

        .gs-footer .gs-logo-secondary,
        .gs-footer-copy,
        .gs-footer address,
        .gs-footer-actions a {
          color: rgba(255, 255, 255, 0.82);
        }

        .gs-footer-copy {
          max-width: 560px;
          margin: 1rem 0 0;
        }

        .gs-footer h2 {
          margin-bottom: 0.7rem;
          font-size: 1.55rem;
        }

        .gs-footer address {
          display: grid;
          gap: 0.4rem;
          font-style: normal;
        }

        .gs-footer address a,
        .gs-socials a,
        .gs-footer-actions a {
          font-weight: 900;
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 4px;
        }

        .gs-socials {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
          margin-top: 1rem;
        }

        .gs-socials a {
          display: inline-flex;
          min-height: 40px;
          align-items: center;
          padding: 0.45rem 0.78rem;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          color: var(--white);
          background: rgba(255, 255, 255, 0.08);
          text-decoration: none;
        }

        .gs-footer-actions {
          display: grid;
          gap: 0.35rem;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .gs-owner-note {
          width: min(1160px, calc(100% - 32px));
          margin: 2rem auto 0;
          padding: 1rem;
          border: 1px dashed rgba(255, 255, 255, 0.34);
          border-radius: 22px;
          color: rgba(255, 255, 255, 0.84);
          background: rgba(255, 255, 255, 0.07);
        }

        .gs-owner-note strong {
          display: block;
          color: var(--white);
          margin-bottom: 0.45rem;
        }

        .gs-owner-note ul {
          margin: 0;
          padding-left: 1.15rem;
        }

        .gs-owner-note li + li {
          margin-top: 0.25rem;
        }

        .gs-mobile-bar {
          position: fixed;
          left: 10px;
          right: 10px;
          bottom: 10px;
          z-index: 80;
          display: none;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.35rem;
          padding: 0.45rem;
          border: 1px solid rgba(18, 50, 74, 0.18);
          border-radius: 24px;
          background: rgba(255, 248, 234, 0.94);
          box-shadow: 0 18px 50px rgba(18, 50, 74, 0.22);
          backdrop-filter: blur(16px);
        }

        .gs-mobile-bar a {
          display: grid;
          place-items: center;
          gap: 0.12rem;
          min-height: 54px;
          border-radius: 18px;
          color: var(--navy);
          font-size: 0.72rem;
          font-weight: 950;
        }

        .gs-mobile-bar a:hover,
        .gs-mobile-bar a:focus-visible {
          color: var(--white);
          background: var(--ocean);
        }

        .gs-mobile-bar span {
          font-size: 1.02rem;
          line-height: 1;
        }

        @media (max-width: 980px) {
          .gs-nav {
            display: none;
          }

          .gs-hero-grid,
          .gs-about-grid,
          .gs-hours-grid,
          .gs-footer-grid {
            grid-template-columns: 1fr;
          }

          .gs-hero-art {
            min-height: 430px;
          }

          .gs-quick-grid,
          .gs-feature-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .gs-menu-intro,
          .gs-category-heading {
            grid-template-columns: 1fr;
          }

          .gs-menu-note {
            max-width: none;
          }
        }

        @media (max-width: 720px) {
          .gs-site {
            padding-bottom: 82px;
          }

          .gs-shell {
            width: min(100% - 24px, 1160px);
          }

          .gs-header-inner {
            width: min(100% - 20px, 1200px);
            min-height: 66px;
          }

          .gs-logo-mark {
            width: 42px;
            height: 42px;
            border-radius: 15px 15px 15px 6px;
          }

          .gs-logo-primary {
            font-size: 1rem;
          }

          .gs-logo-secondary {
            font-size: 0.66rem;
            letter-spacing: 0.1em;
          }

          .gs-header-actions {
            display: none;
          }

          .gs-hero {
            padding-top: 2.4rem;
          }

          .gs-hero-grid {
            gap: 1.6rem;
          }

          .gs-hero-lede {
            font-size: 1.04rem;
          }

          .gs-hero-actions,
          .gs-location-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .gs-button {
            width: 100%;
          }

          .gs-hero-facts {
            grid-template-columns: 1fr;
          }

          .gs-hero-facts div {
            padding: 0.9rem;
          }

          .gs-hero-art {
            min-height: 360px;
            border-radius: 34px;
          }

          .gs-sunburst {
            width: 164px;
            height: 164px;
          }

          .gs-art-card-main {
            right: 18px;
            bottom: 18px;
            width: calc(100% - 36px);
          }

          .gs-art-card-small {
            left: 16px;
            top: 18px;
          }

          .gs-quick-grid,
          .gs-feature-grid,
          .gs-items-grid {
            grid-template-columns: 1fr;
          }

          .gs-quick-grid {
            border-radius: 26px;
          }

          .gs-section {
            padding: 3.4rem 0;
          }

          .gs-feature-card {
            min-height: auto;
          }

          .gs-category-nav {
            top: 76px;
            margin: 1.4rem -2px 1.4rem;
            border-radius: 22px;
          }

          .gs-menu-category {
            scroll-margin-top: 150px;
            border-radius: 26px;
          }

          .gs-menu-item {
            min-height: auto;
          }

          .gs-hours-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.15rem;
          }

          .gs-footer {
            padding-bottom: 6.5rem;
          }

          .gs-mobile-bar {
            display: grid;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .gs-button {
            transition: none;
          }

          .gs-button:hover {
            transform: none;
          }
        }
      `}</style>
    </>
  );
}
