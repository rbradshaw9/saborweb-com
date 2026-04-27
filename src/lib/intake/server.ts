import { createHash, randomBytes } from 'crypto';
import { Resend } from 'resend';
import type { PreviewRequestRecord } from '@/lib/intake/shared';

export function createIntakeToken() {
  return randomBytes(32).toString('base64url');
}

export function hashIntakeToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function getRequestOrigin(req: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  return new URL(req.url).origin;
}

export function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function asNullableString(value: unknown) {
  const text = readString(value);
  return text.length ? text : null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendPreviewRequestEmail(request: PreviewRequestRecord, verifyUrl: string, intakeUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  if (request.email) {
    await resend.emails.send({
      from: 'Sabor Web <noreply@saborweb.com>',
      to: [request.email],
      subject: `Verify your Sabor Web preview - ${request.restaurant_name}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;padding:32px;color:#17130f">
          <h2 style="margin:0 0 8px;color:#ba4f32">Verify your preview request</h2>
          <p style="margin:0 0 18px;color:#6d625b">Click below to verify your email and open the private intake for ${escapeHtml(request.restaurant_name)}.</p>
          <p style="margin:24px 0"><a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:#ba4f32;color:#fffaf2;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:6px">Verify and continue</a></p>
          <p style="margin:0;color:#6d625b;font-size:13px">If the button does not work, copy this link: ${escapeHtml(verifyUrl)}</p>
        </div>
      `,
    });
  }

  if (!notifyEmail) return;
  await resend.emails.send({
    from: 'Sabor Web <noreply@saborweb.com>',
    to: [notifyEmail],
    subject: `New preview request - ${request.restaurant_name}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;padding:32px;color:#17130f">
        <h2 style="margin:0 0 8px;color:#ba4f32">New preview request</h2>
        <p style="margin:0 0 24px;color:#6d625b">A restaurant started the Sabor Web intake flow.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#756b63;width:150px">Restaurant</td><td>${escapeHtml(request.restaurant_name)}</td></tr>
          <tr><td style="padding:8px 0;color:#756b63">Owner</td><td>${escapeHtml(request.owner_name)}</td></tr>
          <tr><td style="padding:8px 0;color:#756b63">Phone</td><td>${escapeHtml(request.phone)}</td></tr>
          <tr><td style="padding:8px 0;color:#756b63">Email</td><td>${escapeHtml(request.email ?? '-')}</td></tr>
          <tr><td style="padding:8px 0;color:#756b63">City</td><td>${escapeHtml(request.city)}</td></tr>
          <tr><td style="padding:8px 0;color:#756b63">Client slug</td><td>${escapeHtml(request.client_slug)}</td></tr>
        </table>
        <p style="margin:24px 0 0"><a href="${escapeHtml(verifyUrl)}" style="color:#ba4f32;font-weight:700">Owner verification link</a></p>
        <p style="margin:8px 0 0"><a href="${escapeHtml(intakeUrl)}" style="color:#ba4f32;font-weight:700">Admin intake link</a></p>
      </div>
    `,
  });
}

export async function sendIntakeCompleteEmail(request: PreviewRequestRecord, brief: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!apiKey || !notifyEmail) return;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: 'Sabor Web <noreply@saborweb.com>',
    to: [notifyEmail],
    subject: `Build-ready intake - ${request.restaurant_name}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:760px;margin:0 auto;padding:32px;color:#17130f">
        <h2 style="margin:0 0 8px;color:#ba4f32">Build-ready intake complete</h2>
        <p style="margin:0 0 24px;color:#6d625b">Use this as the starting brief for the preview build.</p>
        <pre style="white-space:pre-wrap;background:#f6f1ea;border:1px solid #e4d8ca;border-radius:8px;padding:20px;line-height:1.6">${escapeHtml(brief)}</pre>
      </div>
    `,
  });
}
