import 'server-only';

import { Buffer } from 'buffer';
import { credentialAsJson, credentialValue, getProviderCredential } from '@/lib/admin/credentials';

type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
};

function authHeader(apiKey: string, apiSecret: string) {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
}

async function cloudinaryConfig() {
  const credential = await getProviderCredential('cloudinary');
  const parsed = credentialAsJson(credential.secret);
  const cloudName = credentialValue(credential.secret, 'CLOUDINARY_CLOUD_NAME') || (typeof parsed.cloudName === 'string' ? parsed.cloudName : null);
  const apiKey = credentialValue(credential.secret, 'CLOUDINARY_API_KEY') || (typeof parsed.apiKey === 'string' ? parsed.apiKey : null);
  const apiSecret = credentialValue(credential.secret, 'CLOUDINARY_API_SECRET') || (typeof parsed.apiSecret === 'string' ? parsed.apiSecret : null);

  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export async function uploadImageToCloudinary(params: {
  file: string | Blob;
  publicId: string;
  folder?: string;
  tags?: string[];
  context?: Record<string, string>;
  overwrite?: boolean;
}): Promise<CloudinaryUploadResult | null> {
  const config = await cloudinaryConfig();
  if (!config) return null;

  const form = new FormData();
  form.set('file', params.file);
  form.set('public_id', params.publicId);
  form.set('overwrite', params.overwrite === false ? 'false' : 'true');
  if (params.folder) form.set('folder', params.folder);
  if (params.tags?.length) form.set('tags', params.tags.join(','));
  if (params.context && Object.keys(params.context).length) {
    form.set(
      'context',
      Object.entries(params.context)
        .map(([key, value]) => `${key}=${String(value).replace(/\|/g, '-')}`)
        .join('|')
    );
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(config.apiKey, config.apiSecret),
    },
    body: form,
  }).catch(() => null);

  if (!response?.ok) return null;

  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof json.secure_url !== 'string' || typeof json.public_id !== 'string') return null;

  return {
    secureUrl: json.secure_url,
    publicId: json.public_id,
    resourceType: typeof json.resource_type === 'string' ? json.resource_type : 'image',
    bytes: typeof json.bytes === 'number' ? json.bytes : null,
    width: typeof json.width === 'number' ? json.width : null,
    height: typeof json.height === 'number' ? json.height : null,
  };
}
