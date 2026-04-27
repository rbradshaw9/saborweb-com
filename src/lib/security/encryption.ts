import 'server-only';

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const VERSION = 'v1';

function getKey() {
  const secret = process.env.INTEGRATION_CREDENTIAL_SECRET?.trim();
  if (!secret) {
    throw new Error('Missing INTEGRATION_CREDENTIAL_SECRET. Add one server-side before saving integration credentials.');
  }

  return createHash('sha256').update(secret).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join(':');
}

export function decryptSecret(value: string) {
  const [version, ivValue, tagValue, ciphertextValue] = value.split(':');
  if (version !== VERSION || !ivValue || !tagValue || !ciphertextValue) {
    throw new Error('Unsupported credential ciphertext format.');
  }

  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
