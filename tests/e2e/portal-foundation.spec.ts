import { expect, test } from '@playwright/test';

test('app subdomain reaches the portal login surface', async ({ request }) => {
  const response = await request.get('/', {
    headers: { 'x-forwarded-host': 'app.saborweb.com' },
  });

  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain('Sabor Web Portal');
  expect(html).toContain('Sign in');
});

test('anonymous portal dashboard redirects to login', async ({ page }) => {
  await page.goto('/portal/sites', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/portal\/login\?next=%2Fportal%2Fsites/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('anonymous portal settings redirects to login', async ({ page }) => {
  await page.goto('/portal/sites/goodstart/settings', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/portal\/login\?next=%2Fportal%2Fsites%2Fgoodstart%2Fsettings/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('anonymous portal hours redirects to login', async ({ page }) => {
  await page.goto('/portal/sites/goodstart/hours', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/portal\/login\?next=%2Fportal%2Fsites%2Fgoodstart%2Fhours/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('anonymous portal menu redirects to login', async ({ page }) => {
  await page.goto('/portal/sites/goodstart/menu', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/portal\/login\?next=%2Fportal%2Fsites%2Fgoodstart%2Fmenu/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('anonymous portal billing redirects to login', async ({ page }) => {
  await page.goto('/portal/sites/goodstart/billing', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/portal\/login\?next=%2Fportal%2Fsites%2Fgoodstart%2Fbilling/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('anonymous portal support redirects to login', async ({ page }) => {
  await page.goto('/portal/sites/goodstart/support', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/portal\/login\?next=%2Fportal%2Fsites%2Fgoodstart%2Fsupport/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('restaurant subdomain still reaches the live generated site', async ({ request }) => {
  const response = await request.get('/', {
    headers: { 'x-forwarded-host': 'goodstart.saborweb.com' },
  });

  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain('Good Start Coastal Cafe');
  expect(html).not.toContain('Sabor Web Portal');
});
