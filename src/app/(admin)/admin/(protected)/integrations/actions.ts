'use server';

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminUser } from '@/lib/admin/auth';
import { runIntegrationConnectionTest } from '@/lib/admin/integration-testers';
import { seedEnvBackedIntegrationConnections } from '@/lib/admin/integrations';
import { getAdminPlatformProviders, type IntegrationConnectionType } from '@/lib/platform/catalog';
import { encryptSecret } from '@/lib/security/encryption';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const CONNECTION_TYPES = new Set<IntegrationConnectionType>(['oauth', 'delegated_access', 'link_embed', 'api_key']);

function getProvider(providerKey: string) {
  return getAdminPlatformProviders().find((provider) => provider.key === providerKey) ?? null;
}

function readConnectionType(formData: FormData, fallback: IntegrationConnectionType): IntegrationConnectionType {
  const requested = String(formData.get('connection_type') ?? fallback);
  return CONNECTION_TYPES.has(requested as IntegrationConnectionType) ? requested as IntegrationConnectionType : fallback;
}

function nullableString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim();
  return value.length ? value : null;
}

function readSecretValue(providerKey: string, formData: FormData) {
  if (providerKey === 'cloudinary') {
    const cloudName = nullableString(formData, 'cloudinary_cloud_name');
    const apiKey = nullableString(formData, 'cloudinary_api_key');
    const apiSecret = nullableString(formData, 'cloudinary_api_secret');
    if (!cloudName && !apiKey && !apiSecret) return null;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary requires cloud name, API key, and API secret.');
    }
    return JSON.stringify({ cloudName, apiKey, apiSecret });
  }

  if (providerKey === 'google_maps_places') {
    return nullableString(formData, 'google_maps_api_key') ?? nullableString(formData, 'secret_value');
  }

  if (providerKey === 'twilio') {
    const accountSid = nullableString(formData, 'twilio_account_sid');
    const authToken = nullableString(formData, 'twilio_auth_token');
    const fromNumber = nullableString(formData, 'twilio_from_number');
    if (!accountSid && !authToken && !fromNumber) return null;
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio requires account SID, auth token, and from number.');
    }
    return JSON.stringify({ accountSid, authToken, fromNumber });
  }

  if (providerKey === 'sanity') {
    const projectId = nullableString(formData, 'sanity_project_id');
    const dataset = nullableString(formData, 'sanity_dataset') ?? 'production';
    const apiToken = nullableString(formData, 'sanity_api_token');
    if (!projectId && !apiToken) return null;
    if (!projectId || !apiToken) {
      throw new Error('Sanity requires project ID and API token.');
    }
    return JSON.stringify({ projectId, dataset, apiToken });
  }

  if (providerKey === 'uploadcare') {
    const publicKey = nullableString(formData, 'uploadcare_public_key');
    const secretKey = nullableString(formData, 'uploadcare_secret_key');
    if (!publicKey && !secretKey) return null;
    if (!publicKey || !secretKey) {
      throw new Error('Uploadcare requires public key and secret key.');
    }
    return JSON.stringify({ publicKey, secretKey });
  }

  if (providerKey === 'meta_research_session') {
    return nullableString(formData, 'session_state_json') ?? nullableString(formData, 'secret_value');
  }

  return nullableString(formData, 'secret_value');
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

const META_AUTH_COOKIE_NAMES = new Set(['c_user', 'xs', 'sessionid', 'ds_user_id']);

function metaCaptureFile(connectionId: string) {
  return path.join(os.tmpdir(), `saborweb-meta-session-${connectionId}.json`);
}

async function ensureMetaResearchConnection(createdByEmail: string) {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from('integration_connections')
    .select('id, provider_key, status, connection_type, metadata, public_config')
    .eq('provider_key', 'meta_research_session')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data: created, error } = await supabase
    .from('integration_connections')
    .insert({
      provider_key: 'meta_research_session',
      connection_type: 'delegated_access',
      status: 'pending_admin',
      setup_checklist: [
        'Start guided capture from admin.',
        'Log into the dedicated SaborWeb Meta research account in the opened browser.',
        'Return to admin and complete capture.',
      ],
      public_config: {
        label: 'Dedicated Meta research account',
      },
      metadata: {
        created_from: 'admin_integrations',
        created_by: createdByEmail,
      },
    })
    .select('id, provider_key, status, connection_type, metadata, public_config')
    .single();

  if (error || !created) {
    console.error('[Admin Integrations] Could not create Meta research session connection:', error);
    throw new Error('Could not create the Meta research session connection.');
  }

  return created;
}

