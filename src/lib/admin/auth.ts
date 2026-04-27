import 'server-only';

import { redirect } from 'next/navigation';
import { isAdminEmail } from '@/lib/admin/allowlist';
import { withMonitoringSpan } from '@/lib/monitoring/sentry';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ADMIN_AUTH_TIMEOUT_MS = 2500;

async function getUserWithTimeout<T>(task: Promise<T>, timeoutMs: number) {
  return await Promise.race([
    task,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);
}

export async function getAdminUser() {
  return withMonitoringSpan(
    {
      name: 'admin.auth.get-user',
      op: 'auth',
      attributes: {
        scope: 'admin',
      },
    },
    async () => {
      try {
        const supabase = await createSupabaseServerClient();
        const result = await getUserWithTimeout(supabase.auth.getUser(), ADMIN_AUTH_TIMEOUT_MS);
        if (!result || typeof result !== 'object' || !('data' in result)) return null;
        const {
          data: { user },
          error,
        } = result as Awaited<ReturnType<typeof supabase.auth.getUser>>;

        if (error || !isAdminEmail(user?.email)) return null;

        return user;
      } catch {
        return null;
      }
    },
  );
}

export async function requireAdminUser() {
  const user = await getAdminUser();

  if (!user) {
    redirect('/admin/login');
  }

  return user;
}
