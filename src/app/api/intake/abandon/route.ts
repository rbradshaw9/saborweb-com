import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { escapeHtml, getRequestOrigin } from '@/lib/intake/server';

type PreviewRequestCandidate = {
  id: string;
  created_at: string;
  owner_name: string;
  email: string | null;
  restaurant_name: string;
  preferred_language: 'en' | 'es';
  status: string;
  intake_resume_token: string | null;
  intake_submitted_at: string | null;
  abandon_first_sent_at: string | null;
  abandon_second_sent_at: string | null;
  abandon_opted_out_at: string | null;
};

type IntakeDraft = {
  request_id: string;
  status: string | null;
  last_step: number | null;
};

const FIRST_REMINDER_HOURS = 2;
const SECOND_REMINDER_HOURS = 24;
const MAX_REMINDERS_PER_RUN = 25;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function isDue(date: string, cutoffIso: string) {
  return new Date(date).getTime() <= new Date(cutoffIso).getTime();
}

function buildResumeUrl(origin: string, token: string, step: number) {
  const url = new URL('/brief-builder', origin);
  url.searchParams.set('token', token);
  url.searchParams.set('step', String(Math.max(1, Math.min(step, 6))));
  return url.toString();
}

function buildOptOutUrl(origin: string, token: string) {
  const url = new URL('/api/intake/abandon/opt-out', origin);
  url.searchParams.set('token', token);
  return url.toString();
}