export async function createIntegrationConnection(providerKey: string, formData: FormData) {
  const user = await requireAdminUser();
  const provider = getProvider(providerKey);

  if (!provider) throw new Error('Unknown integration provider.');

  const connectionType = readConnectionType(formData, provider.preferredConnectionType ?? provider.connectionType);
  const supabase = getSupabaseAdmin();
  const secretValue = readSecretValue(provider.key, formData);
  const publicConfig = {
    label: nullableString(formData, 'label'),
    setup_url: nullableString(formData, 'setup_url'),
    notes: nullableString(formData, 'notes'),
  };
  const setupChecklist = connectionType === 'oauth'
    ? ['Authorize the provider account with the minimum required scopes.', 'Select the correct restaurant/location/property.', 'Confirm sync status after authorization.']
    : connectionType === 'api_key'
      ? ['Add the provider API key/token in the server environment or encrypted credential store.', 'Verify the key with a test call.', 'Rotate/revoke old credentials after replacement.']
      : connectionType === 'link_embed'
        ? ['Collect the owner/provider link or embed.', 'Test it on staging.', 'Publish only after admin QA.']
        : ['Send owner/provider delegation instructions.', 'Confirm access was granted.', 'Mark setup active after admin verification.'];

  const { data: connection, error } = await supabase.from('integration_connections').insert({
    provider_key: provider.key,
    connection_type: connectionType,
    status:
      secretValue && (connectionType === 'api_key' || provider.key === 'meta_research_session')
        ? 'connected'
        : connectionType === 'oauth'
          ? 'needs_owner_action'
          : connectionType === 'api_key'
            ? 'pending_admin'
            : 'needs_owner_action',
    setup_checklist: setupChecklist,
    public_config: publicConfig,
    metadata: {
      created_from: 'admin_integrations',
      created_by: user.email,
      provider_name: provider.name,
      has_encrypted_credential: Boolean(secretValue),
    },
  }).select('id').single();

  if (error || !connection) {
    console.error('[Admin Integrations] Create connection failed:', error);
    throw new Error('Could not create integration connection.');
  }

  if (secretValue) {
    const { error: credentialError } = await supabase.from('integration_credentials').insert({
      integration_connection_id: connection.id,
      provider_key: provider.key,
      credential_kind: connectionType === 'oauth' ? 'oauth_token' : provider.key === 'meta_research_session' ? 'other' : 'api_key',
      secret_ciphertext: encryptSecret(secretValue),
      metadata: {
        created_from: 'admin_integrations',
        created_by: user.email,
      },
    });

    if (credentialError) {
      console.error('[Admin Integrations] Credential save failed:', credentialError);
      throw new Error('Connection was created, but the credential could not be saved.');
    }
  }

  revalidatePath('/admin/integrations');
}

export async function importEnvBackedIntegrations() {
  await requireAdminUser();
  const count = await seedEnvBackedIntegrationConnections();
  console.info(`[Admin Integrations] Imported ${count} env-backed integration connection(s).`);
  revalidatePath('/admin/integrations');
}

export async function updateIntegrationConnection(connectionId: string, formData: FormData) {
  const user = await requireAdminUser();
  const status = nullableString(formData, 'status');
  const lastError = nullableString(formData, 'last_error');
  const label = nullableString(formData, 'label');
  const notes = nullableString(formData, 'notes');
  const setupUrl = nullableString(formData, 'setup_url');
  const allowedStatuses = new Set(['not_connected', 'needs_owner_action', 'pending_admin', 'connected', 'expired', 'blocked', 'disconnected']);

  if (!status || !allowedStatuses.has(status)) throw new Error('Invalid integration status.');

  const supabase = getSupabaseAdmin();
  const { data: existingConnection, error: lookupError } = await supabase
    .from('integration_connections')
    .select('id, provider_key, connection_type')
    .eq('id', connectionId)
    .single();

  if (lookupError || !existingConnection) {
    console.error('[Admin Integrations] Update connection lookup failed:', lookupError);
    throw new Error('Could not find integration connection.');
  }

  const secretValue = readSecretValue(existingConnection.provider_key, formData);
  const { data: connection, error } = await supabase
    .from('integration_connections')
    .update({
      status,
      last_error: lastError,
      public_config: {
        label,
        notes,
        setup_url: setupUrl,
      },
      last_sync_at: status === 'connected' ? new Date().toISOString() : undefined,
    })
    .eq('id', connectionId)
    .select('id, provider_key, connection_type')
    .single();

  if (error || !connection) {
    console.error('[Admin Integrations] Update connection failed:', error);
    throw new Error('Could not update integration connection.');
  }

  if (secretValue) {
    const { error: credentialError } = await supabase.from('integration_credentials').insert({
      integration_connection_id: connection.id,
      provider_key: connection.provider_key,
      credential_kind: connection.connection_type === 'oauth' ? 'oauth_token' : connection.provider_key === 'meta_research_session' ? 'other' : 'api_key',
      secret_ciphertext: encryptSecret(secretValue),
      metadata: {
        replaced_from: 'admin_integrations',
        replaced_by: user.email,
      },
    });

    if (credentialError) {
      console.error('[Admin Integrations] Credential replace failed:', credentialError);
      throw new Error('Connection was updated, but the replacement credential could not be saved.');
    }
  }

  revalidatePath('/admin/integrations');
}

