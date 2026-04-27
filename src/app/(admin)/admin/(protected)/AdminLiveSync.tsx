'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const REFRESH_MS = 1500;
const PULSE_MS = 4000;

export function AdminLiveSync() {
  const router = useRouter();
  const pulseInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function pulseWorker() {
      if (cancelled || pulseInFlight.current || document.hidden) return;
      pulseInFlight.current = true;
      try {
        await fetch('/api/admin/agent-runs/process?limit=1', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        });
      } catch {
        // Quietly ignore worker pulse failures; the UI refresh loop still helps surface status.
      } finally {
        pulseInFlight.current = false;
      }
    }

    const refreshTimer = window.setInterval(() => {
      if (!document.hidden) router.refresh();
    }, REFRESH_MS);

    const pulseTimer = window.setInterval(() => {
      void pulseWorker();
    }, PULSE_MS);

    void pulseWorker();

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      window.clearInterval(pulseTimer);
    };
  }, [router]);

  return null;
}
