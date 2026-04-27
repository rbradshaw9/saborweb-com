import type { GeneratedSiteComponentProps } from '@/generated-sites/components';

type MenuItem = {
  name: string;
  description: string;
  priceText: string | null;
  badges: string[];
  sourceBacked: boolean;
  inferred: boolean;
  visible?: boolean;
};

type MenuCategory = {
  name: string;
  description: string;
  items: MenuItem[];
};

type HoursRow = {
  day: string;
  shortDay: string;
  opens: string;
  closes: string;
  display: string;
};

const restaurant = {
  name: 'Good Start Coastal Cafe',
  alternateName: 'Good Start 466',
  cuisine: 'Cafe',
  address: 'GW67+XCR, Isabela, 00690, Puerto Rico',
  streetAddress: 'GW67+XCR',
  locality: 'Isabela',
  postalCode: '00690',
  region: 'Puerto Rico',
  country: 'PR',
  phone: '(787) 830-9500',
  phoneHref: 'tel:+17878309500',
  mapsUrl: 'https://maps.google.com/?cid=2958274291943456299',
  facebookUrl: 'https://www.facebook.com/goodstart466',
  instagramUrl: 'https://www.instagram.com/goodstart466',
};

const hours: HoursRow[] = [
  { day: 'Monday', shortDay: 'Mon', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
  { day: 'Tuesday', shortDay: 'Tue', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
  { day: 'Wednesday', shortDay: 'Wed', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
  { day: 'Thursday', shortDay: 'Thu', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
  { day: 'Friday', shortDay: 'Fri', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
  { day: 'Saturday', shortDay: 'Sat', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
  { day: 'Sunday', shortDay: 'Sun', opens: '08:00', closes: '14:00', display: '8:00 AM–2:00 PM' },
];

// Menu provenance note for operators: this starter menu is fully generated from the structured brief.
// There are currently no source-backed menu item names/descriptions and no prices; keep all fields editable.
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

const featuredItemNames = [
  'Good Start Breakfast',
  'Café con Leche',
  'Avocado Toast',
  'Tripleta-Style Sandwich',
  'Açaí Bowl',
  'Piña Colada Smoothie',
];

const ownerConfirmationNotes = [
  'Confirm final public name spelling and whether Good Start 466 should be used as the primary or alternate brand.',
  'Confirm the best public phone number before launch.',
  'Review menu item names, descriptions, badges, availability, and prices.',
  'Confirm logo/brand assets and whether a standalone official website should be linked.',
];

const copy = {
  en: {
    navMenu: 'Menu',
    navAbout: 'About',
    navHours: 'Hours',
    navVisit: 'Visit',
    viewMenu: 'View Menu',
    call: 'Call',
    callCafe: 'Call Cafe',
    directions: 'Get Directions',
    hours: 'Hours',
    heroEyebrow: 'Isabela café • Open daily 8 AM–2 PM',
    heroHeadline: 'A bright café start in Isabela.',
    heroSubheadline:
      'Good Start Coastal Cafe brings breakfast, coffee, easy lunch options, and cold drinks together in a warm Puerto Rico café experience.',
    quickTitle: 'Everything for a good start',
    quickSubtitle: 'Plan a café stop, check the daily hours, call ahead, or open directions in one tap.',
    featuredTitle: 'Cafe favorites',
    featuredSubtitle: 'A quick look at popular breakfast, coffee, lunch, and cold drink ideas from the editable menu.',
    fullMenuTitle: 'Full menu',
    fullMenuSubtitle: 'Browse breakfast plates, lighter starts, sandwiches, bowls, sides, coffee, and cold drinks.',
    aboutTitle: 'A sunny café stop in Isabela',
    aboutBody:
      'Built for mornings and easy afternoons, Good Start Coastal Cafe keeps the experience simple: coffee, breakfast, lighter café bites, lunch-friendly options, and refreshing drinks in Isabela, Puerto Rico.',
    hoursTitle: 'Visit Good Start Coastal Cafe',
    hoursSubtitle: 'Open every day from 8:00 AM to 2:00 PM at GW67+XCR in Isabela.',
    connectTitle: 'Connect with Good Start',
    socialSubtitle: 'Social links are here for updates; this page is the primary menu, hours, and visit hub.',
    openDaily: 'Open daily',
    today: 'Today',
    phone: 'Phone',
    address: 'Address',
    dailyHours: 'Daily hours',
    menuSections: 'Menu sections',
    items: 'items',
    item: 'item',
    skip: 'Skip to main content',
    ownerChecklist: 'Owner preview checklist',
  },
  es: {
    navMenu: 'Menú',
    navAbout: 'Acerca',
    navHours: 'Horario',
    navVisit: 'Visítanos',
    viewMenu: 'Ver menú',
    call: 'Llamar',
    callCafe: 'Llamar',
    directions: 'Cómo llegar',
    hours: 'Horario',
    heroEyebrow: 'Café en Isabela • Abierto diario 8 AM–2 PM',
    heroHeadline: 'Un comienzo brillante en Isabela.',
    heroSubheadline:
      'Good Start Coastal Cafe reúne desayunos, café, opciones sencillas de almuerzo y bebidas frías en una experiencia cálida de café en Puerto Rico.',
    quickTitle: 'Todo para un buen comienzo',
    quickSubtitle: 'Planifica tu visita, revisa el horario diario, llama o abre direcciones con un toque.',
    featuredTitle: 'Favoritos del café',
    featuredSubtitle: 'Una mirada rápida a ideas populares de desayuno, café, almuerzo y bebidas frías desde el menú editable.',
    fullMenuTitle: 'Menú completo',
    fullMenuSubtitle: 'Explora desayunos, opciones ligeras, sándwiches, bowls, acompañantes, café y bebidas frías.',
    aboutTitle: 'Un café soleado en Isabela',
    aboutBody:
      'Pensado para mañanas y tardes fáciles, Good Start Coastal Cafe mantiene la experiencia sencilla: café, desayuno, bocados ligeros, opciones de almuerzo y bebidas refrescantes en Isabela, Puerto Rico.',
    hoursTitle: 'Visita Good Start Coastal Cafe',
    hoursSubtitle: 'Abierto todos los días de 8:00 AM a 2:00 PM en GW67+XCR en Isabela.',
    connectTitle: 'Conecta con Good Start',
    socialSubtitle: 'Los enlaces sociales están para actualizaciones; esta página es el centro principal de menú, horario y visita.',
    openDaily: 'Abierto diario',
    today: 'Hoy',
    phone: 'Teléfono',
    address: 'Dirección',
    dailyHours: 'Horario diario',
    menuSections: 'Secciones del menú',
    items: 'platos',
    item: 'plato',
    skip: 'Saltar al contenido principal',
    ownerChecklist: 'Lista de revisión del dueño',
  },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function findFeaturedItems() {
  const allItems = menuCategories.flatMap((category) =>
    category.items
      .filter((item) => item.visible !== false)
      .map((item) => ({ ...item, category: category.name })),
  );

  return featuredItemNames
    .map((name) => allItems.find((item) => item.name === name))
    .filter((item): item is MenuItem & { category: string } => Boolean(item));
}

function createJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: restaurant.name,
    alternateName: restaurant.alternateName,
    description:
      'Cafe in Isabela, Puerto Rico serving breakfast, coffee, easy lunch options, and cold drinks. Open daily 8 AM to 2 PM.',
    servesCuisine: ['Cafe', 'Breakfast', 'Coffee'],
    telephone: restaurant.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.streetAddress,
      addressLocality: restaurant.locality,
      postalCode: restaurant.postalCode,
      addressRegion: restaurant.region,
      addressCountry: restaurant.country,
    },
    hasMap: restaurant.mapsUrl,
    openingHoursSpecification: hours.map((row) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${row.day}`,
      opens: row.opens,
      closes: row.closes,
    })),
    sameAs: [restaurant.facebookUrl, restaurant.instagramUrl],
    hasMenu: {
      '@type': 'Menu',
      name: `${restaurant.name} Menu`,
      hasMenuSection: menuCategories.map((category) => ({
        '@type': 'MenuSection',
        name: category.name,
        description: category.description,
        hasMenuItem: category.items
          .filter((item) => item.visible !== false)
          .map((item) => ({
            '@type': 'MenuItem',
            name: item.name,
            description: item.description,
          })),
      })),
    },
  };
}

export default function GoodstartSite({ mode, lang }: GeneratedSiteComponentProps) {
  const langKey = String(lang || '').toLowerCase().startsWith('es') ? 'es' : 'en';
  const t = copy[langKey];
  const modeKey = String(mode || '').toLowerCase();
  const showOwnerNotes = ['owner', 'draft', 'edit', 'internal'].includes(modeKey);
  const featuredItems = findFeaturedItems();
  const visibleItemsCount = menuCategories.reduce(
    (count, category) => count + category.items.filter((item) => item.visible !== false).length,
    0,
  );
  const jsonLd = createJsonLd();
  const seoTitle = `${restaurant.name} | Cafe, Breakfast & Coffee in Isabela Puerto Rico`;
  const seoDescription =
    'Visit Good Start Coastal Cafe, a cafe in Isabela, Puerto Rico for breakfast, coffee, easy lunch options, and cold drinks. Open daily 8 AM–2 PM.';

  return (
    <>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta
        name="keywords"
        content="Good Start Coastal Cafe, Good Start 466, cafe in Isabela Puerto Rico, breakfast in Isabela PR, coffee in Isabela, Puerto Rico breakfast cafe"
      />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="gs-site" id="top">
        <a className="gs-skip" href="#main">
          {t.skip}
        </a>

        <header className="gs-header" aria-label="Good Start Coastal Cafe site header">
          <div className="gs-shell gs-header-inner">
            <a className="gs-brand" href="#top" aria-label={`${restaurant.name} home`}>
              <span className="gs-brand-mark" aria-hidden="true">
                <span className="gs-brand-sun" />
                <span className="gs-brand-wave" />
              </span>
              <span>
                <span className="gs-brand-name">Good Start</span>
                <span className="gs-brand-sub">Coastal Cafe</span>
              </span>
            </a>

            <nav className="gs-primary-nav" aria-label="Primary navigation">
              <a href="#menu">{t.navMenu}</a>
              <a href="#about">{t.navAbout}</a>
              <a href="#hours">{t.navHours}</a>
              <a href="#visit">{t.navVisit}</a>
            </nav>

            <div className="gs-header-actions" aria-label="Primary actions">
              <a className="gs-link-button gs-link-button-soft" href="#menu">
                {t.viewMenu}
              </a>
              <a className="gs-link-button gs-link-button-coral" href={restaurant.phoneHref}>
                {t.call}
              </a>
            </div>
          </div>
        </header>

        <main id="main">
          <section className="gs-hero gs-section" aria-labelledby="hero-title">
            <div className="gs-shell gs-hero-grid">
              <div className="gs-hero-copy">
                <p className="gs-eyebrow">{t.heroEyebrow}</p>
                <h1 id="hero-title">{t.heroHeadline}</h1>
                <p className="gs-hero-lede">{t.heroSubheadline}</p>
                <div className="gs-hero-actions" aria-label="Hero actions">
                  <a className="gs-cta gs-cta-primary" href="#menu">
                    {t.viewMenu}
                  </a>
                  <a className="gs-cta gs-cta-secondary" href={restaurant.mapsUrl} target="_blank" rel="noreferrer">
                    {t.directions}
                  </a>
                </div>
                <dl className="gs-hero-facts" aria-label="Cafe quick facts">
                  <div>
                    <dt>{t.openDaily}</dt>
                    <dd>8 AM–2 PM</dd>
                  </div>
                  <div>
                    <dt>{restaurant.cuisine}</dt>
                    <dd>Breakfast • Coffee</dd>
                  </div>
                  <div>
                    <dt>Isabela</dt>
                    <dd>Puerto Rico</dd>
                  </div>
                </dl>
              </div>

              <div className="gs-hero-art" aria-hidden="true">
                <div className="gs-art-card gs-art-card-main">
                  <div className="gs-sunrise">
                    <span className="gs-sun-core" />
                    <span className="gs-wave gs-wave-one" />
                    <span className="gs-wave gs-wave-two" />
                    <span className="gs-wave gs-wave-three" />
                  </div>
                  <div className="gs-art-caption">
                    <span className="gs-art-kicker">Morning cafe rhythm</span>
                    <strong>Open daily</strong>
                    <span>8:00 AM–2:00 PM</span>
                  </div>
                </div>
                <div className="gs-art-card gs-art-card-mini gs-mini-one">
                  <span className="gs-mini-icon">☕</span>
                  <span>Coffee</span>
                </div>
                <div className="gs-art-card gs-art-card-mini gs-mini-two">
                  <span className="gs-mini-icon">☀</span>
                  <span>Breakfast</span>
                </div>
              </div>
            </div>
          </section>

          <section className="gs-section gs-quick" aria-labelledby="quick-title">
            <div className="gs-shell">
              <div className="gs-section-heading gs-section-heading-center">
                <p className="gs-eyebrow">{t.quickTitle}</p>
                <h2 id="quick-title">{t.quickSubtitle}</h2>
              </div>
              <div className="gs-quick-grid">
                <article className="gs-quick-card">
                  <span className="gs-quick-icon" aria-hidden="true">🌤</span>
                  <h3>{t.today}</h3>
                  <p>{t.openDaily} · 8:00 AM–2:00 PM</p>
                  <a href="#hours">{t.hours}</a>
                </article>
                <article className="gs-quick-card">
                  <span className="gs-quick-icon" aria-hidden="true">☎</span>
                  <h3>{t.phone}</h3>
                  <p>{restaurant.phone}</p>
                  <a href={restaurant.phoneHref}>{t.callCafe}</a>
                </article>
                <article className="gs-quick-card">
                  <span className="gs-quick-icon" aria-hidden="true">📍</span>
                  <h3>{t.address}</h3>
                  <p>{restaurant.address}</p>
                  <a href={restaurant.mapsUrl} target="_blank" rel="noreferrer">
                    {t.directions}
                  </a>
                </article>
              </div>
            </div>
          </section>

          <section className="gs-section gs-featured" aria-labelledby="featured-title">
            <div className="gs-shell">
              <div className="gs-section-heading">
                <p className="gs-eyebrow">{t.featuredTitle}</p>
                <h2 id="featured-title">Start here</h2>
                <p>{t.featuredSubtitle}</p>
              </div>

              <div className="gs-featured-grid">
                {featuredItems.map((item, index) => (
                  <article className="gs-feature-card" key={item.name}>
                    <div className="gs-feature-number" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <p className="gs-card-category">{item.category}</p>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      {item.badges.length > 0 && (
                        <ul className="gs-badge-list" aria-label={`${item.name} tags`}>
                          {item.badges.map((badge) => (
                            <li key={badge}>{badge}</li>
                          ))}
                        </ul>
                      )}
                      {item.priceText ? <p className="gs-price">{item.priceText}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="gs-section gs-menu" id="menu" aria-labelledby="menu-title">
            <div className="gs-shell">
              <div className="gs-menu-top">
                <div className="gs-section-heading">
                  <p className="gs-eyebrow">{t.menuSections}</p>
                  <h2 id="menu-title">{t.fullMenuTitle}</h2>
                  <p>{t.fullMenuSubtitle}</p>
                </div>
                <div className="gs-menu-count" aria-label={`${visibleItemsCount} menu items`}>
                  <strong>{visibleItemsCount}</strong>
                  <span>{visibleItemsCount === 1 ? t.item : t.items}</span>
                </div>
              </div>

              <nav className="gs-category-nav" aria-label="Menu categories">
                {menuCategories.map((category) => (
                  <a href={`#${slugify(category.name)}`} key={category.name}>
                    {category.name}
                    <span>{category.items.filter((item) => item.visible !== false).length}</span>
                  </a>
                ))}
              </nav>

              <div className="gs-menu-sections">
                {menuCategories.map((category) => {
                  const visibleItems = category.items.filter((item) => item.visible !== false);
                  return (
                    <section className="gs-menu-section" id={slugify(category.name)} key={category.name} aria-labelledby={`${slugify(category.name)}-title`}>
                      <div className="gs-menu-section-heading">
                        <div>
                          <h3 id={`${slugify(category.name)}-title`}>{category.name}</h3>
                          <p>{category.description}</p>
                        </div>
                        <span>
                          {visibleItems.length} {visibleItems.length === 1 ? t.item : t.items}
                        </span>
                      </div>

                      <div className="gs-item-grid">
                        {visibleItems.map((item) => (
                          <article className="gs-menu-item" key={`${category.name}-${item.name}`}>
                            <div className="gs-menu-item-main">
                              <h4>{item.name}</h4>
                              <p>{item.description}</p>
                              {item.badges.length > 0 && (
                                <ul className="gs-badge-list" aria-label={`${item.name} tags`}>
                                  {item.badges.map((badge) => (
                                    <li key={badge}>{badge}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            {item.priceText ? <p className="gs-price">{item.priceText}</p> : null}
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="gs-section gs-about" id="about" aria-labelledby="about-title">
            <div className="gs-shell gs-about-grid">
              <div className="gs-about-copy">
                <p className="gs-eyebrow">Good Start in Isabela</p>
                <h2 id="about-title">{t.aboutTitle}</h2>
                <p>{t.aboutBody}</p>
              </div>
              <div className="gs-about-cards" aria-label="Cafe highlights">
                <article>
                  <span aria-hidden="true">☕</span>
                  <h3>Coffee & mornings</h3>
                  <p>A simple stop for daily café hours, warm drinks, and morning-friendly plates.</p>
                </article>
                <article>
                  <span aria-hidden="true">🥪</span>
                  <h3>Easy lunch options</h3>
                  <p>Sandwiches, wraps, salads, bowls, and sides keep the menu flexible for a midday visit.</p>
                </article>
                <article>
                  <span aria-hidden="true">🌴</span>
                  <h3>Isabela café energy</h3>
                  <p>Bright colors, coastal cues, and clear visit details make planning your stop simple.</p>
                </article>
              </div>
            </div>
          </section>

          <section className="gs-section gs-visit" id="hours" aria-labelledby="hours-title">
            <div className="gs-shell gs-visit-grid" id="visit">
              <div className="gs-section-heading">
                <p className="gs-eyebrow">{t.dailyHours}</p>
                <h2 id="hours-title">{t.hoursTitle}</h2>
                <p>{t.hoursSubtitle}</p>
              </div>

              <div className="gs-hours-card">
                <h3>{t.hours}</h3>
                <dl>
                  {hours.map((row) => (
                    <div key={row.day}>
                      <dt>{row.day}</dt>
                      <dd>{row.display}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="gs-location-card">
                <div className="gs-map-art" aria-hidden="true">
                  <span className="gs-map-pin" />
                  <span className="gs-map-line gs-map-line-one" />
                  <span className="gs-map-line gs-map-line-two" />
                  <span className="gs-map-dot gs-map-dot-one" />
                  <span className="gs-map-dot gs-map-dot-two" />
                </div>
                <div>
                  <h3>{restaurant.name}</h3>
                  <p>{restaurant.address}</p>
                  <p>
                    <a href={restaurant.phoneHref}>{restaurant.phone}</a>
                  </p>
                  <div className="gs-location-actions">
                    <a className="gs-cta gs-cta-primary" href={restaurant.mapsUrl} target="_blank" rel="noreferrer">
                      {t.directions}
                    </a>
                    <a className="gs-cta gs-cta-secondary" href={restaurant.phoneHref}>
                      {t.callCafe}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {showOwnerNotes ? (
            <aside className="gs-owner-notes gs-shell" aria-labelledby="owner-notes-title">
              <h2 id="owner-notes-title">{t.ownerChecklist}</h2>
              <ul>
                {ownerConfirmationNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </aside>
          ) : null}
        </main>

        <footer className="gs-footer" aria-labelledby="footer-title">
          <div className="gs-shell gs-footer-grid">
            <div>
              <h2 id="footer-title">{t.connectTitle}</h2>
              <p>{t.socialSubtitle}</p>
              <div className="gs-socials" aria-label="Social links">
                <a href={restaurant.facebookUrl} target="_blank" rel="noreferrer">
                  Facebook
                </a>
                <a href={restaurant.instagramUrl} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </div>
            </div>
            <address>
              <strong>{restaurant.name}</strong>
              <span>{restaurant.address}</span>
              <a href={restaurant.phoneHref}>{restaurant.phone}</a>
              <span>{t.openDaily}: 8:00 AM–2:00 PM</span>
            </address>
          </div>
        </footer>

        <nav className="gs-mobile-actions" aria-label="Mobile quick actions">
          <a href="#menu">
            <span aria-hidden="true">☰</span>
            {t.navMenu}
          </a>
          <a href="#hours">
            <span aria-hidden="true">◷</span>
            {t.navHours}
          </a>
          <a href={restaurant.mapsUrl} target="_blank" rel="noreferrer">
            <span aria-hidden="true">⌖</span>
            {t.directions}
          </a>
          <a href={restaurant.phoneHref}>
            <span aria-hidden="true">☎</span>
            {t.call}
          </a>
        </nav>

        <style>{`
          :root {
            scroll-behavior: smooth;
          }

          .gs-site {
            --cream: #fff8e8;
            --sand: #f7e6c8;
            --sand-strong: #edce9d;
            --turquoise: #0f9fa7;
            --turquoise-dark: #08737f;
            --blue: #09637a;
            --navy: #102f3d;
            --espresso: #3b241b;
            --coral: #f26f55;
            --citrus: #ffb84d;
            --white: #ffffff;
            --muted: #64757a;
            --line: rgba(16, 47, 61, 0.14);
            --shadow: 0 22px 70px rgba(16, 47, 61, 0.16);
            --shadow-soft: 0 14px 38px rgba(16, 47, 61, 0.1);
            color: var(--navy);
            background:
              radial-gradient(circle at 12% 8%, rgba(255, 184, 77, 0.28), transparent 28rem),
              radial-gradient(circle at 92% 5%, rgba(15, 159, 167, 0.2), transparent 24rem),
              linear-gradient(180deg, #fff9eb 0%, #fff5df 52%, #f7ead4 100%);
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            line-height: 1.5;
            min-height: 100vh;
            overflow-x: clip;
            padding-bottom: 78px;
          }

          .gs-site * {
            box-sizing: border-box;
          }

          .gs-site a {
            color: inherit;
          }

          .gs-site a:focus-visible,
          .gs-site button:focus-visible {
            outline: 3px solid rgba(242, 111, 85, 0.85);
            outline-offset: 4px;
            border-radius: 14px;
          }

          .gs-shell {
            width: min(1120px, calc(100% - 32px));
            margin: 0 auto;
          }

          .gs-skip {
            position: fixed;
            left: 16px;
            top: 12px;
            z-index: 1000;
            transform: translateY(-140%);
            background: var(--navy);
            color: var(--white);
            padding: 10px 14px;
            border-radius: 999px;
            text-decoration: none;
            font-weight: 800;
            transition: transform 160ms ease;
          }

          .gs-skip:focus {
            transform: translateY(0);
          }

          .gs-header {
            position: sticky;
            top: 0;
            z-index: 50;
            border-bottom: 1px solid rgba(16, 47, 61, 0.1);
            background: rgba(255, 248, 232, 0.88);
            backdrop-filter: blur(18px);
          }

          .gs-header-inner {
            min-height: 74px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }

          .gs-brand {
            display: inline-flex;
            align-items: center;
            gap: 11px;
            text-decoration: none;
            min-width: max-content;
          }

          .gs-brand-mark {
            position: relative;
            width: 46px;
            height: 46px;
            border-radius: 18px;
            background: linear-gradient(145deg, #ffce6b 0%, #f26f55 52%, #0f9fa7 100%);
            box-shadow: 0 12px 28px rgba(242, 111, 85, 0.28);
            overflow: hidden;
            flex: 0 0 auto;
          }

          .gs-brand-sun {
            position: absolute;
            width: 19px;
            height: 19px;
            border-radius: 50%;
            background: #fff7d4;
            top: 9px;
            left: 9px;
          }

          .gs-brand-wave,
          .gs-brand-wave::before,
          .gs-brand-wave::after {
            position: absolute;
            content: '';
            height: 12px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.82);
          }

          .gs-brand-wave {
            width: 54px;
            left: -4px;
            bottom: 7px;
          }

          .gs-brand-wave::before {
            width: 38px;
            left: 10px;
            bottom: 10px;
            opacity: 0.58;
          }

          .gs-brand-wave::after {
            width: 24px;
            right: 4px;
            bottom: 20px;
            opacity: 0.38;
          }

          .gs-brand-name {
            display: block;
            font-size: 1.12rem;
            font-weight: 950;
            letter-spacing: -0.045em;
            line-height: 1;
          }

          .gs-brand-sub {
            display: block;
            color: var(--turquoise-dark);
            font-size: 0.76rem;
            font-weight: 900;
            letter-spacing: 0.12em;
            line-height: 1.25;
            text-transform: uppercase;
          }

          .gs-primary-nav {
            display: none;
            align-items: center;
            gap: 6px;
            padding: 6px;
            border: 1px solid rgba(16, 47, 61, 0.1);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.5);
          }

          .gs-primary-nav a {
            border-radius: 999px;
            color: rgba(16, 47, 61, 0.82);
            font-size: 0.92rem;
            font-weight: 850;
            padding: 9px 12px;
            text-decoration: none;
          }

          .gs-primary-nav a:hover {
            background: rgba(15, 159, 167, 0.1);
            color: var(--turquoise-dark);
          }

          .gs-header-actions {
            display: none;
            align-items: center;
            gap: 10px;
          }

          .gs-link-button,
          .gs-cta {
            align-items: center;
            border-radius: 999px;
            display: inline-flex;
            font-weight: 950;
            justify-content: center;
            min-height: 44px;
            padding: 12px 18px;
            text-decoration: none;
            transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
          }

          .gs-link-button:hover,
          .gs-cta:hover {
            transform: translateY(-1px);
          }

          .gs-link-button-soft,
          .gs-cta-secondary {
            background: rgba(255, 255, 255, 0.72);
            border: 1px solid rgba(16, 47, 61, 0.14);
            color: var(--navy);
          }

          .gs-link-button-coral,
          .gs-cta-primary {
            background: linear-gradient(135deg, var(--coral), #ff8c5d);
            box-shadow: 0 16px 32px rgba(242, 111, 85, 0.28);
            color: #ffffff;
          }

          .gs-section {
            padding: 64px 0;
          }

          .gs-hero {
            position: relative;
            padding-top: 54px;
          }

          .gs-hero::before {
            position: absolute;
            content: '';
            inset: 0 0 auto;
            height: 72%;
            background:
              linear-gradient(115deg, rgba(255, 248, 232, 0.88), rgba(255, 248, 232, 0.1)),
              radial-gradient(circle at 75% 20%, rgba(15, 159, 167, 0.18), transparent 19rem);
            pointer-events: none;
          }

          .gs-hero-grid {
            position: relative;
            display: grid;
            gap: 34px;
          }

          .gs-eyebrow {
            color: var(--turquoise-dark);
            font-size: 0.78rem;
            font-weight: 950;
            letter-spacing: 0.16em;
            margin: 0 0 12px;
            text-transform: uppercase;
          }

          .gs-hero h1,
          .gs-section-heading h2,
          .gs-about-copy h2 {
            color: var(--navy);
            font-weight: 950;
            letter-spacing: -0.065em;
            line-height: 0.96;
            margin: 0;
          }

          .gs-hero h1 {
            font-size: clamp(3.2rem, 14vw, 6.8rem);
            max-width: 780px;
          }

          .gs-hero-lede {
            color: rgba(16, 47, 61, 0.78);
            font-size: clamp(1.05rem, 2.2vw, 1.35rem);
            margin: 20px 0 0;
            max-width: 680px;
          }

          .gs-hero-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 28px;
          }

          .gs-hero-actions .gs-cta {
            width: 100%;
          }

          .gs-hero-facts {
            display: grid;
            gap: 12px;
            grid-template-columns: 1fr;
            margin: 28px 0 0;
          }

          .gs-hero-facts div {
            background: rgba(255, 255, 255, 0.62);
            border: 1px solid rgba(16, 47, 61, 0.1);
            border-radius: 22px;
            padding: 14px 16px;
            box-shadow: 0 10px 28px rgba(16, 47, 61, 0.06);
          }

          .gs-hero-facts dt {
            color: var(--muted);
            font-size: 0.76rem;
            font-weight: 900;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          .gs-hero-facts dd {
            color: var(--espresso);
            font-size: 1.02rem;
            font-weight: 950;
            margin: 2px 0 0;
          }

          .gs-hero-art {
            min-height: 430px;
            position: relative;
          }

          .gs-art-card {
            border: 1px solid rgba(16, 47, 61, 0.12);
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(16px);
            box-shadow: var(--shadow);
          }

          .gs-art-card-main {
            position: relative;
            min-height: 385px;
            overflow: hidden;
            border-radius: 42px;
            background:
              linear-gradient(180deg, rgba(255, 251, 237, 0.92) 0%, rgba(255, 233, 189, 0.84) 54%, rgba(169, 227, 224, 0.76) 100%);
          }

          .gs-sunrise {
            position: absolute;
            inset: 24px;
            border-radius: 34px;
            overflow: hidden;
            background:
              radial-gradient(circle at 50% 44%, rgba(255, 184, 77, 0.32), transparent 23%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.06));
          }

          .gs-sun-core {
            position: absolute;
            width: 148px;
            height: 148px;
            left: 50%;
            top: 48px;
            transform: translateX(-50%);
            border-radius: 50%;
            background: radial-gradient(circle, #fff9d8 0 34%, #ffce6b 35% 70%, rgba(242, 111, 85, 0.42) 71% 100%);
            box-shadow: 0 0 80px rgba(255, 184, 77, 0.75);
          }

          .gs-wave {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.75);
          }

          .gs-wave-one {
            width: 120%;
            height: 80px;
            bottom: 36px;
          }

          .gs-wave-two {
            width: 86%;
            height: 42px;
            bottom: 116px;
            opacity: 0.78;
          }

          .gs-wave-three {
            width: 58%;
            height: 22px;
            bottom: 178px;
            opacity: 0.55;
          }

          .gs-art-caption {
            position: absolute;
            inset: auto 22px 22px;
            border-radius: 28px;
            background: rgba(16, 47, 61, 0.88);
            color: white;
            display: grid;
            gap: 2px;
            padding: 18px;
          }

          .gs-art-caption strong {
            font-size: 1.8rem;
            letter-spacing: -0.05em;
            line-height: 1;
          }

          .gs-art-kicker {
            color: rgba(255, 255, 255, 0.72);
            font-size: 0.72rem;
            font-weight: 900;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .gs-art-card-mini {
            align-items: center;
            border-radius: 22px;
            display: flex;
            gap: 10px;
            font-weight: 950;
            padding: 13px 15px;
            position: absolute;
          }

          .gs-mini-icon {
            align-items: center;
            background: rgba(15, 159, 167, 0.12);
            border-radius: 14px;
            display: inline-flex;
            height: 34px;
            justify-content: center;
            width: 34px;
          }

          .gs-mini-one {
            left: 0;
            top: 26px;
            transform: rotate(-4deg);
          }

          .gs-mini-two {
            bottom: 42px;
            right: 0;
            transform: rotate(5deg);
          }

          .gs-section-heading {
            max-width: 710px;
          }

          .gs-section-heading-center {
            margin: 0 auto 24px;
            text-align: center;
          }

          .gs-section-heading h2,
          .gs-about-copy h2 {
            font-size: clamp(2.15rem, 7vw, 4.2rem);
          }

          .gs-section-heading p:not(.gs-eyebrow),
          .gs-about-copy p {
            color: rgba(16, 47, 61, 0.75);
            font-size: 1.05rem;
            margin: 14px 0 0;
          }

          .gs-quick {
            padding-top: 28px;
          }

          .gs-quick-grid {
            display: grid;
            gap: 14px;
          }

          .gs-quick-card,
          .gs-feature-card,
          .gs-menu-section,
          .gs-about-cards article,
          .gs-hours-card,
          .gs-location-card,
          .gs-owner-notes {
            background: rgba(255, 255, 255, 0.74);
            border: 1px solid rgba(16, 47, 61, 0.12);
            box-shadow: var(--shadow-soft);
          }

          .gs-quick-card {
            border-radius: 28px;
            padding: 22px;
          }

          .gs-quick-icon {
            align-items: center;
            background: linear-gradient(135deg, rgba(255, 184, 77, 0.32), rgba(15, 159, 167, 0.16));
            border-radius: 18px;
            display: inline-flex;
            height: 44px;
            justify-content: center;
            width: 44px;
          }

          .gs-quick-card h3 {
            font-size: 1.18rem;
            letter-spacing: -0.03em;
            margin: 14px 0 5px;
          }

          .gs-quick-card p {
            color: rgba(16, 47, 61, 0.73);
            margin: 0 0 14px;
          }

          .gs-quick-card a {
            color: var(--turquoise-dark);
            font-weight: 950;
            text-decoration: none;
          }

          .gs-featured {
            position: relative;
          }

          .gs-featured::before {
            position: absolute;
            content: '';
            width: 260px;
            height: 260px;
            border-radius: 50%;
            background: rgba(15, 159, 167, 0.1);
            filter: blur(8px);
            right: -120px;
            top: 80px;
          }

          .gs-featured-grid {
            display: grid;
            gap: 14px;
            margin-top: 26px;
            position: relative;
          }

          .gs-feature-card {
            border-radius: 30px;
            display: grid;
            gap: 16px;
            grid-template-columns: auto 1fr;
            padding: 22px;
          }

          .gs-feature-number {
            align-items: center;
            background: var(--navy);
            border-radius: 18px;
            color: white;
            display: inline-flex;
            font-size: 0.8rem;
            font-weight: 950;
            height: 42px;
            justify-content: center;
            width: 42px;
          }

          .gs-card-category {
            color: var(--coral);
            font-size: 0.74rem;
            font-weight: 950;
            letter-spacing: 0.12em;
            margin: 0 0 5px;
            text-transform: uppercase;
          }

          .gs-feature-card h3,
          .gs-menu-item h4,
          .gs-about-cards h3,
          .gs-hours-card h3,
          .gs-location-card h3 {
            color: var(--navy);
            letter-spacing: -0.035em;
            line-height: 1.08;
            margin: 0;
          }

          .gs-feature-card h3 {
            font-size: 1.3rem;
          }

          .gs-feature-card p:not(.gs-card-category):not(.gs-price),
          .gs-menu-item p,
          .gs-about-cards p,
          .gs-location-card p {
            color: rgba(16, 47, 61, 0.72);
            margin: 9px 0 0;
          }

          .gs-badge-list {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            list-style: none;
            margin: 14px 0 0;
            padding: 0;
          }

          .gs-badge-list li {
            background: rgba(255, 184, 77, 0.22);
            border: 1px solid rgba(242, 111, 85, 0.18);
            border-radius: 999px;
            color: #7b3c26;
            font-size: 0.74rem;
            font-weight: 900;
            padding: 5px 9px;
          }

          .gs-price {
            color: var(--espresso);
            font-weight: 950;
            margin-top: 10px;
          }

          .gs-menu {
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(15, 159, 167, 0.06)),
              repeating-linear-gradient(135deg, rgba(16, 47, 61, 0.035) 0 1px, transparent 1px 14px);
            border-block: 1px solid rgba(16, 47, 61, 0.08);
          }

          .gs-menu-top {
            display: grid;
            gap: 18px;
            margin-bottom: 22px;
          }

          .gs-menu-count {
            align-items: center;
            aspect-ratio: 1;
            background: linear-gradient(145deg, var(--turquoise), var(--blue));
            border-radius: 34px;
            color: white;
            display: inline-flex;
            flex-direction: column;
            justify-content: center;
            justify-self: start;
            min-width: 112px;
            padding: 18px;
            box-shadow: 0 18px 36px rgba(15, 159, 167, 0.22);
          }

          .gs-menu-count strong {
            font-size: 2.15rem;
            letter-spacing: -0.06em;
            line-height: 1;
          }

          .gs-menu-count span {
            font-size: 0.75rem;
            font-weight: 950;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .gs-category-nav {
            display: flex;
            gap: 10px;
            margin: 0 -16px 26px;
            overflow-x: auto;
            padding: 0 16px 12px;
            scroll-padding: 16px;
            scrollbar-width: thin;
          }

          .gs-category-nav a {
            align-items: center;
            background: rgba(255, 255, 255, 0.82);
            border: 1px solid rgba(16, 47, 61, 0.12);
            border-radius: 999px;
            box-shadow: 0 8px 20px rgba(16, 47, 61, 0.06);
            display: inline-flex;
            flex: 0 0 auto;
            gap: 8px;
            font-size: 0.88rem;
            font-weight: 950;
            padding: 10px 12px;
            text-decoration: none;
          }

          .gs-category-nav a:hover {
            border-color: rgba(15, 159, 167, 0.38);
            color: var(--turquoise-dark);
          }

          .gs-category-nav span {
            align-items: center;
            background: rgba(15, 159, 167, 0.12);
            border-radius: 999px;
            color: var(--turquoise-dark);
            display: inline-flex;
            font-size: 0.72rem;
            justify-content: center;
            min-width: 24px;
            padding: 2px 6px;
          }

          .gs-menu-sections {
            display: grid;
            gap: 18px;
          }

          .gs-menu-section {
            border-radius: 34px;
            overflow: hidden;
            padding: 20px;
            scroll-margin-top: 96px;
          }

          .gs-menu-section-heading {
            border-bottom: 1px solid rgba(16, 47, 61, 0.1);
            display: grid;
            gap: 14px;
            margin-bottom: 16px;
            padding-bottom: 16px;
          }

          .gs-menu-section-heading h3 {
            font-size: clamp(1.65rem, 5vw, 2.5rem);
            letter-spacing: -0.055em;
            line-height: 1;
            margin: 0;
          }

          .gs-menu-section-heading p {
            color: rgba(16, 47, 61, 0.67);
            margin: 8px 0 0;
          }

          .gs-menu-section-heading span {
            align-self: start;
            background: rgba(242, 111, 85, 0.11);
            border: 1px solid rgba(242, 111, 85, 0.16);
            border-radius: 999px;
            color: #8a3f2c;
            font-size: 0.78rem;
            font-weight: 950;
            justify-self: start;
            padding: 7px 11px;
          }

          .gs-item-grid {
            display: grid;
            gap: 12px;
          }

          .gs-menu-item {
            background: rgba(255, 248, 232, 0.74);
            border: 1px solid rgba(16, 47, 61, 0.08);
            border-radius: 24px;
            display: grid;
            gap: 12px;
            padding: 17px;
          }

          .gs-menu-item h4 {
            font-size: 1.08rem;
          }

          .gs-about-grid {
            display: grid;
            gap: 24px;
          }

          .gs-about-cards {
            display: grid;
            gap: 14px;
          }

          .gs-about-cards article {
            border-radius: 28px;
            padding: 22px;
          }

          .gs-about-cards span {
            align-items: center;
            background: rgba(15, 159, 167, 0.12);
            border-radius: 18px;
            display: inline-flex;
            height: 44px;
            justify-content: center;
            margin-bottom: 14px;
            width: 44px;
          }

          .gs-about-cards h3 {
            font-size: 1.18rem;
          }

          .gs-visit {
            padding-top: 40px;
          }

          .gs-visit-grid {
            display: grid;
            gap: 18px;
          }

          .gs-hours-card,
          .gs-location-card {
            border-radius: 34px;
            padding: 22px;
          }

          .gs-hours-card h3,
          .gs-location-card h3 {
            font-size: 1.42rem;
            margin-bottom: 14px;
          }

          .gs-hours-card dl {
            display: grid;
            gap: 8px;
            margin: 0;
          }

          .gs-hours-card div {
            align-items: center;
            background: rgba(255, 248, 232, 0.75);
            border: 1px solid rgba(16, 47, 61, 0.08);
            border-radius: 16px;
            display: flex;
            justify-content: space-between;
            gap: 14px;
            padding: 10px 12px;
          }

          .gs-hours-card dt {
            font-weight: 900;
          }

          .gs-hours-card dd {
            color: var(--turquoise-dark);
            font-weight: 950;
            margin: 0;
            text-align: right;
          }

          .gs-location-card {
            display: grid;
            gap: 18px;
          }

          .gs-map-art {
            background:
              linear-gradient(135deg, rgba(15, 159, 167, 0.22), rgba(255, 184, 77, 0.24)),
              radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.7), transparent 32%);
            border: 1px solid rgba(16, 47, 61, 0.1);
            border-radius: 28px;
            min-height: 210px;
            overflow: hidden;
            position: relative;
          }

          .gs-map-pin {
            position: absolute;
            left: 50%;
            top: 48%;
            width: 38px;
            height: 38px;
            transform: translate(-50%, -50%) rotate(45deg);
            border-radius: 50% 50% 50% 8px;
            background: var(--coral);
            box-shadow: 0 18px 34px rgba(242, 111, 85, 0.28);
          }

          .gs-map-pin::after {
            position: absolute;
            content: '';
            width: 13px;
            height: 13px;
            background: white;
            border-radius: 50%;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }

          .gs-map-line {
            position: absolute;
            height: 15px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.78);
            transform: rotate(-18deg);
          }

          .gs-map-line-one {
            width: 120%;
            left: -10%;
            top: 25%;
          }

          .gs-map-line-two {
            width: 110%;
            left: -6%;
            bottom: 28%;
          }

          .gs-map-dot {
            position: absolute;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: rgba(16, 47, 61, 0.22);
          }

          .gs-map-dot-one {
            left: 22%;
            bottom: 22%;
          }

          .gs-map-dot-two {
            right: 20%;
            top: 20%;
          }

          .gs-location-card a:not(.gs-cta) {
            color: var(--turquoise-dark);
            font-weight: 950;
            text-decoration: none;
          }

          .gs-location-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 18px;
          }

          .gs-location-actions .gs-cta {
            flex: 1 1 150px;
          }

          .gs-owner-notes {
            border-radius: 28px;
            margin-bottom: 42px;
            padding: 22px;
          }

          .gs-owner-notes h2 {
            font-size: 1.25rem;
            margin: 0 0 10px;
          }

          .gs-owner-notes ul {
            margin: 0;
            padding-left: 20px;
          }

          .gs-footer {
            background: var(--navy);
            color: white;
            padding: 46px 0 98px;
          }

          .gs-footer-grid {
            display: grid;
            gap: 26px;
          }

          .gs-footer h2 {
            font-size: clamp(2rem, 7vw, 3.5rem);
            letter-spacing: -0.06em;
            line-height: 1;
            margin: 0;
          }

          .gs-footer p {
            color: rgba(255, 255, 255, 0.72);
            margin: 12px 0 0;
            max-width: 600px;
          }

          .gs-socials {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 18px;
          }

          .gs-socials a {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 999px;
            font-weight: 950;
            padding: 10px 14px;
            text-decoration: none;
          }

          .gs-socials a:hover {
            background: rgba(255, 255, 255, 0.16);
          }

          .gs-footer address {
            display: grid;
            gap: 7px;
            font-style: normal;
          }

          .gs-footer address strong {
            color: var(--citrus);
            font-size: 1.1rem;
          }

          .gs-footer address span,
          .gs-footer address a {
            color: rgba(255, 255, 255, 0.76);
            text-decoration: none;
          }

          .gs-footer address a {
            font-weight: 950;
          }

          .gs-mobile-actions {
            position: fixed;
            z-index: 80;
            left: 10px;
            right: 10px;
            bottom: 10px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            padding: 8px;
            border: 1px solid rgba(16, 47, 61, 0.14);
            border-radius: 24px;
            background: rgba(255, 248, 232, 0.94);
            box-shadow: 0 18px 50px rgba(16, 47, 61, 0.22);
            backdrop-filter: blur(18px);
          }

          .gs-mobile-actions a {
            align-items: center;
            border-radius: 18px;
            color: var(--navy);
            display: flex;
            flex-direction: column;
            font-size: 0.72rem;
            font-weight: 950;
            gap: 2px;
            justify-content: center;
            min-height: 54px;
            text-decoration: none;
          }

          .gs-mobile-actions a:hover {
            background: rgba(15, 159, 167, 0.1);
          }

          .gs-mobile-actions span {
            color: var(--turquoise-dark);
            font-size: 1rem;
            line-height: 1;
          }

          @media (min-width: 560px) {
            .gs-hero-actions .gs-cta {
              width: auto;
            }

            .gs-hero-facts {
              grid-template-columns: repeat(3, 1fr);
            }

            .gs-quick-grid,
            .gs-featured-grid,
            .gs-item-grid,
            .gs-about-cards {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (min-width: 820px) {
            .gs-site {
              padding-bottom: 0;
            }

            .gs-primary-nav,
            .gs-header-actions {
              display: flex;
            }

            .gs-section {
              padding: 86px 0;
            }

            .gs-hero {
              padding-top: 72px;
            }

            .gs-hero-grid {
              align-items: center;
              grid-template-columns: minmax(0, 1.05fr) minmax(330px, 0.72fr);
            }

            .gs-quick-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            .gs-featured-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            .gs-menu-top {
              align-items: end;
              grid-template-columns: minmax(0, 1fr) auto;
            }

            .gs-menu-count {
              justify-self: end;
            }

            .gs-menu-section {
              padding: 26px;
            }

            .gs-menu-section-heading {
              align-items: start;
              grid-template-columns: 1fr auto;
            }

            .gs-menu-section-heading span {
              justify-self: end;
            }

            .gs-item-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .gs-menu-item {
              align-items: start;
              grid-template-columns: 1fr auto;
              min-height: 154px;
            }

            .gs-about-grid {
              align-items: start;
              grid-template-columns: 0.8fr 1fr;
            }

            .gs-about-cards {
              grid-template-columns: 1fr;
            }

            .gs-visit-grid {
              align-items: start;
              grid-template-columns: minmax(0, 0.9fr) minmax(280px, 0.58fr);
            }

            .gs-visit-grid > .gs-section-heading {
              grid-column: 1 / -1;
            }

            .gs-location-card {
              grid-template-columns: minmax(220px, 0.75fr) 1fr;
            }

            .gs-mobile-actions {
              display: none;
            }

            .gs-footer {
              padding-bottom: 48px;
            }

            .gs-footer-grid {
              align-items: start;
              grid-template-columns: 1fr auto;
            }
          }

          @media (min-width: 1040px) {
            .gs-about-cards {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }

          @media (prefers-reduced-motion: reduce) {
            :root {
              scroll-behavior: auto;
            }

            .gs-link-button,
            .gs-cta {
              transition: none;
            }

            .gs-link-button:hover,
            .gs-cta:hover {
              transform: none;
            }
          }
        `}</style>
      </div>
    </>
  );
}
