'use client';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { ANALYTICS_EVENTS, track } from '@/lib/analytics';
import { SERVICE_PACKAGES } from '@/lib/packages';

const PKG_NAMES: Record<string, { en: string; es: string }> = {
  presencia:   { en: 'Presencia',   es: 'Presencia'   },
  visibilidad: { en: 'Visibilidad', es: 'Visibilidad' },
  crecimiento: { en: 'Crecimiento', es: 'Crecimiento' },
};

function GraciasContent() {
  const { lang } = useLanguage();
  const params = useSearchParams();
  const pkg = params.get('pkg') ?? '';
  const sessionId = params.get('session_id') ?? '';
  const servicePackage = SERVICE_PACKAGES.find((item) => item.key === pkg);
  const pkgName = PKG_NAMES[pkg]?.[lang] ?? '';

  useEffect(() => {
    if (!servicePackage || !sessionId) return;

    const storageKey = `sw-purchase-tracked:${sessionId}`;
    if (window.sessionStorage.getItem(storageKey)) return;

    track(ANALYTICS_EVENTS.PURCHASE, {
      transaction_id: sessionId,
      currency: 'USD',
      value: servicePackage.setup,
      package_key: servicePackage.key,
      package_name: servicePackage.name,
      setup_fee: servicePackage.setup,
      monthly_value: servicePackage.monthly,
      items: [
        {
          item_id: servicePackage.key,
          item_name: servicePackage.name,
          item_category: 'service_plan',
          price: servicePackage.setup,
          quantity: 1,
        },
      ],
    });
    window.sessionStorage.setItem(storageKey, 'true');
  }, [servicePackage, sessionId]);

  const copy = {
    en: {
      badge: 'Payment confirmed',
      heading: "You're in. Let's build.",
      sub: pkgName
        ? `Welcome to the ${pkgName} plan. We'll reach out within 24 hours to kick off your project.`
        : "We'll reach out within 24 hours to kick off your project.",
      next: "What happens next:",
      steps: [
        "You'll receive a confirmation email from Sabor Web.",
        "We'll schedule a quick onboarding call to gather your brand assets.",
        "Your site will be built and ready for your review within 5–7 business days.",
      ],
      cta: 'Back to Home',
    },
    es: {
      badge: 'Pago confirmado',
      heading: 'Ya eres parte. Vamos a construir.',
      sub: pkgName
        ? `Bienvenido al plan ${pkgName}. Te contactaremos dentro de 24 horas para comenzar tu proyecto.`
        : 'Te contactaremos dentro de 24 horas para comenzar tu proyecto.',
      next: '¿Qué pasa ahora?',
      steps: [
        'Recibirás un correo de confirmación de Sabor Web.',
        'Agendaremos una llamada rápida para recopilar tus materiales de marca.',
        'Tu sitio estará listo para revisión en 5–7 días hábiles.',
      ],
      cta: 'Volver al Inicio',
    },
  };
  const c = copy[lang];

  return (
    <section style={{
      minHeight: '100svh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px clamp(24px, 5vw, 80px) 80px',
      background: 'var(--color-sw-black)',
    }}>
      <div style={{ maxWidth: '640px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(232,105,74,0.12)', border: '1px solid rgba(232,105,74,0.25)',
          borderRadius: '100px', padding: '6px 16px',
          marginBottom: '2.5rem',
        }}>
          <CheckCircle size={14} style={{ color: 'var(--color-sw-coral)' }} strokeWidth={2.5} />
          <span style={{ fontFamily: 'var(--font-grotesk)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-sw-coral)' }}>
            {c.badge}
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
          {c.heading}
        </h1>
        <p style={{ color: 'var(--color-sw-muted)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem', marginInline: 'auto' }}>
          {c.sub}
        </p>

        <div style={{
          background: 'var(--color-sw-surface)', border: '1px solid var(--color-sw-rule-dark)',
          borderRadius: '4px', padding: 'clamp(1.5rem, 3vw, 2.5rem)', textAlign: 'left', marginBottom: '2.5rem',
        }}>
          <p style={{ fontFamily: 'var(--font-grotesk)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-sw-dim)', marginBottom: '1.25rem' }}>
            {c.next}
          </p>
          <ol style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {c.steps.map((step, i) => (
              <li key={i} style={{ display: 'grid', gridTemplateColumns: '1.75rem 1fr', gap: '0.5rem', alignItems: 'start' }}>
                <span style={{ fontFamily: 'var(--font-grotesk)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-sw-coral)', paddingTop: '2px' }}>0{i + 1}</span>
                <span style={{ color: 'var(--color-sw-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <Link href="/" className="btn-outline" style={{ justifyContent: 'center' }}>
          {c.cta} <ArrowRight size={14} strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
}

export default function GraciasPage() {
  return (
    <Suspense>
      <GraciasContent />
    </Suspense>
  );
}
