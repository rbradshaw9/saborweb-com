import { expect, test } from '@playwright/test';

test('robots and sitemap expose launch SEO rules', async ({ page, request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBeTruthy();
  const robotsText = await robots.text();
  expect(robotsText).toContain('User-Agent: *');
  expect(robotsText).toContain('Disallow: /admin/');
  expect(robotsText).toContain('Disallow: /api/');
  expect(robotsText).toContain('Sitemap:');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain('<loc>https://saborweb.com</loc>');
  expect(sitemapText).toContain('<loc>https://saborweb.com/contact</loc>');
  expect(sitemapText).toContain('<loc>https://saborweb.com/services</loc>');
  expect(sitemapText).toContain('<loc>https://saborweb.com/es/services</loc>');

  await page.goto('/definitely-not-a-real-page', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/could not find/i);
});

test('brief builder shell loads without a token', async ({ page }) => {
  await page.goto('/brief-builder', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Empecemos|Let's get started/i);
  await expect(page.getByLabel(/Your name|Tu nombre/i)).toBeVisible();
  await expect(page.getByLabel(/Restaurant|Restaurante/i)).toBeVisible();
});

test('spanish marketing route renders and keeps localized navigation', async ({ page }) => {
  await page.goto('/es/services?utm_source=test', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/es\/services\?utm_source=test/);
  await expect(page.getByRole('link', { name: /Servicios/i }).first()).toHaveAttribute('href', '/es/services');

  await page.getByRole('button', { name: /English|EN/ }).first().click();
  await expect(page).toHaveURL(/\/services\?utm_source=test/);
});

test('cron and worker endpoints reject anonymous requests', async ({ request }) => {
  const abandon = await request.get('/api/intake/abandon');
  expect(abandon.status()).toBe(401);

  const worker = await request.get('/api/admin/agent-runs/process');
  expect(worker.status()).toBe(401);

  const seedGoodstart = await request.post('/api/admin/goodstart-content/seed');
  expect(seedGoodstart.status()).toBe(401);
});
