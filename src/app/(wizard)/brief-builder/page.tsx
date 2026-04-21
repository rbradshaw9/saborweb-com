'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import {
  FEATURE_OPTIONS,
  FONT_MOOD_OPTIONS,
  PHOTO_DIRECTION_OPTIONS,
  STYLE_OPTIONS,
} from '@/lib/intake/shared';
import { ANALYTICS_EVENTS, track } from '@/lib/analytics';
import { useLanguage } from '@/lib/LanguageContext';

/* ─── Types ──────────────────────────────────────────────────────────────── */

type BriefBuilderState = {
  ownerName: string;
  restaurantName: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
  address: string;
  neighborhood: string;
  cuisine: string;
  currentWebsite: string;
  googleBusinessUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  otherSocialLinks: string;
  menuUrl: string;
  menuSource: string;
  menuNotes: string;
  menuHighlights: string;
  menuCategories: string;
  priceAccuracy: string;
  hours: string;
  orderingUrl: string;
  reservationsUrl: string;
  domainStatus: string;
  brandStyle: string;
  fontMood: string;
  photoDirection: string;
  colorNotes: string;
  brandVoice: string;
  visualReferences: string;
  avoidStyles: string;
  brandNotes: string;
  idealGuest: string;
  differentiators: string;
  ownerGoals: string;
  primaryAction: string;
  secondaryAction: string;
  mustHavePages: string;
  launchUrgency: string;
  launchNotes: string;
  logoStatus: string;
  photoStatus: string;
  assetLinks: string;
  featureRequests: string[];
};

const INITIAL_FORM: BriefBuilderState = {
  ownerName: '',
  restaurantName: '',
  phone: '',
  email: '',
  city: '',
  notes: '',
  address: '',
  neighborhood: '',
  cuisine: '',
  currentWebsite: '',
  googleBusinessUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  otherSocialLinks: '',
  menuUrl: '',
  menuSource: '',
  menuNotes: '',
  menuHighlights: '',
  menuCategories: '',
  priceAccuracy: '',
  hours: '',
  orderingUrl: '',
  reservationsUrl: '',
  domainStatus: '',
  brandStyle: '',
  fontMood: '',
  photoDirection: '',
  colorNotes: '',
  brandVoice: '',
  visualReferences: '',
  avoidStyles: '',
  brandNotes: '',
  idealGuest: '',
  differentiators: '',
  ownerGoals: '',
  primaryAction: '',
  secondaryAction: '',
  mustHavePages: '',
  launchUrgency: '',
  launchNotes: '',
  logoStatus: '',
  photoStatus: '',
  assetLinks: '',
  featureRequests: [],
};

type CreatedRequest = { token: string; clientSlug: string };
type ResumeRequest = {
  owner_name?: string;
  restaurant_name?: string;
  phone?: string;
  email?: string | null;
  city?: string;
  notes?: string | null;
  instagram_url?: string | null;
  google_url?: string | null;
  website_url?: string | null;
  client_slug?: string;
  preferred_language?: 'en' | 'es';
};
type ResumeIntake = Partial<BriefBuilderState> & {
  status?: string;
  lastStep?: number;
};

/* ─── Chip ───────────────────────────────────────────────────────────────── */

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`wz-chip ${selected ? 'wz-chip--selected' : ''}`}
      aria-pressed={selected}
    >
      {selected && <CheckCircle size={13} strokeWidth={2.5} />}
      {label}
    </button>
  );
}

function ChipSingle({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="wz-chip-grid">
      {options.map((opt) => (
        <Chip
          key={opt}
          label={opt}
          selected={value === opt}
          onClick={() => onChange(value === opt ? '' : opt)}
        />
      ))}
    </div>
  );
}

function clampStep(value: string | null) {
  const parsed = Number.parseInt(value ?? '1', 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(parsed, 0), 5);
}

