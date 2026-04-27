import { chromium } from '@playwright/test';
import { promises as fs } from 'fs';

const outputFile = process.argv[2] || process.env.SABORWEB_META_CAPTURE_FILE;

if (!outputFile) {
  console.error('Missing output file for Meta session capture.');
  process.exit(1);
}

const AUTH_COOKIE_NAMES = new Set([
  'c_user',
  'xs',
  'sessionid',
  'ds_user_id',
]);

function hasAuthCookies(cookies) {
  return cookies.some((cookie) => AUTH_COOKIE_NAMES.has(cookie.name));
}

async function main() {
  const browser = await chromium.launch({ headless: false });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      locale: 'en-US',
    });

    const instagram = await context.newPage();
    await instagram.goto('https://www.instagram.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    }).catch(() => undefined);

    const facebook = await context.newPage();
    await facebook.goto('https://www.facebook.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    }).catch(() => undefined);

    const startedAt = Date.now();
    const timeoutMs = 8 * 60 * 1000;

    while (Date.now() - startedAt < timeoutMs) {
      const cookies = await context.cookies();
      if (hasAuthCookies(cookies)) {
        const storageState = await context.storageState();
        await fs.writeFile(
          outputFile,
          JSON.stringify({
            capturedAt: new Date().toISOString(),
            storageState,
          }, null, 2),
          'utf8',
        );
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch(async (error) => {
  try {
    await fs.writeFile(
      outputFile,
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Meta session capture failed.',
        capturedAt: new Date().toISOString(),
      }, null, 2),
      'utf8',
    );
  } catch {
    // ignore file write failures here
  }
  process.exit(1);
});
