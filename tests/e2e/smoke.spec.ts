import { expect, test } from '@playwright/test';

test('marketing home page loads', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Tu pagina web lista|Tu p[aá]gina web lista|Your restaurant website/i);
  await expect(page.getByRole('link', { name: /preview|free/i }).first()).toBeVisible();
});

test('admin login page loads', async ({ page }) => {
  await page.goto('/admin/login');

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});

test('cinco de maya preview loads', async ({ page }) => {
  await page.goto('/preview/cinco-de-maya');

  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Cinco/i);
  await expect(page.getByText(/Let's Eat M[aá]s Tacos/i)).toBeVisible();
});