export async function reconnectIntegrationConnection(connectionId: string) {
  await requireAdminUser();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('integration_connections')
    .update({
      status: 'needs_owner_action',
      last_error: null,
      metadata: {
        reconnect_requested_at: new Date().toISOString(),
      },
    })
    .eq('id', connectionId);

  if (error) {
    console.error('[Admin Integrations] Reconnect failed:', error);
    throw new Error('Could not request reconnect.');
  }

  revalidatePath('/admin/integrations');
}

export async function startMetaResearchSessionCapture() {
  const user = await requireAdminUser();
  const supabase = getSupabaseAdmin();
  const connection = await ensureMetaResearchConnection(user.email ?? 'admin');
  const captureFile = metaCaptureFile(connection.id);

  await fs.rm(captureFile, { force: true }).catch(() => undefined);

  const { error } = await supabase
    .from('integration_connections')
    .update({
      status: 'pending_admin',
      last_error: null,
      metadata: {
        ...asRecord(connection.metadata),
        capture_status: 'waiting_for_browser',
        capture_file: captureFile,
        capture_started_at: new Date().toISOString(),
        capture_started_by: user.email,
      },
      public_config: {
        ...asRecord(connection.public_config),
        label: 'Dedicated Meta research account',
      },
    })
    .eq('id', connection.id);

  if (error) {
    console.error('[Admin Integrations] Meta capture start update failed:', error);
    throw new Error('Could not start Meta session capture.');
  }

  const scriptPath = path.join(process.cwd(), 'scripts', 'meta-session-capture.mjs');
  const child = spawn(process.execPath, [scriptPath, captureFile], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      SABORWEB_META_CAPTURE_FILE: captureFile,
    },
  });
  child.unref();

  revalidatePath('/admin/integrations');
  redirect('/admin/integrations?meta_capture=started');
}

