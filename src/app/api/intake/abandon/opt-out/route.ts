import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { escapeHtml, hashIntakeToken } from '@/lib/intake/server';

function html(status: number, title: string, body: string) {
  return new NextResponse(
    `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${escapeHtml(title)}</title>
        </head>
        <body style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;padding:48px 24px;color:#17130f">
          <h1 style="color:#ba4f32">${escapeHtml(title)}</h1>
          <p style="line-height:1.6;color:#6d625b">${escapeHtml(body)}</p>
        </body>
      </html>`,
    {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  if (!token) {
    return html(400, 'Missing link', 'This opt-out link is missing its token.');
  }

  const supabase = getSupabaseAdmin();
  const { data: requestRecord, error: lookupError } = await supabase
    .from('preview_requests')
    .select('id')
    .eq('intake_token_hash', hashIntakeToken(token))
    .maybeSingle();

  if (lookupError || !requestRecord) {
    return html(404, 'Link not found', 'We could not find this reminder link.');
  }

  const { error } = await supabase
    .from('preview_requests')
    .update({ abandon_opted_out_at: new Date().toISOString() })
    .eq('id', requestRecord.id);

  if (error) {
    console.error('[Intake Abandon Opt-Out] Update failed:', error);
    return html(500, 'Could not update preferences', 'Please reply to the email and we will help.');
  }

  return html(200, 'Reminder emails stopped', 'We will not send more unfinished-brief reminders for this preview request.');
}
