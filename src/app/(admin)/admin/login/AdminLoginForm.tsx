'use client';

import { LockKeyhole } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-[var(--color-sw-cream)]">
        Email
        <input
          autoComplete="email"
          className="h-12 rounded-sm border border-white/10 bg-white/[0.04] px-4 text-base text-[var(--color-sw-cream)] outline-none transition focus:border-[var(--color-sw-coral)]"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-[var(--color-sw-cream)]">
        Password
        <input
          autoComplete="current-password"
          className="h-12 rounded-sm border border-white/10 bg-white/[0.04] px-4 text-base text-[var(--color-sw-cream)] outline-none transition focus:border-[var(--color-sw-coral)]"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      {error && (
        <p className="rounded-sm border border-[rgba(232,105,74,0.35)] bg-[rgba(232,105,74,0.1)] p-3 text-sm text-[var(--color-sw-cream)]">
          {error}
        </p>
      )}

      <button
        className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-[var(--color-sw-coral)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-sw-coral-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        <LockKeyhole size={17} />
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
