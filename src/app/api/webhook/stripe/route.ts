import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// ─── CLIENT → PROJECT MAP ────────────────────────────────────────────────────
// Maps the `client` param from checkout URLs to Vercel project IDs.
// Add new clients here as they onboard.
const CLIENT_PROJECTS: Record<string, string> = {
  rebar: 'prj_5ePdnMUKfVSE5vSVEVQYbw4apR32',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function vercelRequest(path: string, method: string, body?: object) {
  const token = process.env.VERCEL_API_TOKEN!;
  const res = await fetch(`https://api.vercel.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Vercel API error: ${JSON.stringify(data)}`);
  return data;
}

// Set NEXT_PUBLIC_PREVIEW_MODE=false on the project (upsert — creates or updates)
async function disablePreviewMode(projectId: string) {
  await vercelRequest(
    `/v10/projects/${projectId}/env?upsert=true&teamId=team_jcz9w4xkhdHXO4YdyTlaQjhn`,
    'POST',
    {
      key: 'NEXT_PUBLIC_PREVIEW_MODE',
      value: 'false',
      type: 'plain',
      target: ['production', 'preview'],
      comment: 'Auto-disabled by Sabor Web payment webhook',
    }
  );
}

// Trigger a redeploy by POSTing to the project's deploy hook
async function triggerRedeploy(deployHookUrl: string) {
  const res = await fetch(deployHookUrl, { method: 'POST' });
  if (!res.ok) throw new Error(`Deploy hook failed: ${res.status}`);
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const pkg = session.metadata?.package_name ?? 'Unknown';
    const client = session.metadata?.client ?? null;
    const amount = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : 'N/A';
    const customerEmail = session.customer_details?.email ?? 'N/A';

    console.log(`[Webhook] Payment received — client: ${client}, package: ${pkg}, amount: ${amount}`);

    // 1) Send email notification to Sabor Web
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Sabor Web Payments <onboarding@resend.dev>',
        to: process.env.NOTIFY_EMAIL!,
        subject: `💰 New Client Payment — ${client ?? 'Unknown'} · ${pkg}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
            <h2 style="color:#C4923A;margin-bottom:4px">New Payment Received</h2>
            <p style="color:#888;margin-top:0">Sabor Web · Stripe Webhook</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#888;width:120px">Client</td><td style="font-weight:600">${client ?? '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#888">Plan</td><td style="font-weight:600">${pkg}</td></tr>
              <tr><td style="padding:8px 0;color:#888">Amount</td><td style="font-weight:600">${amount}</td></tr>
              <tr><td style="padding:8px 0;color:#888">Customer</td><td>${customerEmail}</td></tr>
              <tr><td style="padding:8px 0;color:#888">Session ID</td><td style="font-size:12px;color:#aaa">${session.id}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
            ${client && CLIENT_PROJECTS[client] ? `
            <p style="color:#27ae60;font-weight:600">✓ Automatically flipping ${client} site to LIVE.</p>
            <p style="color:#888;font-size:13px">The preview banner will disappear after the site redeploys (~60 seconds).</p>
            ` : `
            <p style="color:#e67e22">⚠ Unknown client — no auto-redeploy triggered. Visit Vercel to disable preview mode manually.</p>
            `}
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[Webhook] Email failed:', emailErr);
      // Don't fail the webhook over email — continue
    }

    // 2) Auto-disable preview mode + redeploy for known clients
    if (client && CLIENT_PROJECTS[client]) {
      const projectId = CLIENT_PROJECTS[client];
      const deployHookEnvKey = `DEPLOY_HOOK_${client.toUpperCase()}`;
      const deployHookUrl = process.env[deployHookEnvKey];

      try {
        await disablePreviewMode(projectId);
        console.log(`[Webhook] NEXT_PUBLIC_PREVIEW_MODE=false set on ${client}`);
      } catch (err) {
        console.error(`[Webhook] Failed to update env var for ${client}:`, err);
      }

      if (deployHookUrl) {
        try {
          await triggerRedeploy(deployHookUrl);
          console.log(`[Webhook] Redeploy triggered for ${client}`);
        } catch (err) {
          console.error(`[Webhook] Redeploy failed for ${client}:`, err);
        }
      } else {
        console.warn(`[Webhook] No deploy hook found for ${client} (set ${deployHookEnvKey} in saborweb env vars)`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