function buildEmailHtml({
  candidate,
  resumeUrl,
  optOutUrl,
  reminderNumber,
}: {
  candidate: PreviewRequestCandidate;
  resumeUrl: string;
  optOutUrl: string;
  reminderNumber: 1 | 2;
}) {
  const isSpanish = candidate.preferred_language === 'es';
  const greeting = isSpanish ? `Hola ${candidate.owner_name},` : `Hi ${candidate.owner_name},`;
  const intro = isSpanish
    ? `Guardamos el brief de ${candidate.restaurant_name}. Puedes terminarlo cuando tengas unos minutos.`
    : `We saved the brief for ${candidate.restaurant_name}. You can finish it when you have a few minutes.`;
  const detail = isSpanish
    ? reminderNumber === 1
      ? 'Con eso tenemos suficiente contexto para preparar un preview más fuerte antes de hablar de pago.'
      : 'Si todavía quieres que preparemos el preview, este enlace te lleva justo donde lo dejaste.'
    : reminderNumber === 1
      ? 'That gives us enough context to prepare a stronger preview before we ever talk payment.'
      : 'If you still want us to prepare the preview, this link takes you back to where you left off.';
  const cta = isSpanish ? 'Continuar brief' : 'Continue brief';
  const optOut = isSpanish ? 'No quiero más recordatorios de este brief.' : 'Do not send more reminders for this brief.';

  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:620px;margin:0 auto;padding:32px;color:#17130f">
      <p style="margin:0 0 16px">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 12px;line-height:1.6">${escapeHtml(intro)}</p>
      <p style="margin:0 0 24px;line-height:1.6;color:#6d625b">${escapeHtml(detail)}</p>
      <p style="margin:0 0 28px">
        <a href="${escapeHtml(resumeUrl)}" style="display:inline-block;background:#ba4f32;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:6px">${escapeHtml(cta)}</a>
      </p>
      <p style="font-size:13px;line-height:1.5;color:#756b63;margin:0">
        <a href="${escapeHtml(optOutUrl)}" style="color:#756b63">${escapeHtml(optOut)}</a>
      </p>
    </div>
  `;
}

async function sendReminder(
  candidate: PreviewRequestCandidate,
  resumeUrl: string,
  optOutUrl: string,
  reminderNumber: 1 | 2
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !candidate.email) return { sent: false, reason: 'missing_email_or_resend' };

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || 'Sabor Web <hello@saborweb.com>';
  const replyTo = process.env.EMAIL_REPLY_TO || 'hello@saborweb.com';
  const isSpanish = candidate.preferred_language === 'es';
  const subject = isSpanish
    ? `Tu brief de ${candidate.restaurant_name} quedó guardado`
    : `Your ${candidate.restaurant_name} brief is saved`;

  await resend.emails.send({
    from,
    to: [candidate.email],
    replyTo,
    subject,
    html: buildEmailHtml({ candidate, resumeUrl, optOutUrl, reminderNumber }),
  });

  return { sent: true };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return json(401, { error: 'Unauthorized' });

  const supabase = getSupabaseAdmin();
  const firstCutoff = hoursAgo(FIRST_REMINDER_HOURS);
  const secondCutoff = hoursAgo(SECOND_REMINDER_HOURS);

  const { data: candidates, error } = await supabase
    .from('preview_requests')
    .select(
      [
        'id',
        'created_at',
        'owner_name',
        'email',
        'restaurant_name',
        'preferred_language',
        'status',
        'intake_resume_token',
        'intake_submitted_at',
        'abandon_first_sent_at',
        'abandon_second_sent_at',
        'abandon_opted_out_at',
      ].join(', ')
    )
    .in('status', ['new', 'intake_started'])
    .not('email', 'is', null)
    .is('intake_submitted_at', null)
    .is('abandon_opted_out_at', null)
    .lte('created_at', firstCutoff)
    .order('created_at', { ascending: true })
    .limit(MAX_REMINDERS_PER_RUN);

  if (error) {
    console.error('[Intake Abandon] Candidate lookup failed:', error);
    return json(500, { error: 'Could not load abandon candidates.' });
  }

  const reminderCandidates = ((candidates ?? []) as unknown) as PreviewRequestCandidate[];
  const requestIds = reminderCandidates.map((candidate) => candidate.id);
  const { data: intakes, error: intakeError } = requestIds.length
    ? await supabase
        .from('restaurant_intake')
        .select('request_id, status, last_step')
        .in('request_id', requestIds)
    : { data: [], error: null };

  if (intakeError) {
    console.error('[Intake Abandon] Intake lookup failed:', intakeError);
    return json(500, { error: 'Could not load intake drafts.' });
  }

  const intakeByRequestId = new Map(
    ((intakes ?? []) as IntakeDraft[]).map((intake) => [intake.request_id, intake])
  );

  const origin = getRequestOrigin(req);
  const results = [];

  for (const candidate of reminderCandidates) {
    const intake = intakeByRequestId.get(candidate.id);
    if (intake?.status === 'complete' || !candidate.intake_resume_token) {
      results.push({ requestId: candidate.id, action: 'skipped' });
      continue;
    }

    const reminderNumber =
      candidate.abandon_first_sent_at && !candidate.abandon_second_sent_at && isDue(candidate.created_at, secondCutoff)
        ? 2
        : !candidate.abandon_first_sent_at && isDue(candidate.created_at, firstCutoff)
          ? 1
          : null;

    if (!reminderNumber) {
      results.push({ requestId: candidate.id, action: 'not_due' });
      continue;
    }

    const step = typeof intake?.last_step === 'number' ? intake.last_step : 1;
    const resumeUrl = buildResumeUrl(origin, candidate.intake_resume_token, step);
    const optOutUrl = buildOptOutUrl(origin, candidate.intake_resume_token);

    const sendResult = await sendReminder(candidate, resumeUrl, optOutUrl, reminderNumber);
    if (!sendResult.sent) {
      results.push({ requestId: candidate.id, action: 'skipped', reason: sendResult.reason });
      continue;
    }

    const sentColumn = reminderNumber === 1 ? 'abandon_first_sent_at' : 'abandon_second_sent_at';
    await supabase
      .from('preview_requests')
      .update({ [sentColumn]: new Date().toISOString() })
      .eq('id', candidate.id);

    results.push({ requestId: candidate.id, action: 'sent', reminderNumber });
  }

  return json(200, {
    ok: true,
    checked: reminderCandidates.length,
    results,
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