function syncWizardUrl(token: string, nextStep: number) {
  const url = new URL(window.location.href);
  url.searchParams.set('token', token);
  url.searchParams.set('step', String(nextStep));
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDraftPayloadForStep(step: number, form: BriefBuilderState) {
  switch (step) {
    case 1:
      return {
        address: form.address,
        neighborhood: form.neighborhood,
        cuisine: form.cuisine,
        hours: form.hours,
      };
    case 2:
      return {
        menuUrl: form.menuUrl,
        orderingUrl: form.orderingUrl,
        reservationsUrl: form.reservationsUrl,
        menuNotes: form.menuNotes,
        menuHighlights: form.menuHighlights,
      };
    case 3:
      return {
        brandStyle: form.brandStyle,
        fontMood: form.fontMood,
        photoDirection: form.photoDirection,
        colorNotes: form.colorNotes,
        visualReferences: form.visualReferences,
      };
    case 4:
      return {
        primaryAction: form.primaryAction,
        featureRequests: form.featureRequests,
        idealGuest: form.idealGuest,
        ownerGoals: form.ownerGoals,
      };
    case 5:
      return {
        logoStatus: form.logoStatus,
        photoStatus: form.photoStatus,
        assetLinks: splitLines(form.assetLinks),
      };
    default:
      return {};
  }
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function errorMessageFromResponse(data: unknown, fallback: string) {
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return data.error;
  }
  return fallback;
}

function mergeResumeData(request: ResumeRequest, intake: ResumeIntake | null) {
  const intakeData = intake ?? {};
  const featureRequests = Array.isArray(intake?.featureRequests)
    ? intake.featureRequests.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    ...intakeData,
    ownerName: stringValue(request.owner_name),
    restaurantName: stringValue(request.restaurant_name),
    phone: stringValue(request.phone),
    email: stringValue(request.email),
    city: stringValue(request.city),
    notes: stringValue(request.notes),
    instagramUrl: stringValue(intakeData.instagramUrl) || stringValue(request.instagram_url),
    googleBusinessUrl: stringValue(intakeData.googleBusinessUrl) || stringValue(request.google_url),
    currentWebsite: stringValue(intakeData.currentWebsite) || stringValue(request.website_url),
    featureRequests,
  };
}

/* ─── Main ───────────────────────────────────────────────────────────────── */

