import Link from 'next/link';
import type { RenderLanguage, RenderViewMode, SiteRenderPayload } from '@/lib/site-rendering';

/* eslint-disable @next/next/no-img-element */

type RestaurantSiteRendererProps = {
  payload: SiteRenderPayload;
  mode: RenderViewMode;
  lang: RenderLanguage;
};

type ThemePalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  accent: string;
  accentStrong: string;
  border: string;
};

const COPY = {
  en: {
    previewLabel: 'Preview mode',
    previewText: 'This is the current staged version of the restaurant site.',
    previewCta: 'Claim this site',
    menuHeading: 'Menu',
    menuCta: 'View menu',
    storyHeading: 'Why Guests Come Back',
    detailsHeading: 'Plan Your Visit',
    galleryHeading: 'From the Restaurant',
    hoursHeading: 'Hours',
    contactHeading: 'Contact',
    directionsLabel: 'Directions',
    orderLabel: 'Ordering',
    reserveLabel: 'Reservations',
    socialHeading: 'Stay Connected',
    noPhotos: 'Visual assets are being finalized for this restaurant.',
    menuMissing: 'Menu details are still being finalized.',
    footerNote: 'Restaurant details are managed through SaborWeb.',
  },
  es: {
    previewLabel: 'Modo preview',
    previewText: 'Esta es la version actualmente preparada del sitio del restaurante.',
    previewCta: 'Reclamar este sitio',
    menuHeading: 'Menu',
    menuCta: 'Ver menu',
    storyHeading: 'Por Que Regresan Los Clientes',
    detailsHeading: 'Planifica Tu Visita',
    galleryHeading: 'Desde El Restaurante',
    hoursHeading: 'Horario',
    contactHeading: 'Contacto',
    directionsLabel: 'Como llegar',
    orderLabel: 'Ordenar',
    reserveLabel: 'Reservas',
    socialHeading: 'Mantente Conectado',
    noPhotos: 'Los recursos visuales de este restaurante todavia se estan afinando.',
    menuMissing: 'Los detalles del menu todavia se estan afinando.',
    footerNote: 'Los detalles del restaurante se administran con SaborWeb.',
  },
} as const;

const THEMES: Record<SiteRenderPayload['brand']['themePreset'], ThemePalette> = {
  coastal_bright: {
    background: '#f5f0e8',
    surface: '#fffaf3',
    surfaceAlt: '#ede3d3',
    text: '#1e1712',
    muted: '#6a5d52',
    accent: '#c65b38',
    accentStrong: '#8f3215',
    border: '#dccab3',
  },
  tropical_modern: {
    background: '#eff4f1',
    surface: '#f9fcfa',
    surfaceAlt: '#dceae4',
    text: '#14201b',
    muted: '#54665f',
    accent: '#23795d',
    accentStrong: '#0f5941',
    border: '#bfd6cc',
  },
  sunny_editorial: {
    background: '#f4efe5',
    surface: '#fbf7ef',
    surfaceAlt: '#ece1c9',
    text: '#21180e',
    muted: '#6d604f',
    accent: '#b38226',
    accentStrong: '#8c5f0a',
    border: '#ddcfb0',
  },
  classic_neutral: {
    background: '#eff2f8',
    surface: '#f9fbff',
    surfaceAlt: '#dde4f2',
    text: '#171d29',
    muted: '#5b677d',
    accent: '#4267b2',
    accentStrong: '#27498c',
    border: '#c5d0e5',
  },
};

const FONT_STACKS: Record<SiteRenderPayload['brand']['fontPreset'], string> = {
  clean_sans: 'Inter, system-ui, sans-serif',
  editorial_serif: '"Fraunces", "Iowan Old Style", "Palatino Linotype", Georgia, serif',
  friendly_modern: '"Avenir Next", Inter, system-ui, sans-serif',
  coastal_mix: '"Canela", "Cormorant Garamond", Georgia, serif',
};

function compactHours(hours: string[]) {
  return hours.slice(0, 7);
}

