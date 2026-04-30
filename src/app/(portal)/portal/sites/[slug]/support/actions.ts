'use server';

import { Resend } from 'resend';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { assertOwnsRestaurant, requirePortalUser } from '@/lib/portal/auth';
import { escapeHtml } from '@/lib/intake/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const REQUEST_TYPES = new Set([
  'menu_hours',
  'copy',
  'photo',
  'layout',
  'seo',
  'integration',
  'support',
]);

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function cleanRequestType(value: string) {
  return REQUEST_TYPES.has(value) ? value : 'support';
}

async function notifySupport({
  title,
  description,
  requestType,
  restaurantName,
  slug,
  customerEmail,
}: {
  title: string;
  description: string | null;
  requestType: string;
  restaurantName: string;
  slug: string;
  customerEmail: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!apiKey) return;

  try {
    const resend = new Resend(apiKey);
    const from = process.env.EMAIL_FROM || 'Sabor Web <hello@saborweb.com>';

    await resend.emails.send({
      from,
      to: [customerEmail],
      subject: `We received your Sabor Web request - ${restaurantName}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;padding:32px;color:#17130f">
          <h2 style="margin:0 0 8px;color:#ba4f32">Request received</h2>
          <p style="margin:0 0 24px;color:#6d625b">We received your request for ${escapeHtml(restaurantName)} and will follow up soon.</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#756b63">Type</td><td>${escapeHtml(requestType.replaceAll('_', ' '))}</td></tr>
            <tr><td style="padding:8px 0;color:#756b63">Title</td><td>${escapeHtml(title)}</td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;border-radius:8px;background:#f6f1ea;white-space:pre-wrap">${escapeHtml(description ?? '')}</div>
        </div>
      `,
    });

    if (!notifyEmail) return;

    await resend.emails.send({
      from,
      to: [notifyEmail],
      subject: `Portal request - ${restaurantName}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;padding:32px;color:#17130f">
          <h2 style="margin:0 0 8px;color:#ba4f32">New portal request</h2>
          <p style="margin:0 0 24px;color:#6d625b">${escapeHtml(restaurantName)} submitted a request from the customer portal.</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#756b63;width:150px">Restaurant</td><td>${escapeHtml(restaurantName)}</td></tr>
            <tr><td style="padding:8px 0;color:#756b63">Slug</td><td>${escapeHtml(slug)}</td></tr>
            <tr><td style="padding:8px 0;color:#756b63">Owner email</td><td>${escapeHtml(customerEmail)}</td></tr>
            <tr><td style="padding:8px 0;color:#756b63">Type</td><td>${escapeHtml(requestType.replaceAll('_', ' '))}</td></tr>
            <tr><td style="padding:8px 0;color:#756b63">Title</td><td>${escapeHtml(title)}</td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;border-radius:8px;background:#f6f1ea;white-space:pre-wrap">${escapeHtml(description ?? '')}</div>
        </div>
      `,
    });
  } catch (error) {
    console.warn('[portal:support] Failed to send support notification email.', error);
  }
}

export async function submitPortalSupportRequest(formData: FormData) {
  const slug = formString(formData, 'slug');
  if (!slug) redirect('/portal/sites?error=missing-site');

  const user = await requirePortalUser(`/portal/sites/${slug}/support`);
  const access = await assertOwnsRestaurant(user.id, slug, { access: 'edit' });

  const requestType = cleanRequestType(formString(formData, 'requestType'));
  const title = formString(formData, 'title');
  const description = formString(formData, 'description');

  if (!title || !description) redirect(`/portal/sites/${slug}/support?error=missing-fields`);

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('change_requests').insert({
    site_id: access.site.id,
    customer_account_id: access.customer.id,
    request_type: requestType,
    title,
    description,
    submitted_payload: {
      source: 'portal',
      siteSlug: access.site.slug,
      membershipRole: access.membership.role,
      form: 'support',
    },
    metadata: {
      submittedByAuthUserId: user.id,
      submittedByEmail: access.customer.email,
      restaurantName: access.site.restaurantName,
      portalPath: `/portal/sites/${slug}/support`,
    },
  });

  if (error) redirect(`/portal/sites/${slug}/support?error=save-failed`);

  await notifySupport({
    title,
    description,
    requestType,
    restaurantName: access.site.restaurantName,
    slug: access.site.slug,
    customerEmail: access.customer.email,
  });

  revalidatePath(`/portal/sites/${slug}`);
  revalidatePath(`/portal/sites/${slug}/support`);
  redirect(`/portal/sites/${slug}/support?submitted=1`);
}
