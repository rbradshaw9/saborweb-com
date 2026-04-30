'use client';

import Link from 'next/link';
import { PreviewGate } from '@/components/PreviewGate';
import type { GeneratedSiteManifest } from '@/lib/generated-sites';
import type { RenderLanguage, RenderViewMode } from '@/lib/site-rendering';

/* eslint-disable @next/next/no-img-element */

type Props = {
  manifest: GeneratedSiteManifest;
  mode: RenderViewMode;
  lang: RenderLanguage;
};

const COPY = {
  en: {
    claim: 'Claim this site',
    menu: 'Menu',
    visit: 'Visit',
    hours: 'Hours',
    assumptions: 'Owner confirmation',
    directions: 'Directions',
    call: 'Call',
    social: 'Social',
  },
  es: {
    claim: 'Reclamar este sitio',
    menu: 'Menu',
    visit: 'Visita',
    hours: 'Horario',
    assumptions: 'Confirmacion del dueno',
    directions: 'Como llegar',
    call: 'Llamar',
    social: 'Social',
  },
} as const;

function palette(manifest: GeneratedSiteManifest) {
  const joined = [...manifest.brand.colors, ...manifest.brand.mood, manifest.restaurant.cuisine ?? ''].join(' ').toLowerCase();
  if (/coastal|beach|mar|ocean|sea|isabela|aguadilla/.test(joined)) {
    return {
      bg: '#f4f0e8',
      surface: '#fffaf1',
      text: '#1d1712',
      muted: '#6e6259',
      accent: '#1c6f75',
      accentText: '#fffaf1',
      line: '#dfd2bf',
    };
  }
  if (/tropical|juice|smoothie|fruit|bright|color/.test(joined)) {
    return {
      bg: '#eef5ee',
      surface: '#fbfff9',
      text: '#142116',
      muted: '#58705e',
      accent: '#d24f2f',
      accentText: '#fffaf1',
      line: '#c7ddc9',
    };
  }
  return {
    bg: '#f5f1e9',
    surface: '#fffaf2',
    text: '#21180f',
    muted: '#706151',
    accent: '#9c4f2f',
    accentText: '#fffaf1',
    line: '#ddceb8',
  };
}