function sectionId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default function RestaurantSiteRenderer({ payload, mode, lang }: RestaurantSiteRendererProps) {
  const theme = THEMES[payload.brand.themePreset] ?? THEMES.classic_neutral;
  const copy = COPY[lang];
  const galleryImages = [payload.media.heroImageUrl, ...payload.media.galleryImageUrls].filter(
    (value): value is string => Boolean(value),
  );
  const ctaLinks = [
    payload.actions.primaryHref
      ? { label: payload.actions.primaryLabel ?? copy.menuCta, href: payload.actions.primaryHref, primary: true }
      : null,
    payload.actions.secondaryHref
      ? { label: payload.actions.secondaryLabel ?? copy.directionsLabel, href: payload.actions.secondaryHref, primary: false }
      : null,
    mode === 'preview' && payload.actions.claimHref
      ? { label: copy.previewCta, href: payload.actions.claimHref, primary: false }
      : null,
  ].filter((item): item is { label: string; href: string; primary: boolean } => Boolean(item));

  const hourRows = compactHours(payload.restaurant.hours);
  const accentGlow = `${theme.accent}22`;
  const textMark = payload.brand.logoText
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join('');

  return (
    <div
      style={{
        background: theme.background,
        color: theme.text,
        minHeight: '100vh',
        fontFamily: FONT_STACKS[payload.brand.fontPreset] ?? FONT_STACKS.clean_sans,
      }}
    >
      {mode === 'preview' ? (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: theme.accentStrong,
            color: '#fff',
            padding: '12px 20px',
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              maxWidth: 1120,
              margin: '0 auto',
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span
                style={{
                  border: '1px solid rgba(255,255,255,0.35)',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {copy.previewLabel}
              </span>
              <span style={{ fontSize: 14, opacity: 0.92 }}>{copy.previewText}</span>
            </div>
            {payload.actions.claimHref ? (
              <Link
                href={payload.actions.claimHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 42,
                  padding: '0 16px',
                  borderRadius: 6,
                  background: '#fff',
                  color: theme.accentStrong,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                {copy.previewCta}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <section style={{ padding: mode === 'preview' ? '48px 20px 24px' : '72px 20px 24px' }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gap: 24,
            gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)',
          }}
        >
          <div style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
            {payload.brand.eyebrow ? (
              <p
                style={{
                  margin: 0,
                  color: theme.accentStrong,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontSize: 12,
                }}
              >
                {payload.brand.eyebrow}
              </p>
            ) : null}
            <div style={{ display: 'grid', gap: 12 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(2.6rem, 5vw, 5.2rem)',
                  lineHeight: 0.95,
                }}
              >
                {payload.brand.headline}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
                  lineHeight: 1.6,
                  color: theme.muted,
                  maxWidth: 620,
                }}
              >
                {payload.brand.summary}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {ctaLinks.map((link) => (
                <Link
                  key={`${link.label}:${link.href}`}
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 48,
                    padding: '0 18px',
                    borderRadius: 6,
                    fontWeight: 700,
                    textDecoration: 'none',
                    background: link.primary ? theme.accent : theme.surface,
                    color: link.primary ? '#fff' : theme.text,
                    border: `1px solid ${link.primary ? theme.accent : theme.border}`,
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {payload.sections.experienceBullets.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                }}
              >
                {payload.sections.experienceBullets.slice(0, 4).map((bullet) => (
                  <div
                    key={bullet}
                    style={{
                      padding: '16px 18px',
                      borderRadius: 8,
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      minHeight: 84,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>{bullet}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              overflow: 'hidden',
              minHeight: 360,
              display: 'grid',
            }}
          >
            {payload.media.heroImageUrl ? (
              <img
                src={payload.media.heroImageUrl}
                alt={`${payload.restaurant.name} hero`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 360 }}
              />
            ) : (
              <div
                style={{
                  padding: 28,
                  display: 'grid',
                  gap: 20,
                  alignContent: 'space-between',
                  background: `linear-gradient(180deg, ${theme.surfaceAlt} 0%, ${theme.surface} 100%)`,
                }}
              >
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 28,
                    fontWeight: 800,
                    background: accentGlow,
                    color: theme.accentStrong,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  {textMark || payload.restaurant.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{payload.brand.logoUrl ? payload.brand.logoText : copy.noPhotos}</p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 10,
                    }}
                  >
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        style={{
                          aspectRatio: '1 / 1',
                          borderRadius: 8,
                          background: index === 1 ? accentGlow : theme.background,
                          border: `1px solid ${theme.border}`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{ padding: '8px 20px 24px' }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          <div style={{ padding: 20, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8 }}>
            <p style={{ margin: 0, color: theme.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {copy.contactHeading}
            </p>
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {payload.restaurant.address ? <p style={{ margin: 0 }}>{payload.restaurant.address}</p> : null}
              {payload.restaurant.phone ? (
                <a href={payload.actions.primaryHref?.startsWith('tel:') ? payload.actions.primaryHref : `tel:${payload.restaurant.phone}`} style={{ color: theme.text }}>
                  {payload.restaurant.phone}
                </a>
              ) : null}
              {payload.restaurant.mapsUrl ? (
                <a href={payload.restaurant.mapsUrl} target="_blank" rel="noreferrer" style={{ color: theme.accentStrong, fontWeight: 600 }}>
                  {copy.directionsLabel}
                </a>
              ) : null}
            </div>
          </div>

          <div style={{ padding: 20, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8 }}>
            <p style={{ margin: 0, color: theme.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {copy.hoursHeading}
            </p>
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {hourRows.length ? hourRows.map((hour) => <p key={hour} style={{ margin: 0 }}>{hour}</p>) : <p style={{ margin: 0, color: theme.muted }}>Hours coming soon.</p>}
            </div>
          </div>

          <div style={{ padding: 20, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8 }}>
            <p style={{ margin: 0, color: theme.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {copy.socialHeading}
            </p>
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {payload.actions.socialLinks.length ? (
                payload.actions.socialLinks.map((link) => (
                  <a key={`${link.label}:${link.href}`} href={link.href} target="_blank" rel="noreferrer" style={{ color: theme.text }}>
                    {link.label}
                  </a>
                ))
              ) : (
                <p style={{ margin: 0, color: theme.muted }}>Social links coming soon.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '24px 20px' }} id={sectionId(copy.storyHeading)}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gap: 18,
          }}
        >
          <div style={{ maxWidth: 680 }}>
            <p
              style={{
                margin: 0,
                color: theme.accentStrong,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: 12,
              }}
            >
              {payload.sections.aboutTitle ?? copy.storyHeading}
            </p>
            <h2 style={{ margin: '8px 0 0', fontSize: 'clamp(1.8rem, 3vw, 3rem)' }}>{payload.restaurant.name}</h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {payload.sections.aboutBullets.length ? (
              payload.sections.aboutBullets.slice(0, 4).map((bullet) => (
                <div key={bullet} style={{ padding: 22, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8 }}>
                  <p style={{ margin: 0, lineHeight: 1.65 }}>{bullet}</p>
                </div>
              ))
            ) : (
              <div style={{ padding: 22, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8 }}>
                <p style={{ margin: 0, lineHeight: 1.65 }}>{payload.brand.summary}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {payload.sections.extraSections.map((section) => (
        <section key={section.id} style={{ padding: '24px 20px' }} id={sectionId(section.id)}>
          <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 18 }}>
            <div>
              <p
                style={{
                  margin: 0,
                  color: theme.accentStrong,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontSize: 12,
                }}
              >
                {section.title}
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              {section.body.map((paragraph) => (
                <div key={paragraph} style={{ padding: 22, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8 }}>
                  <p style={{ margin: 0, lineHeight: 1.65 }}>{paragraph}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section style={{ padding: '24px 20px', background: theme.surfaceAlt }} id={sectionId(copy.menuHeading)}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            alignItems: 'end',
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <p
              style={{
                margin: 0,
                color: theme.accentStrong,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: 12,
              }}
            >
              {copy.menuHeading}
            </p>
            <h2 style={{ margin: '8px 0 10px', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>
              {payload.sections.menuNote ?? copy.menuMissing}
            </h2>
            {payload.menu.summaryLines.length ? (
              <p style={{ margin: 0, color: theme.muted, lineHeight: 1.65 }}>{payload.menu.summaryLines[0]}</p>
            ) : payload.brand.notes.length ? (
              <p style={{ margin: 0, color: theme.muted, lineHeight: 1.65 }}>{payload.brand.notes[0]}</p>
            ) : null}
          </div>
          {payload.menu.sourceUrl ? (
            <Link
              href={payload.menu.sourceUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 48,
                padding: '0 18px',
                borderRadius: 6,
                textDecoration: 'none',
                background: theme.accent,
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {copy.menuCta}
            </Link>
          ) : null}
        </div>
        {payload.menu.categories.length ? (
          <div
            style={{
              maxWidth: 1120,
              margin: '22px auto 0',
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            }}
          >
            {payload.menu.categories.map((category) => (
              <div
                key={category.name}
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  padding: 18,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{category.name}</h3>
                  {category.description ? (
                    <p style={{ margin: '8px 0 0', color: theme.muted, lineHeight: 1.55 }}>{category.description}</p>
                  ) : null}
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {category.items.slice(0, 8).map((item) => (
                    <div key={`${category.name}:${item.name}`} style={{ display: 'grid', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                        <p style={{ margin: 0, fontWeight: 700 }}>{item.name}</p>
                        {item.priceText ? (
                          <p style={{ margin: 0, color: theme.accentStrong, fontWeight: 700, whiteSpace: 'nowrap' }}>{item.priceText}</p>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p style={{ margin: 0, color: theme.muted, lineHeight: 1.55 }}>{item.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {galleryImages.length ? (
        <section style={{ padding: '24px 20px' }} id={sectionId(copy.galleryHeading)}>
          <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 18 }}>
            <div>
              <p
                style={{
                  margin: 0,
                  color: theme.accentStrong,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontSize: 12,
                }}
              >
                {copy.galleryHeading}
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
              }}
            >
              {galleryImages.slice(0, 6).map((imageUrl, index) => (
                <div
                  key={`${imageUrl}:${index}`}
                  style={{
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: `1px solid ${theme.border}`,
                    background: theme.surface,
                    aspectRatio: index === 0 ? '16 / 11' : '1 / 1',
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={`${payload.restaurant.name} gallery ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section style={{ padding: '24px 20px 56px' }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            paddingTop: 20,
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <p style={{ margin: 0, color: theme.muted }}>{copy.footerNote}</p>
          {payload.restaurant.rating ? (
            <p style={{ margin: 0, fontWeight: 700, color: theme.accentStrong }}>
              {payload.restaurant.rating.toFixed(1)} rating
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
