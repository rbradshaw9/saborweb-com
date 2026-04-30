'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';

type PreviewGateLang = 'en' | 'es';
type PreviewGateMode = 'live' | 'preview' | string;

type PreviewGateProps = {
  children: ReactNode;
  mode: PreviewGateMode;
  lang?: PreviewGateLang | string;
  claimHref: string;
};

const COPY = {
  en: {
    banner: 'Preview site by Sabor Web',
    preview: 'Preview',
    heading: 'Your preview is ready',
    body: 'Review the site, then claim it when you are ready to launch.',
    enter: 'Enter preview',
    claim: 'Claim this site',
    dismiss: 'Dismiss preview message',
  },
  es: {
    banner: 'Preview por Sabor Web',
    preview: 'Preview',
    heading: 'Tu preview esta listo',
    body: 'Revisa la pagina y reclamala cuando estes listo para lanzarla.',
    enter: 'Entrar al preview',
    claim: 'Reclamar este sitio',
    dismiss: 'Cerrar mensaje de preview',
  },
} as const;

export function PreviewGate({ children, mode, lang = 'en', claimHref }: PreviewGateProps) {
  const [entered, setEntered] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const isPreview = String(mode).toLowerCase() === 'preview';
  const copy = String(lang).toLowerCase().startsWith('es') ? COPY.es : COPY.en;

  if (!isPreview) return children;

  return (
    <>
      {bannerVisible ? (
        <div className="sw-preview-banner" role="banner">
          <span>{copy.banner}</span>
          <div className="sw-preview-banner__actions">
            <Link href={claimHref}>{copy.claim}</Link>
            <button aria-label={copy.dismiss} type="button" onClick={() => setBannerVisible(false)}>
              ×
            </button>
          </div>
        </div>
      ) : null}

      {!entered ? (
        <div className="sw-preview-overlay">
          <section className="sw-preview-dialog" aria-labelledby="sw-preview-title">
            <p>{copy.preview}</p>
            <h2 id="sw-preview-title">{copy.heading}</h2>
            <span>{copy.body}</span>
            <div>
              <button type="button" onClick={() => setEntered(true)}>
                {copy.enter}
              </button>
              <Link href={claimHref}>{copy.claim}</Link>
            </div>
          </section>
        </div>
      ) : null}

      {children}

      <style jsx>{`
        .sw-preview-banner {
          position: sticky;
          top: 0;
          z-index: 9999;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: #ba4f32;
          color: #fffaf2;
          padding: 8px 18px;
          font: 800 13px/1.2 Inter, ui-sans-serif, system-ui, sans-serif;
          letter-spacing: 0;
        }

        .sw-preview-banner__actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sw-preview-banner a,
        .sw-preview-banner button {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 250, 242, 0.3);
          border-radius: 4px;
          background: rgba(20, 16, 12, 0.2);
          color: #fffaf2;
          padding: 0 10px;
          font: inherit;
          text-decoration: none;
          cursor: pointer;
        }

        .sw-preview-banner button {
          width: 30px;
          padding: 0;
          font-size: 18px;
          line-height: 1;
        }

        .sw-preview-overlay {
          position: fixed;
          inset: 0;
          z-index: 9998;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(20, 16, 12, 0.32);
          backdrop-filter: blur(3px);
          pointer-events: none;
        }

        .sw-preview-dialog {
          width: min(460px, 100%);
          border: 1px solid rgba(28, 20, 14, 0.12);
          border-radius: 8px;
          background: #fffaf2;
          color: #1d1712;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
          padding: 24px;
          pointer-events: auto;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        }

        .sw-preview-dialog p {
          margin: 0;
          color: #ba4f32;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .sw-preview-dialog h2 {
          margin: 8px 0 0;
          font-size: 32px;
          line-height: 1;
          letter-spacing: 0;
        }

        .sw-preview-dialog span {
          display: block;
          margin: 12px 0 0;
          color: #6d625b;
          line-height: 1.55;
        }

        .sw-preview-dialog div {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .sw-preview-dialog button,
        .sw-preview-dialog a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          padding: 0 16px;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
        }

        .sw-preview-dialog button {
          border: 0;
          background: #ba4f32;
          color: #fffaf2;
        }

        .sw-preview-dialog a {
          border: 1px solid rgba(28, 20, 14, 0.14);
          color: #1d1712;
        }
      `}</style>
    </>
  );
}
