'use client';

import { Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type SlugAvailability =
  | { state: 'idle'; normalizedSlug: string }
  | { state: 'checking'; normalizedSlug: string }
  | { state: 'available'; normalizedSlug: string }
  | { state: 'unavailable'; normalizedSlug: string; reason: string }
  | { state: 'error'; normalizedSlug: string; reason: string };

function slugifyProjectValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export default function ManualProjectForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [restaurantName, setRestaurantName] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [availability, setAvailability] = useState<SlugAvailability>({ state: 'idle', normalizedSlug: '' });
  const requestIdRef = useRef(0);

  const normalizedSlug = useMemo(
    () => slugifyProjectValue(slugTouched ? slugInput : slugInput || restaurantName),
    [restaurantName, slugInput, slugTouched],
  );

  useEffect(() => {
    if (!normalizedSlug) {
      return;
    }

    const requestId = ++requestIdRef.current;

    const timeout = window.setTimeout(async () => {
      setAvailability({ state: 'checking', normalizedSlug });

      try {
        const response = await fetch(`/api/admin/slug-availability?slug=${encodeURIComponent(normalizedSlug)}`, {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; slug?: string; available?: boolean; reason?: string | null }
          | null;

        if (requestId !== requestIdRef.current) return;

        if (!response.ok || !payload?.ok) {
          setAvailability({
            state: 'error',
            normalizedSlug,
            reason: payload?.reason ?? 'Could not verify slug availability right now.',
          });
          return;
        }

        if (payload.available) {
          setAvailability({ state: 'available', normalizedSlug: payload.slug ?? normalizedSlug });
          return;
        }

        setAvailability({
          state: 'unavailable',
          normalizedSlug: payload.slug ?? normalizedSlug,
          reason: payload.reason ?? 'That slug is already in use.',
        });
      } catch {
        if (requestId !== requestIdRef.current) return;
        setAvailability({
          state: 'error',
          normalizedSlug,
          reason: 'Could not verify slug availability right now.',
        });
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [normalizedSlug]);

  const effectiveAvailability =
    normalizedSlug && availability.normalizedSlug === normalizedSlug
      ? availability
      : ({ state: 'idle', normalizedSlug } as SlugAvailability);

  const canSubmit =
    Boolean(normalizedSlug) &&
    effectiveAvailability.state !== 'checking' &&
    effectiveAvailability.state !== 'unavailable';
  const slugToneClass =
    effectiveAvailability.state === 'available'
      ? 'admin-small admin-small--success'
      : effectiveAvailability.state === 'unavailable' || effectiveAvailability.state === 'error'
        ? 'admin-small admin-small--warn'
        : 'admin-small';

  return (
    <section className="admin-panel admin-manual-project">
      <div className="admin-card__header">
        <Plus size={18} />
        <div>
          <h2 className="admin-card__title">New restaurant project</h2>
          <p className="admin-muted">Start with the restaurant name, a few helpful links, and anything you already know. Research begins right away.</p>
        </div>
      </div>
      <form action={action} className="admin-form-grid" style={{ marginTop: 14 }}>
        <label className="admin-select-label">
          Restaurant name
          <input
            className="admin-input"
            name="restaurant_name"
            placeholder="Oktoberfest"
            required
            value={restaurantName}
            onChange={(event) => setRestaurantName(event.currentTarget.value)}
          />
        </label>
        <label className="admin-select-label">
          City
          <input className="admin-input" name="city" placeholder="Aguadilla" />
        </label>
        <label className="admin-select-label">
          Website
          <input
            className="admin-input"
            name="website_url"
            type="url"
            inputMode="url"
            pattern="https?://.+"
            placeholder="https://restaurant.com"
          />
          <p className="admin-small" style={{ marginTop: 6 }}>Leave blank if they mostly live on social.</p>
        </label>
        <label className="admin-select-label">
          Google profile
          <input className="admin-input" name="google_url" placeholder="https://maps.google.com/..." />
        </label>
        <label className="admin-select-label">
          Instagram
          <input className="admin-input" name="instagram_url" placeholder="https://instagram.com/..." />
        </label>
        <label className="admin-select-label">
          Facebook
          <input className="admin-input" name="facebook_url" placeholder="https://facebook.com/..." />
        </label>
        <label className="admin-select-label" style={{ gridColumn: '1 / -1' }}>
          What do you know about this restaurant?
          <textarea
            className="admin-textarea"
            name="project_prompt"
            placeholder="Research priorities, known menu clues, brand vibe, must-have sections, owner notes, or anything else that would help us build fast."
          />
        </label>
        <details className="admin-details" style={{ gridColumn: '1 / -1' }}>
          <summary>Advanced details</summary>
          <div className="admin-form-grid" style={{ marginTop: 14 }}>
            <label className="admin-select-label">
              Slug
              <input
                className="admin-input"
                name="slug"
                placeholder="goodstart"
                value={slugInput}
                onBlur={() => setSlugTouched(true)}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlugInput(event.currentTarget.value);
                }}
              />
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                <p className="admin-small">
                  Will use: <strong>{normalizedSlug || 'Enter a name or slug'}</strong>
                </p>
                {effectiveAvailability.state === 'checking' ? <p className={slugToneClass}>Checking availability...</p> : null}
                {effectiveAvailability.state === 'available' ? <p className={slugToneClass}>Slug is available.</p> : null}
                {effectiveAvailability.state === 'unavailable' || effectiveAvailability.state === 'error' ? (
                  <p className={slugToneClass}>{effectiveAvailability.reason}</p>
                ) : null}
              </div>
            </label>
            <label className="admin-select-label">
              Address / area
              <input className="admin-input" name="address" placeholder="Street, neighborhood, plaza..." />
            </label>
            <label className="admin-select-label">
              Menu URL
              <input className="admin-input" name="menu_url" placeholder="https://..." />
            </label>
            <label className="admin-select-label">
              Owner name
              <input className="admin-input" name="owner_name" />
            </label>
            <label className="admin-select-label">
              Owner email
              <input className="admin-input" name="owner_email" placeholder="owner@example.com" type="email" />
            </label>
            <label className="admin-select-label">
              Owner phone
              <input className="admin-input" name="owner_phone" />
            </label>
          </div>
        </details>
        <button className="admin-btn admin-btn--primary" disabled={!canSubmit} style={{ justifySelf: 'start' }}>
          Create project and start research
        </button>
      </form>
    </section>
  );
}
