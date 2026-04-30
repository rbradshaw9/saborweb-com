import Link from 'next/link';
import type { ReactNode } from 'react';
import './portal.css';

export const dynamic = 'force-dynamic';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="portal-shell">
      <header className="portal-topbar">
        <div className="portal-wrap portal-topbar__inner">
          <Link className="portal-brand" href="/portal/sites">
            <span className="portal-brand__mark">SW</span>
            <span>Sabor Web Portal</span>
          </Link>
        </div>
      </header>
      <main className="portal-main">{children}</main>
    </div>
  );
}
