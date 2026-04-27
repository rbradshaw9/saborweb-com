'use client';

import { CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';
import { testIntegrationConnection } from './actions';

const SCROLL_KEY = 'saborweb:admin-integrations-scroll';

export function IntegrationTestButton({ connectionId }: { connectionId: string }) {
  useEffect(() => {
    const value = window.sessionStorage.getItem(SCROLL_KEY);
    if (!value) return;

    window.sessionStorage.removeItem(SCROLL_KEY);
    const y = Number(value);
    if (Number.isFinite(y)) {
      window.requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
    }
  }, []);

  return (
    <form
      action={testIntegrationConnection.bind(null, connectionId)}
      onSubmit={() => {
        window.sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      }}
    >
      <button className="admin-btn admin-btn--secondary">
        <CheckCircle2 size={13} />
        Test
      </button>
    </form>
  );
}