export default function BriefBuilderPage() {
  const { lang, setLang } = useLanguage();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BriefBuilderState>(INITIAL_FORM);
  const [createdRequest, setCreatedRequest] = useState<CreatedRequest | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'complete' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showLinks, setShowLinks] = useState(false);

  const TOTAL_STEPS = 6;

  const copy = useMemo(
    () =>
      ({
        en: {
          brand: 'Sabor Web',
          exitLabel: 'Back to site',
          langSwitch: 'Español',
          langTarget: 'es' as const,
          stepLabels: ['Contact', 'Restaurant', 'Menu', 'Look & Feel', 'Goals', 'Assets'],
          next: 'Continue',
          back: 'Back',
          submit: 'Submit',
          saving: 'Saving…',
          error: 'Something went wrong. Please try again.',
          requiredError: 'Please fill out your name, restaurant, phone, and city before continuing.',
          draftWarning: 'We could not save this step, but you can keep going.',
          complete: 'You\'re all set.',
          completeSub: 'We\'ll use this to build your preview. Expect to hear from us within 1–2 business days.',

          step0: {
            heading: 'Let\'s get started.',
            sub: 'Your info so we can reach you.',
          },
          step1: {
            heading: 'Your restaurant.',
            sub: 'A few basics so we know what we\'re building.',
          },
          step2: {
            heading: 'Your menu.',
            sub: 'Don\'t have everything? That\'s fine — we research the rest.',
          },
          step3: {
            heading: 'Look & feel.',
            sub: 'Pick what resonates. You can change it later.',
            styleLabel: 'Overall vibe',
            fontLabel: 'Typography',
            photoLabel: 'Imagery',
          },
          step4: {
            heading: 'What should it do?',
            sub: 'Help us build for your actual goals.',
            primaryActionLabel: 'When someone visits, they should…',
            featuresLabel: 'Must-have features',
            primaryActions: ['Call us', 'WhatsApp', 'Order online', 'Make a reservation', 'Get directions', 'View the menu'],
          },
          step5: {
            heading: 'Almost done.',
            sub: 'Tell us what you have, and we\'ll fill in the rest.',
            logoLabel: 'Do you have a logo?',
            logoOptions: ['Yes, ready to share', 'Yes, need to find it', 'No logo yet'],
            photoLabel: 'Do you have photos?',
            photoOptions: ['Yes, great ones', 'Some, not great', 'No photos yet'],
            uploadLabel: 'Upload files (logo, photos, menu PDF)',
            researchNote: 'We\'ll also check your Instagram, Google, and Facebook to build the most complete preview possible.',
          },
        },
        es: {
          brand: 'Sabor Web',
          exitLabel: 'Volver al sitio',
          langSwitch: 'English',
          langTarget: 'en' as const,
          stepLabels: ['Contacto', 'Restaurante', 'Menú', 'Estilo', 'Objetivos', 'Assets'],
          next: 'Continuar',
          back: 'Atrás',
          submit: 'Enviar',
          saving: 'Guardando…',
          error: 'Algo salió mal. Intenta de nuevo.',
          requiredError: 'Completa tu nombre, restaurante, teléfono y pueblo antes de continuar.',
          draftWarning: 'No pudimos guardar este paso, pero puedes continuar.',
          complete: 'Listo.',
          completeSub: 'Usaremos esto para construir tu preview. Te contactamos en 1–2 días hábiles.',

          step0: {
            heading: 'Empecemos.',
            sub: 'Tu info para podernos comunicar.',
          },
          step1: {
            heading: 'Tu restaurante.',
            sub: 'Lo básico para saber qué construir.',
          },
          step2: {
            heading: 'El menú.',
            sub: '¿No tienes todo? No importa — investigamos el resto.',
          },
          step3: {
            heading: 'Look & feel.',
            sub: 'Elige lo que te guste. Lo puedes cambiar.',
            styleLabel: 'Estilo general',
            fontLabel: 'Tipografía',
            photoLabel: 'Imágenes',
          },
          step4: {
            heading: '¿Para qué sirve?',
            sub: 'Construimos para tus objetivos reales.',
            primaryActionLabel: 'Cuando alguien visita, debe…',
            featuresLabel: 'Funciones principales',
            primaryActions: ['Llamar', 'WhatsApp', 'Ordenar online', 'Hacer reservación', 'Ver dirección', 'Ver el menú'],
          },
          step5: {
            heading: 'Casi listo.',
            sub: 'Dinos lo que tienes y llenamos el resto.',
            logoLabel: '¿Tienes logo?',
            logoOptions: ['Sí, listo para compartir', 'Sí, tengo que buscarlo', 'No tengo logo'],
            photoLabel: '¿Tienes fotos?',
            photoOptions: ['Sí, muy buenas', 'Algunas, no muy buenas', 'No tengo fotos'],
            uploadLabel: 'Sube archivos (logo, fotos, menú PDF)',
            researchNote: 'También revisaremos tu Instagram, Google y Facebook para hacer el preview más completo.',
          },
        },
      })[lang],
    [lang],
  );

  /* ─── Helpers ──────────────────────────────────────────────────────────── */

  const update = (key: keyof BriefBuilderState, value: string) =>
    setForm((cur) => ({ ...cur, [key]: value }));

  const toggleFeature = (feature: string) =>
    setForm((cur) => ({
      ...cur,
      featureRequests: cur.featureRequests.includes(feature)
        ? cur.featureRequests.filter((f) => f !== feature)
        : [...cur.featureRequests, feature],
    }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    let active = true;
    const resumeToken = token;
    const resumeStep = clampStep(params.get('step'));

    async function loadResumeData() {
      setStatus('saving');
      setMessage('');
      try {
        const res = await fetch(`/api/intake?token=${encodeURIComponent(resumeToken)}`);
        const data: unknown = await res.json();
        if (!res.ok || typeof data !== 'object' || data === null) {
          throw new Error('Resume failed');
        }

        const request = 'request' in data && data.request && typeof data.request === 'object'
          ? data.request as ResumeRequest
          : {};
        const intake = 'intake' in data && data.intake && typeof data.intake === 'object'
          ? data.intake as ResumeIntake
          : null;

        if (!active) return;
        if (request.preferred_language === 'en' || request.preferred_language === 'es') {
          setLang(request.preferred_language);
        }
        setCreatedRequest({ token: resumeToken, clientSlug: stringValue(request.client_slug) });
        setForm((current) => ({ ...current, ...mergeResumeData(request, intake) }));
        setStep(resumeStep);
        setStatus('idle');
        track(ANALYTICS_EVENTS.BRIEF_BUILDER_RESUMED, {
          step: resumeStep,
          language: request.preferred_language,
          has_token: true,
        });
      } catch (error) {
        console.warn('[BriefBuilder] Resume failed:', error);
        if (!active) return;
        setCreatedRequest({ token: resumeToken, clientSlug: '' });
        setStep(resumeStep);
        setStatus('idle');
        setMessage('We could not reload your saved answers, but you can continue.');
      }
    }

    loadResumeData();
    return () => {
      active = false;
    };
  }, [setLang]);

  /* ─── API ──────────────────────────────────────────────────────────────── */

  const saveDraft = async (token: string, draftStep: number) => {
    try {
      const res = await fetch('/api/intake', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          step: draftStep,
          ...getDraftPayloadForStep(draftStep, form),
        }),
      });
      if (!res.ok) throw new Error('Draft save failed');
      setMessage('');
      return true;
    } catch (error) {
      console.warn('[BriefBuilder] Draft save failed:', error);
      setMessage(copy.draftWarning);
      return false;
    }
  };

  const createPreviewRequest = async () => {
    if (!form.ownerName.trim() || !form.restaurantName.trim() || !form.phone.trim() || !form.city.trim()) {
      setStatus('idle');
      setMessage(copy.requiredError);
      return;
    }

    if (createdRequest) {
      await saveDraft(createdRequest.token, 0);
      syncWizardUrl(createdRequest.token, 1);
      setStep(1);
      return;
    }
    setStatus('saving');
    setMessage('');
    try {
      const res = await fetch('/api/preview-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: form.ownerName,
          restaurantName: form.restaurantName,
          phone: form.phone,
          email: form.email,
          city: form.city,
          instagramUrl: form.instagramUrl,
          googleUrl: form.googleBusinessUrl,
          websiteUrl: form.currentWebsite,
          notes: form.notes,
          preferredLanguage: lang,
          source: 'brief-builder',
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok || typeof data !== 'object' || data === null) {
        throw new Error(errorMessageFromResponse(data, copy.error));
      }
      const intakeUrl = 'intakeUrl' in data && typeof data.intakeUrl === 'string' ? data.intakeUrl : '';
      const clientSlug = 'clientSlug' in data && typeof data.clientSlug === 'string' ? data.clientSlug : '';
      const token = new URL(intakeUrl, window.location.origin).searchParams.get('token') ?? '';
      if (!token) throw new Error('Missing token');
      setCreatedRequest({ token, clientSlug });
      await saveDraft(token, 0);
      syncWizardUrl(token, 1);
      track(ANALYTICS_EVENTS.BRIEF_BUILDER_STARTED, {
        step: 0,
        language: lang,
        has_token: true,
      });
      track(ANALYTICS_EVENTS.BRIEF_BUILDER_STEP_COMPLETED, {
        step: 0,
        language: lang,
        has_token: true,
      });
      setStatus('idle');
      setStep(1);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : copy.error);
    }
  };

  const uploadFiles = async (token: string) => {
    if (!files?.length) return;
    const formData = new FormData();
    formData.set('token', token);
    formData.set('fileRole', 'brief-builder-asset');
    Array.from(files).forEach((file) => formData.append('files', file));
    const res = await fetch('/api/intake/files', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('File upload failed');
  };

  const submitBrief = async () => {
    if (!createdRequest) return;
    setStatus('saving');
    setMessage('');
    try {
      await uploadFiles(createdRequest.token);
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          token: createdRequest.token,
          assetLinks: splitLines(form.assetLinks),
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      track(ANALYTICS_EVENTS.BRIEF_BUILDER_SUBMITTED, {
        step: 5,
        language: lang,
        has_token: true,
      });
      setStatus('complete');
    } catch {
      setStatus('error');
      setMessage(copy.error);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 0) { await createPreviewRequest(); return; }
    if (step < TOTAL_STEPS - 1) {
      const token = createdRequest?.token;
      if (token) await saveDraft(token, step);
      track(ANALYTICS_EVENTS.BRIEF_BUILDER_STEP_COMPLETED, {
        step,
        language: lang,
        has_token: Boolean(token),
      });
      const nextStep = step + 1;
      if (token) syncWizardUrl(token, nextStep);
      setStep(nextStep);
      return;
    }
    await submitBrief();
  };

  const progressPct = (step / (TOTAL_STEPS - 1)) * 100;

  /* ─── Complete ─────────────────────────────────────────────────────────── */

  if (status === 'complete') {
    return (
      <div className="wz-root">
        <main className="wz-complete-wrap">
          <div className="wz-complete">
            <CheckCircle size={40} className="wz-complete__icon" />
            <h1>{copy.complete}</h1>
            <p>{copy.completeSub}</p>
            {createdRequest && (
              <p className="wz-complete__slug">{createdRequest.clientSlug}</p>
            )}
            <Link href="/" className="wz-btn wz-btn--secondary">
              {copy.exitLabel}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  /* ─── Wizard ───────────────────────────────────────────────────────────── */

  return (
    <div className="wz-root">

      {/* ── Top bar ── */}
      <header className="wz-topbar">
        <Link href="/" className="wz-topbar__logo" aria-label="Sabor Web home">
          <span className="wz-topbar__mark">SW</span>
          <span className="wz-topbar__name">{copy.brand}</span>
        </Link>

        <div className="wz-topbar__center">
          <div
            className="wz-progress-track"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-label={copy.stepLabels[step]}
          >
            <div className="wz-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="wz-progress-meta">
            <strong>{lang === 'es' ? 'Paso' : 'Step'} {step + 1} / {TOTAL_STEPS}</strong>
            {' — '}{copy.stepLabels[step]}
          </p>
        </div>

        <button
          type="button"
          className="wz-topbar__lang"
          onClick={() => setLang(copy.langTarget)}
        >
          {copy.langSwitch}
        </button>
      </header>

      {/* ── Main ── */}
      <main className="wz-main">
        <div className="wz-shell">
          <form onSubmit={onSubmit} noValidate>
            {message && <p className="wz-error">{message}</p>}

            {/* ── STEP 0 — Contact ── */}
            {step === 0 && (
              <div className="wz-step">
                <div className="wz-step__head">
                  <h1>{copy.step0.heading}</h1>
                  <p>{copy.step0.sub}</p>
                </div>

                <div className="wz-fields">
                  <div className="wz-row wz-row--2">
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="ownerName">
                        {lang === 'es' ? 'Tu nombre' : 'Your name'} *
                      </label>
                      <input
                        id="ownerName"
                        className="wz-input"
                        required
                        autoFocus
                        value={form.ownerName}
                        onChange={(e) => update('ownerName', e.target.value)}
                        placeholder={lang === 'es' ? 'Carlos Rodríguez' : 'Maria Santos'}
                      />
                    </div>
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="restaurantName">
                        {lang === 'es' ? 'Restaurante' : 'Restaurant'} *
                      </label>
                      <input
                        id="restaurantName"
                        className="wz-input"
                        required
                        value={form.restaurantName}
                        onChange={(e) => update('restaurantName', e.target.value)}
                        placeholder={lang === 'es' ? 'El Bohío' : 'La Cocina'}
                      />
                    </div>
                  </div>

                  <div className="wz-row wz-row--2">
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="phone">
                        WhatsApp / {lang === 'es' ? 'Teléfono' : 'Phone'} *
                      </label>
                      <input
                        id="phone"
                        className="wz-input"
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        placeholder="(787) 555-0100"
                      />
                    </div>
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="email">
                        Email
                      </label>
                      <input
                        id="email"
                        className="wz-input"
                        type="email"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        placeholder={lang === 'es' ? 'tu@correo.com' : 'you@email.com'}
                      />
                    </div>
                  </div>

                  <div className="wz-row wz-row--1">
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="city">
                        {lang === 'es' ? 'Pueblo o ciudad' : 'City or town'} *
                      </label>
                      <input
                        id="city"
                        className="wz-input"
                        required
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                        placeholder={lang === 'es' ? 'Aguadilla, Mayagüez, San Juan…' : 'Aguadilla, Mayagüez, San Juan…'}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="wz-toggle-links"
                    onClick={() => setShowLinks((v) => !v)}
                    aria-expanded={showLinks}
                  >
                    {showLinks
                      ? <><X size={13} /> {lang === 'es' ? 'Ocultar enlaces' : 'Hide links'}</>
                      : lang === 'es' ? '+ Agregar links (Instagram, Google, web)' : '+ Add links (Instagram, Google, website)'}
                  </button>

                  {showLinks && (
                    <div className="wz-optional-links">
                      <div className="wz-row wz-row--2">
                        <input className="wz-input" value={form.instagramUrl} onChange={(e) => update('instagramUrl', e.target.value)} placeholder="Instagram URL" />
                        <input className="wz-input" value={form.googleBusinessUrl} onChange={(e) => update('googleBusinessUrl', e.target.value)} placeholder="Google Business URL" />
                        <input className="wz-input" value={form.currentWebsite} onChange={(e) => update('currentWebsite', e.target.value)} placeholder={lang === 'es' ? 'Página web actual' : 'Current website'} />
                        <input className="wz-input" value={form.facebookUrl} onChange={(e) => update('facebookUrl', e.target.value)} placeholder="Facebook URL" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="wz-actions wz-actions--end">
                  <button
                    type="submit"
                    className="wz-btn wz-btn--primary wz-btn--lg"
                    disabled={status === 'saving'}
                  >
                    {status === 'saving'
                      ? <><Loader2 size={16} className="spin" /> {copy.saving}</>
                      : <>{copy.next} <ArrowRight size={16} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 1 — Restaurant ── */}
            {step === 1 && (
              <div className="wz-step">
                <div className="wz-step__head">
                  <h1>{copy.step1.heading}</h1>
                  <p>{copy.step1.sub}</p>
                </div>

                <div className="wz-fields">
                  <div className="wz-row wz-row--2">
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="cuisine">
                        {lang === 'es' ? 'Tipo de cocina' : 'Cuisine type'}
                      </label>
                      <input
                        id="cuisine"
                        className="wz-input"
                        value={form.cuisine}
                        onChange={(e) => update('cuisine', e.target.value)}
                        placeholder={lang === 'es' ? 'Puertorriqueña, Mariscos, Italiana…' : 'Puerto Rican, Seafood, Italian…'}
                      />
                    </div>
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="neighborhood">
                        {lang === 'es' ? 'Barrio / área' : 'Neighborhood / area'}
                      </label>
                      <input
                        id="neighborhood"
                        className="wz-input"
                        value={form.neighborhood}
                        onChange={(e) => update('neighborhood', e.target.value)}
                        placeholder={lang === 'es' ? 'Zona, barrio o calle principal' : 'Zone, neighborhood, or main street'}
                      />
                    </div>
                  </div>

                  <div className="wz-field">
                    <label className="wz-label" htmlFor="hours">
                      {lang === 'es' ? 'Horario' : 'Hours'}
                    </label>
                    <textarea
                      id="hours"
                      className="wz-input wz-textarea"
                      rows={3}
                      value={form.hours}
                      onChange={(e) => update('hours', e.target.value)}
                      placeholder={lang === 'es' ? 'Lun–Vie 11am–10pm · Sáb–Dom 12pm–11pm · Cerrado martes' : 'Mon–Fri 11am–10pm · Sat–Sun 12pm–11pm · Closed Tuesdays'}
                    />
                  </div>

                  <div className="wz-field">
                    <label className="wz-label" htmlFor="address">
                      {lang === 'es' ? 'Dirección' : 'Address'}
                    </label>
                    <input
                      id="address"
                      className="wz-input"
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                      placeholder={lang === 'es' ? 'Calle, número, edificio…' : 'Street, number, building…'}
                    />
                  </div>
                </div>

                <div className="wz-actions">
                  <button type="button" className="wz-btn wz-btn--ghost" onClick={() => setStep(0)}>
                    <ArrowLeft size={15} /> {copy.back}
                  </button>
                  <button type="submit" className="wz-btn wz-btn--primary">
                    {copy.next} <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2 — Menu ── */}
            {step === 2 && (
              <div className="wz-step">
                <div className="wz-step__head">
                  <h1>{copy.step2.heading}</h1>
                  <p>{copy.step2.sub}</p>
                </div>

                <div className="wz-fields">
                  <div className="wz-field">
                    <label className="wz-label" htmlFor="menuHighlights">
                      {lang === 'es' ? 'Platos estrella' : 'Signature dishes'}
                    </label>
                    <textarea
                      id="menuHighlights"
                      className="wz-input wz-textarea"
                      rows={3}
                      value={form.menuHighlights}
                      onChange={(e) => update('menuHighlights', e.target.value)}
                      placeholder={lang === 'es' ? 'Mofongo de camarones, churrasco, tostones con pernil…' : 'Shrimp mofongo, churrasco, tostones con pernil…'}
                    />
                  </div>

                  <div className="wz-field">
                    <label className="wz-label" htmlFor="menuUrl">
                      {lang === 'es' ? 'Enlace al menú' : 'Menu link'}
                    </label>
                    <input
                      id="menuUrl"
                      className="wz-input"
                      value={form.menuUrl}
                      onChange={(e) => update('menuUrl', e.target.value)}
                      placeholder={lang === 'es' ? 'PDF, web, Instagram, o lo que tengas' : 'PDF, website, Instagram post, anything'}
                    />
                  </div>

                  <div className="wz-row wz-row--2">
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="orderingUrl">
                        {lang === 'es' ? 'Ordenar online' : 'Online ordering'}
                      </label>
                      <input
                        id="orderingUrl"
                        className="wz-input"
                        value={form.orderingUrl}
                        onChange={(e) => update('orderingUrl', e.target.value)}
                        placeholder="DoorDash, Uber Eats, URL…"
                      />
                    </div>
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="reservationsUrl">
                        {lang === 'es' ? 'Reservaciones' : 'Reservations'}
                      </label>
                      <input
                        id="reservationsUrl"
                        className="wz-input"
                        value={form.reservationsUrl}
                        onChange={(e) => update('reservationsUrl', e.target.value)}
                        placeholder="OpenTable, Resy, URL…"
                      />
                    </div>
                  </div>

                  <div className="wz-field">
                    <label className="wz-label" htmlFor="menuNotes">
                      {lang === 'es' ? 'Algo más sobre el menú' : 'Anything else about the menu'}
                    </label>
                    <textarea
                      id="menuNotes"
                      className="wz-input wz-textarea"
                      rows={2}
                      value={form.menuNotes}
                      onChange={(e) => update('menuNotes', e.target.value)}
                      placeholder={lang === 'es' ? 'Opciones veganas, especiales del día, alérgenos, precios…' : 'Vegan options, daily specials, allergens, pricing notes…'}
                    />
                  </div>
                </div>

                <div className="wz-actions">
                  <button type="button" className="wz-btn wz-btn--ghost" onClick={() => setStep(1)}>
                    <ArrowLeft size={15} /> {copy.back}
                  </button>
                  <button type="submit" className="wz-btn wz-btn--primary">
                    {copy.next} <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3 — Look & Feel ── */}
            {step === 3 && (
              <div className="wz-step">
                <div className="wz-step__head">
                  <h1>{copy.step3.heading}</h1>
                  <p>{copy.step3.sub}</p>
                </div>

                <div className="wz-fields">
                  <div className="wz-field">
                    <label className="wz-label">{copy.step3.styleLabel}</label>
                    <div className="wz-card-chip-grid">
                      {STYLE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`wz-card-chip${form.brandStyle === opt ? ' wz-card-chip--selected' : ''}`}
                          onClick={() => update('brandStyle', form.brandStyle === opt ? '' : opt)}
                          aria-pressed={form.brandStyle === opt}
                        >
                          <span className="wz-card-chip__check">
                            {form.brandStyle === opt && <CheckCircle size={10} strokeWidth={3} />}
                          </span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="wz-row wz-row--2">
                    <div className="wz-field">
                      <label className="wz-label">{copy.step3.fontLabel}</label>
                      <ChipSingle
                        options={FONT_MOOD_OPTIONS}
                        value={form.fontMood}
                        onChange={(v) => update('fontMood', v)}
                      />
                    </div>
                    <div className="wz-field">
                      <label className="wz-label">{copy.step3.photoLabel}</label>
                      <ChipSingle
                        options={PHOTO_DIRECTION_OPTIONS}
                        value={form.photoDirection}
                        onChange={(v) => update('photoDirection', v)}
                      />
                    </div>
                  </div>

                  <div className="wz-row wz-row--2">
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="colorNotes">
                        {lang === 'es' ? 'Colores' : 'Colors'}
                      </label>
                      <textarea
                        id="colorNotes"
                        className="wz-input wz-textarea"
                        rows={2}
                        value={form.colorNotes}
                        onChange={(e) => update('colorNotes', e.target.value)}
                        placeholder={lang === 'es' ? 'Colores de marca, o qué evitar' : 'Brand colors, or colors to avoid'}
                      />
                    </div>
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="visualReferences">
                        {lang === 'es' ? 'Referencias' : 'References'}
                      </label>
                      <textarea
                        id="visualReferences"
                        className="wz-input wz-textarea"
                        rows={2}
                        value={form.visualReferences}
                        onChange={(e) => update('visualReferences', e.target.value)}
                        placeholder={lang === 'es' ? 'Restaurantes o webs que te gustan' : 'Restaurants or websites you like'}
                      />
                    </div>
                  </div>
                </div>

                <div className="wz-actions">
                  <button type="button" className="wz-btn wz-btn--ghost" onClick={() => setStep(2)}>
                    <ArrowLeft size={15} /> {copy.back}
                  </button>
                  <button type="submit" className="wz-btn wz-btn--primary">
                    {copy.next} <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4 — Goals ── */}
            {step === 4 && (
              <div className="wz-step">
                <div className="wz-step__head">
                  <h1>{copy.step4.heading}</h1>
                  <p>{copy.step4.sub}</p>
                </div>

                <div className="wz-fields">
                  <div className="wz-field">
                    <label className="wz-label">{copy.step4.primaryActionLabel}</label>
                    <div className="wz-chip-grid">
                      {copy.step4.primaryActions.map((action) => (
                        <Chip
                          key={action}
                          label={action}
                          selected={form.primaryAction === action}
                          onClick={() => update('primaryAction', form.primaryAction === action ? '' : action)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="wz-field">
                    <label className="wz-label">{copy.step4.featuresLabel}</label>
                    <div className="wz-chip-grid">
                      {FEATURE_OPTIONS.map((feat) => (
                        <Chip
                          key={feat}
                          label={feat}
                          selected={form.featureRequests.includes(feat)}
                          onClick={() => toggleFeature(feat)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="wz-row wz-row--2">
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="idealGuest">
                        {lang === 'es' ? 'Cliente ideal' : 'Ideal guest'}
                      </label>
                      <textarea
                        id="idealGuest"
                        className="wz-input wz-textarea"
                        rows={2}
                        value={form.idealGuest}
                        onChange={(e) => update('idealGuest', e.target.value)}
                        placeholder={lang === 'es' ? 'Locales, turistas, familias, parejas…' : 'Locals, tourists, families, date-night couples…'}
                      />
                    </div>
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="ownerGoals">
                        {lang === 'es' ? 'Lo que quieres lograr' : 'What you want to achieve'}
                      </label>
                      <textarea
                        id="ownerGoals"
                        className="wz-input wz-textarea"
                        rows={2}
                        value={form.ownerGoals}
                        onChange={(e) => update('ownerGoals', e.target.value)}
                        placeholder={lang === 'es' ? 'Más llamadas, mejor presencia en Google, atraer turistas…' : 'More calls, better Google presence, attract tourists…'}
                      />
                    </div>
                  </div>
                </div>

                <div className="wz-actions">
                  <button type="button" className="wz-btn wz-btn--ghost" onClick={() => setStep(3)}>
                    <ArrowLeft size={15} /> {copy.back}
                  </button>
                  <button type="submit" className="wz-btn wz-btn--primary">
                    {copy.next} <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5 — Assets ── */}
            {step === 5 && (
              <div className="wz-step">
                <div className="wz-step__head">
                  <h1>{copy.step5.heading}</h1>
                  <p>{copy.step5.sub}</p>
                </div>

                <div className="wz-fields">
                  <div className="wz-row wz-row--2">
                    <div className="wz-field">
                      <label className="wz-label">{copy.step5.logoLabel}</label>
                      <div className="wz-chip-grid">
                        {copy.step5.logoOptions.map((o) => (
                          <Chip key={o} label={o} selected={form.logoStatus === o}
                            onClick={() => update('logoStatus', form.logoStatus === o ? '' : o)} />
                        ))}
                      </div>
                    </div>
                    <div className="wz-field">
                      <label className="wz-label">{copy.step5.photoLabel}</label>
                      <div className="wz-chip-grid">
                        {copy.step5.photoOptions.map((o) => (
                          <Chip key={o} label={o} selected={form.photoStatus === o}
                            onClick={() => update('photoStatus', form.photoStatus === o ? '' : o)} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="wz-field">
                    <label className="wz-label" htmlFor="assetLinks">
                      {lang === 'es' ? 'Links de archivos' : 'File links'}
                    </label>
                    <textarea
                      id="assetLinks"
                      className="wz-input wz-textarea"
                      rows={2}
                      value={form.assetLinks}
                      onChange={(e) => update('assetLinks', e.target.value)}
                      placeholder={lang === 'es' ? 'Google Drive, Dropbox, WeTransfer… (uno por línea)' : 'Google Drive, Dropbox, WeTransfer… (one per line)'}
                    />
                  </div>

                  <label className="wz-upload" htmlFor="fileUpload">
                    <Upload size={24} className="wz-upload__icon" />
                    <span className="wz-upload__label">{copy.step5.uploadLabel}</span>
                    {files && files.length > 0 ? (
                      <span className="wz-upload__count">
                        ✓ {files.length} {lang === 'es' ? 'archivo(s) seleccionado(s)' : `file${files.length > 1 ? 's' : ''} selected`}
                      </span>
                    ) : (
                      <span className="wz-upload__sub">
                        {lang === 'es' ? 'PNG, JPG, PDF — hasta 10 archivos' : 'PNG, JPG, PDF — up to 10 files'}
                      </span>
                    )}
                    <input
                      id="fileUpload"
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={(e) => setFiles(e.target.files)}
                      className="wz-upload__input"
                    />
                  </label>

                  <p className="wz-research-note">{copy.step5.researchNote}</p>
                </div>

                <div className="wz-actions">
                  <button type="button" className="wz-btn wz-btn--ghost" onClick={() => setStep(4)}>
                    <ArrowLeft size={15} /> {copy.back}
                  </button>
                  <button type="submit" className="wz-btn wz-btn--primary" disabled={status === 'saving'}>
                    {status === 'saving'
                      ? <><Loader2 size={15} className="spin" /> {copy.saving}</>
                      : <>{copy.submit} <ArrowRight size={15} /></>}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </main>
    </div>
  );
}