export async function completeMetaResearchSessionCapture(connectionId: string) {
  await requireAdminUser();
  const supabase = getSupabaseAdmin();
  const { data: connection, error: lookupError } = await supabase
    .from('integration_connections')
    .select('id, provider_key, metadata, public_config')
    .eq('id', connectionId)
    .eq('provider_key', 'meta_research_session')
    .single();

  if (lookupError || !connection) {
    console.error('[Admin Integrations] Meta capture complete lookup failed:', lookupError);
    throw new Error('Could not find the Meta research session connection.');
  }

  const metadata = asRecord(connection.metadata);
  const captureFile = typeof metadata.capture_file === 'string' && metadata.capture_file.trim()
    ? metadata.capture_file
    : metaCaptureFile(connection.id);
  const content = await fs.readFile(captureFile, 'utf8').catch(() => null);

  if (!content) {
    throw new Error('No captured Meta session was found yet. Finish logging in and try Complete capture again.');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = asRecord(JSON.parse(content));
  } catch {
    throw new Error('Captured Meta session file is invalid. Start the guided capture again.');
  }

  if (typeof parsed.error === 'string' && parsed.error.trim()) {
    throw new Error(`Guided Meta capture failed: ${parsed.error.trim()}`);
  }

  const storageState = asRecord(parsed.storageState);
  const cookies = Array.isArray(storageState.cookies)
    ? storageState.cookies
    : Array.isArray(parsed.cookies)
      ? parsed.cookies
      : [];
  const authCookieCount = cookies.filter((cookie) => {
    const name = typeof asRecord(cookie).name === 'string' ? String(asRecord(cookie).name) : '';
    return META_AUTH_COOKIE_NAMES.has(name);
  }).length;

  if (!cookies.length || !authCookieCount) {
    throw new Error(
      !cookies.length
        ? 'The captured Meta session did not include cookies. Start the guided capture again and make sure login completes.'
        : 'The captured Meta session did not include usable Meta auth cookies. Start the guided capture again and finish logging into Facebook or Instagram.'
    );
  }

  const { error: credentialError } = await supabase.from('integration_credentials').insert({
    integration_connection_id: connection.id,
    provider_key: 'meta_research_session',
    credential_kind: 'other',
    secret_ciphertext: encryptSecret(JSON.stringify(parsed)),
    metadata: {
      created_from: 'guided_meta_capture',
      cookie_count: cookies.length,
      auth_cookie_count: authCookieCount,
    },
  });

  if (credentialError) {
    console.error('[Admin Integrations] Meta capture credential save failed:', credentialError);
    throw new Error('Meta session was captured, but it could not be saved.');
  }

  const { error: updateError } = await supabase
    .from('integration_connections')
    .update({
      status: 'connected',
      last_error: null,
      last_sync_at: new Date().toISOString(),
      metadata: {
        ...metadata,
        capture_status: 'connected',
        capture_completed_at: new Date().toISOString(),
        cookie_count: cookies.length,
        auth_cookie_count: authCookieCount,
        next_run_mode: 'connected_meta_session',
      },
    })
    .eq('id', connection.id);

  if (updateError) {
    console.error('[Admin Integrations] Meta capture connection update failed:', updateError);
    throw new Error('Meta session was saved, but the connection status could not be updated.');
  }

  await fs.rm(captureFile, { force: true }).catch(() => undefined);
  revalidatePath('/admin/integrations');
  redirect('/admin/integrations?meta_capture=completed');
}

export async function testIntegrationConnection(connectionId: string) {
  await requireAdminUser();
  const supabase = getSupabaseAdmin();
  const { data: connection, error: lookupError } = await supabase
    .from('integration_connections')
    .select('id, provider_key, connection_type, public_config, metadata')
    .eq('id', connectionId)
    .single();

  if (lookupError || !connection) {
    console.error('[Admin Integrations] Test lookup failed:', lookupError);
    throw new Error('Could not find integration connection.');
  }

  const result = await runIntegrationConnectionTest({
    id: connection.id,
    provider_key: connection.provider_key,
    connection_type: connection.connection_type,
    public_config: asRecord(connection.public_config),
  });
  const previousMetadata = asRecord(connection.metadata);
  const testedAt = new Date().toISOString();

  const { error } = await supabase
    .from('integration_connections')
    .update({
      status: result.status,
      last_sync_at: result.ok ? testedAt : null,
      last_error: result.ok ? null : result.message,
      metadata: {
        ...previousMetadata,
        last_tested_at: testedAt,
        last_test_ok: result.ok,
        last_test_status: result.status,
        last_test_message: result.message,
        last_test_details: result.details ?? null,
      },
    })
    .eq('id', connectionId);

  if (error) {
    console.error('[Admin Integrations] Test update failed:', error);
    throw new Error('Could not test integration connection.');
  }

  revalidatePath('/admin/integrations');
  redirect(`/admin/integrations?tested=${connection.provider_key}&result=${result.ok ? 'ok' : 'attention'}`);
}

export async function removeIntegrationConnection(connectionId: string) {
  await requireAdminUser();
  const supabase = getSupabaseAdmin();
  const { error: credentialError } = await supabase
    .from('integration_credentials')
    .delete()
    .eq('integration_connection_id', connectionId);

  if (credentialError) {
    console.error('[Admin Integrations] Credential delete failed:', credentialError);
    throw new Error('Could not remove stored integration credentials.');
  }

  const { error } = await supabase
    .from('integration_connections')
    .update({
      status: 'disconnected',
      last_error: null,
      metadata: {
        disconnected_at: new Date().toISOString(),
        encrypted_credentials_removed: true,
      },
    })
    .eq('id', connectionId);

  if (error) {
    console.error('[Admin Integrations] Disconnect failed:', error);
    throw new Error('Could not disconnect integration.');
  }

  revalidatePath('/admin/integrations');
}

export async function replaceIntegrationConnection(connectionId: string, formData: FormData) {
  await removeIntegrationConnection(connectionId);
  const providerKey = String(formData.get('provider_key') ?? '');
  if (!providerKey) throw new Error('Missing provider key.');
  await createIntegrationConnection(providerKey, formData);
}
