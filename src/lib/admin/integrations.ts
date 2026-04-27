import 'server-only';

import { getAdminPlatformProviders, type PlatformProviderCategory, type ProviderDefinition } from '@/lib/platform/catalog';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type AdminIntegrationConnection = {
  id: string;
  provider_key: string;
  status: string;
  connection_type: string;
  site_id: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  public_config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  has_credentials: boolean;
};

export type AdminIntegrationStatus = ProviderDefinition & {
  configured: boolean;
  missingEnv: string[];
  connections: AdminIntegrationConnection[];
};

export type AdminIntegrationsData = {
  providers: AdminIntegrationStatus[];
  byCategory: Array<{
    category: PlatformProviderCategory;
    providers: AdminIntegrationStatus[];
  }>;
};

function envConfigured(envKey: string) {
  return Boolean(process.env[envKey]?.trim());
}

async function getConnections() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('integration_connections')
    .select('id, provider_key, status, connection_type, site_id, last_sync_at, last_error, public_config, metadata, integration_credentials(id)')
    .order('updated_at', { ascending: false })
    .limit(500);

  if (
    error &&
    (error.code === '42P01' ||
      error.message?.includes('integration_connections') ||
      error.message?.includes('relation') ||
      error.message?.includes('schema cache'))
  ) {
    return [] as AdminIntegrationConnection[];
  }

  if (error) {
    console.error('[Admin Integrations] Connection lookup failed:', error);
    return [] as AdminIntegrationConnection[];
  }

  return (data ?? []).map((connection) => {
    const record = connection as unknown as AdminIntegrationConnection & { integration_credentials?: Array<{ id: string }> };
    return {
      id: record.id,
      provider_key: record.provider_key,
      status: record.status,
      connection_type: record.connection_type,
      site_id: record.site_id,
      last_sync_at: record.last_sync_at,
      last_error: record.last_error,
      public_config: asRecord(record.public_config),
      metadata: asRecord(record.metadata),
      has_credentials: Boolean(record.integration_credentials?.length),
    };
  });
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function seededStatus(provider: ProviderDefinition) {
  const method = provider.preferredConnectionType ?? provider.connectionType;
  if (method === 'oauth') return 'pending_admin';
  if (method === 'api_key') return 'connected';
  return 'pending_admin';
}

export async function seedEnvBackedIntegrationConnections() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('integration_connections')
    .select('provider_key')
    .limit(1000);

  if (
    error &&
    (error.code === '42P01' ||
      error.message?.includes('integration_connections') ||
      error.message?.includes('relation') ||
      error.message?.includes('schema cache'))
  ) {
    return 0;
  }

  if (error) {
    console.error('[Admin Integrations] Env seed lookup failed:', error);
    return 0;
  }

  const existingProviders = new Set((data ?? []).map((connection) => String(connection.provider_key)));
  const now = new Date().toISOString();
  const rows = getAdminPlatformProviders()
    .filter((provider) => Boolean(provider.envKeys?.length))
    .filter((provider) => provider.envKeys!.every(envConfigured))
    .filter((provider) => !existingProviders.has(provider.key))
    .map((provider) => {
      const method = provider.preferredConnectionType ?? provider.connectionType;
      return {
        provider_key: provider.key,
        connection_type: method,
        status: seededStatus(provider),
        setup_checklist: method === 'oauth'
          ? ['OAuth app credentials are configured in the server environment.', 'Build or complete the authorization flow.', 'Authorize the needed account/location/property.']
          : ['Credential is available from the server environment.', 'Run a connection test from admin.', 'Move to encrypted credential storage later if this should be editable from admin.'],
        public_config: {
          label: 'Server environment',
          notes: method === 'oauth'
            ? 'OAuth app/client credentials are configured in .env. Owner/account authorization is still required.'
            : 'Credential is configured in .env. The secret is not duplicated into the database.',
        },
        metadata: {
          credential_source: 'server_env',
          created_from: 'env_auto_seed',
          seeded_at: now,
          env_keys_present: provider.envKeys,
        },
      };
    });

  if (!rows.length) return 0;

  const { error: insertError } = await supabase.from('integration_connections').insert(rows);
  if (insertError) {
    console.error('[Admin Integrations] Env seed insert failed:', insertError);
    return 0;
  }

  return rows.length;
}

export async function getAdminIntegrationsData(): Promise<AdminIntegrationsData> {
  const connections = await getConnections();
  const connectionsByProvider = new Map<string, AdminIntegrationConnection[]>();

  for (const connection of connections) {
    connectionsByProvider.set(connection.provider_key, [
      ...(connectionsByProvider.get(connection.provider_key) ?? []),
      connection,
    ]);
  }

  const providers = getAdminPlatformProviders().map((provider) => {
    const missingEnv = (provider.envKeys ?? []).filter((envKey) => !envConfigured(envKey));
    const providerConnections = connectionsByProvider.get(provider.key) ?? [];
    const hasEnvFallback = Boolean(provider.envKeys?.length) && missingEnv.length === 0;
    return {
      ...provider,
      configured: hasEnvFallback || providerConnections.some((connection) => connection.status === 'connected'),
      missingEnv,
      connections: providerConnections,
    };
  });

  const categories = [...new Set(providers.map((provider) => provider.category))];

  return {
    providers,
    byCategory: categories.map((category) => ({
      category,
      providers: providers.filter((provider) => provider.category === category),
    })),
  };
}
