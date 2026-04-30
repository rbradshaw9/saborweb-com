import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('admin login has no critical accessibility violations', async ({ page }) => {
  await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });

  const results = await new AxeBuilder({ page }).analyze();
  const criticalViolations = results.violations.filter((violation) => violation.impact === 'critical');

  expect(
    criticalViolations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    })),
  ).toEqual([]);
});
