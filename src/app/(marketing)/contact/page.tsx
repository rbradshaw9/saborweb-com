'use client';
import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function ContactPage() {
  const { t, lang } = useLanguage();
  const [form, setForm] = useState({ name: '', restaurant: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: 'var(--color-sw-elevated)',
    border: '1px solid var(--color-sw-border-subtle)',
    borderRadius: '2px',
    color: 'var(--color-sw-cream)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 200ms ease',
  };

  return (
    <>
      {/* Hero */}
      <section style={{ paddingTop: '140px', paddingBottom: '40px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center top, oklch(0.58 0.16 28 / 0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <p className="label" style={{ marginBottom: '1rem' }}>{t.contact.heroLabel}</p>
          <h1 style={{ marginBottom: '1rem' }}>{t.contact.heroHeading}</h1>
          <p style={{ color: 'var(--color-sw-muted)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>{t.contact.heroSub}</p>
        </div>
      </section>

      {/* Form */}
      <section className="section" style={{ paddingTop: '3rem' }}>
        <div className="container" style={{ maxWidth: '560px' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-sw-card)', border: '1px solid var(--color-sw-border)', borderRadius: '4px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ marginBottom: '0.75rem' }}>{lang === 'es' ? '¡Recibido!' : 'Got it!'}</h3>
              <p style={{ color: 'var(--color-sw-muted)', lineHeight: 1.7 }}>{t.contact.success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <input
                style={inputStyle}
                placeholder={t.contact.namePlaceholder}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onFocus={e => (e.target.style.borderColor = 'var(--color-sw-coral)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-sw-border-subtle)')}
                required
              />
              <input
                style={inputStyle}
                placeholder={t.contact.restaurantPlaceholder}
                value={form.restaurant}
                onChange={e => setForm(f => ({ ...f, restaurant: e.target.value }))}
                onFocus={e => (e.target.style.borderColor = 'var(--color-sw-coral)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-sw-border-subtle)')}
                required
              />
              <input
                style={inputStyle}
                placeholder={t.contact.phonePlaceholder}
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                onFocus={e => (e.target.style.borderColor = 'var(--color-sw-coral)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-sw-border-subtle)')}
                required
              />
              <textarea
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                placeholder={t.contact.messagePlaceholder}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                onFocus={e => (e.target.style.borderColor = 'var(--color-sw-coral)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-sw-border-subtle)')}
              />

              {status === 'error' && (
                <p style={{ color: '#e05252', fontSize: '0.85rem' }}>{t.contact.error}</p>
              )}

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }} disabled={status === 'loading'}>
                {status === 'loading' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={16} />}
                {t.contact.submit}
              </button>
            </form>
          )}

          {/* WhatsApp alternative */}
          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--color-sw-dim)', fontSize: '0.85rem' }}>
            {lang === 'es' ? 'O escríbenos directamente por' : 'Or reach us directly on'}{' '}
            <a href="https://wa.me/18019106171" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 600 }}>WhatsApp</a>
          </p>
        </div>
      </section>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
