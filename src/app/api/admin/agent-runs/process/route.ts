import { NextRequest } from 'next/server';
import { isAdminEmail } from '@/lib/admin/allowlist';
import { processQueuedAgentRuns } from '@/lib/admin/agent-runner';
import { addMonitoringBreadcrumb, captureMonitoringException, initSentry } from '@/lib/monitoring/sentry';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

initSentry('server');

async function authorized(request: NextRequest) {
  const secret = process.env.AGENT_WORKER_SECRET || process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV !== 'production') return true;

  const auth = request.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : request.nextUrl.searchParams.get('secret');
  if (secret && token === secret) return true;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) return false;
    return isAdminEmail(user?.email);
  } catch {
    return false;
  }
}

async function handle(request: NextRequest) {
  if (!(await authorized(request))) {
    addMonitoringBreadcrumb({
      category: 'agent-worker',
      message: 'Unauthorized agent worker request blocked',
      level: 'warning',
      data: {
        path: request.nextUrl.pathname,
      },
    });
    return Response.json({ ok: false, error: 'Unauthorized agent worker request.' }, { status: 401 });
  }

  const limit = Math.min(10, Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? 3) || 3));
  try {
    addMonitoringBreadcrumb({
      category: 'agent-worker',
      message: 'Processing queued agent runs',
      data: {
        limit,
        method: request.method,
      },
    });
    const result = await processQueuedAgentRuns(limit);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    captureMonitoringException(error, {
      tags: {
        area: 'agent-worker-route',
      },
      extra: {
        limit,
        method: request.method,
        path: request.nextUrl.pathname,
      },
    });
    throw error;
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