function sectionId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default function GeneratedRestaurantSite({ manifest, mode, lang }: Props) {
  const copy = COPY[lang];
  const theme = palette(manifest);
  const gallery = [manifest.assets.heroImageUrl, ...manifest.assets.galleryImageUrls]
    .filter((item): item is string => Boolean(item))
    .filter((item, index, values) => values.indexOf(item) === index);
  const primaryHref = manifest.actions.primaryHref ?? '#menu';

  return (
    <PreviewGate claimHref={manifest.actions.claimHref} lang={lang} mode={mode}>
    <main style={{ minHeight: '100vh', background: theme.bg, color: theme.text }}>
      <div id="site">
        <section style={{ padding: '64px 20px 36px' }}>
          <div
            style={{
              maxWidth: 1160,
              margin: '0 auto',
              display: 'grid',
              gap: 28,
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {manifest.brand.logoUrl ? (
                  <img src={manifest.brand.logoUrl} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} />
                ) : null}
                <p style={{ margin: 0, color: theme.accent, fontWeight: 900, textTransform: 'uppercase', fontSize: 12 }}>
                  {manifest.brand.eyebrow ?? [manifest.restaurant.cuisine, manifest.restaurant.city].filter(Boolean).join(' / ')}
                </p>
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(2.8rem, 6vw, 5.8rem)', lineHeight: 0.92 }}>
                {manifest.brand.headline}
              </h1>
              <p style={{ margin: 0, color: theme.muted, fontSize: 20, lineHeight: 1.55, maxWidth: 680 }}>
                {manifest.brand.subheadline}
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a
                  href={primaryHref}
                  style={{
                    minHeight: 48,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    background: theme.accent,
                    color: theme.accentText,
                    padding: '0 18px',
                    fontWeight: 900,
                    textDecoration: 'none',
                  }}
                >
                  {manifest.actions.primaryLabel}
                </a>
                {manifest.actions.secondaryHref ? (
                  <a
                    href={manifest.actions.secondaryHref}
                    style={{
                      minHeight: 48,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 6,
                      border: `1px solid ${theme.line}`,
                      color: theme.text,
                      padding: '0 18px',
                      fontWeight: 900,
                      textDecoration: 'none',
                    }}
                  >
                    {manifest.actions.secondaryLabel ?? copy.directions}
                  </a>
                ) : null}
              </div>
            </div>
            <div
              style={{
                minHeight: 420,
                borderRadius: 8,
                overflow: 'hidden',
                background: theme.surface,
                border: `1px solid ${theme.line}`,
              }}
            >
              {manifest.assets.heroImageUrl ? (
                <img src={manifest.assets.heroImageUrl} alt="" style={{ width: '100%', height: '100%', minHeight: 420, objectFit: 'cover' }} />
              ) : (
                <div style={{ minHeight: 420, display: 'grid', placeItems: 'center', padding: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 44 }}>{manifest.restaurant.name}</h2>
                </div>
              )}
            </div>
          </div>
        </section>

        <section style={{ padding: '34px 20px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gap: 16 }}>
            {manifest.content.sections.slice(0, 4).map((section) => (
              <article key={section.id} id={sectionId(section.id)} style={{ borderTop: `1px solid ${theme.line}`, paddingTop: 22 }}>
                <h2 style={{ margin: 0, fontSize: 32 }}>{section.title}</h2>
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  {section.body.slice(0, 4).map((line) => (
                    <p key={line} style={{ margin: 0, color: theme.muted, lineHeight: 1.6 }}>{line}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="menu" style={{ padding: '34px 20px', background: theme.surface }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <h2 style={{ margin: 0, fontSize: 42 }}>{copy.menu}</h2>
            {manifest.menu.note ? <p style={{ color: theme.muted }}>{manifest.menu.note}</p> : null}
            <div style={{ display: 'grid', gap: 18, marginTop: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
              {manifest.menu.categories.length ? manifest.menu.categories.slice(0, 8).map((category) => (
                <article key={category.name} style={{ border: `1px solid ${theme.line}`, borderRadius: 8, padding: 18, background: theme.bg }}>
                  <h3 style={{ margin: 0, fontSize: 24 }}>{category.name}</h3>
                  {category.description ? <p style={{ color: theme.muted }}>{category.description}</p> : null}
                  <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                    {category.items.slice(0, 8).map((item) => (
                      <div key={`${category.name}-${item.name}`} style={{ display: 'grid', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <strong>{item.name}</strong>
                          {item.priceText ? <span>{item.priceText}</span> : null}
                        </div>
                        {item.description ? <span style={{ color: theme.muted, lineHeight: 1.45 }}>{item.description}</span> : null}
                      </div>
                    ))}
                  </div>
                </article>
              )) : <p style={{ color: theme.muted }}>{manifest.content.summary}</p>}
            </div>
          </div>
        </section>

        <section style={{ padding: '34px 20px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
            <article>
              <h2>{copy.visit}</h2>
              {manifest.restaurant.address ? <p>{manifest.restaurant.address}</p> : null}
              {manifest.restaurant.phone ? <p>{manifest.restaurant.phone}</p> : null}
              {manifest.restaurant.mapsUrl ? <a href={manifest.restaurant.mapsUrl}>{copy.directions}</a> : null}
            </article>
            <article>
              <h2>{copy.hours}</h2>
              {manifest.restaurant.hours.length ? manifest.restaurant.hours.slice(0, 7).map((hour) => <p key={hour}>{hour}</p>) : <p style={{ color: theme.muted }}>Hours are being confirmed.</p>}
            </article>
            {manifest.content.assumptions.length ? (
              <article>
                <h2>{copy.assumptions}</h2>
                {manifest.content.assumptions.slice(0, 5).map((assumption) => <p key={assumption} style={{ color: theme.muted }}>{assumption}</p>)}
              </article>
            ) : null}
          </div>
        </section>

        {gallery.length > 1 ? (
          <section style={{ padding: '34px 20px', background: theme.surface }}>
            <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {gallery.slice(1, 7).map((image) => (
                <img key={image} src={image} alt="" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 8 }} />
              ))}
            </div>
          </section>
        ) : null}

        <footer style={{ padding: '28px 20px', borderTop: `1px solid ${theme.line}` }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <strong>{manifest.restaurant.name}</strong>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {manifest.actions.socialLinks.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
              {mode === 'preview' ? <Link href={manifest.actions.claimHref}>{copy.claim}</Link> : null}
            </div>
          </div>
        </footer>
      </div>
    </main>
    </PreviewGate>
  );
}
