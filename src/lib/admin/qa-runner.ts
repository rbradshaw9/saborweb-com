import 'server-only';

import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { StoredBrowserSession } from '@/lib/admin/credentials';

type AxeSummary = {
  violation_count: number;
  serious_or_worse: number;
  top_violations: Array<{
    id: string;
    impact: string | null;
    description: string;
    affected_nodes: number;
  }>;
};

export type BrowserQaCheck = {
  url: string;
  ok: boolean;
  status: number;
  duration_ms: number;
  title: string | null;
  h1: string | null;
  console_errors: string[];
  page_errors: string[];
  axe?: AxeSummary | null;
  error?: string;
};

export type PageScreenshotCapture = {
  url: string;
  title: string | null;
  screenshot: Buffer;
  visualCandidates: PageVisualCandidate[];
};

export type MenuPageVisualCapture = {
  label: string;
  screenshot: Buffer;
  textExcerpt: string | null;
};

export type MenuPageEvidenceCapture = {
  url: string;
  title: string | null;
  textExcerpt: string | null;
  visualCaptures: MenuPageVisualCapture[];
};

export type PageVisualCandidate = {
  kind: 'social_profile_image' | 'social_cover_image';
  imageUrl: string | null;
  screenshot: Buffer;
  label: string;
};

const PAGE_TIMEOUT_MS = 15_000;

type RawImageProbe = {
  src: string | null;
  alt: string;
  ariaLabel: string;
  className: string;
  width: number;
  height: number;
  x: number;
  y: number;
};

function isSocialHost(url: string) {
  return /instagram\.com|instagr\.am|facebook\.com|fb\.com/i.test(url);
}

function isGoogleMenuViewerUrl(url: string) {
  return /google\.com\/search/i.test(url) && /vssid=menu-viewer-entrypoint/i.test(url);
}

function clipText(value: string | null, length = 2400) {
  if (!value) return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return null;
  return trimmed.length > length ? `${trimmed.slice(0, length)}...` : trimmed;
}

function clipWithinViewport(probe: RawImageProbe) {
  const x = Math.max(0, Math.round(probe.x));
  const y = Math.max(0, Math.round(probe.y));
  const width = Math.max(1, Math.round(probe.width));
  const height = Math.max(1, Math.round(probe.height));
  return { x, y, width, height };
}

function scoreAvatarProbe(probe: RawImageProbe) {
  const ratio = probe.width / Math.max(1, probe.height);
  const combined = `${probe.alt} ${probe.ariaLabel} ${probe.className} ${probe.src ?? ''}`.toLowerCase();
  let score = 0;
  if (probe.width >= 56 && probe.height >= 56) score += 1;
  if (ratio >= 0.8 && ratio <= 1.25) score += 2;
  if (probe.y >= 0 && probe.y <= 420) score += 1.5;
  if (/profile|avatar|photo|picture|profilepic|profile-picture|profile_image/.test(combined)) score += 2.5;
  if (/scontent|cdninstagram|fbcdn/.test(combined)) score += 0.5;
  return score;
}

function scoreCoverProbe(probe: RawImageProbe) {
  const ratio = probe.width / Math.max(1, probe.height);
  const combined = `${probe.alt} ${probe.ariaLabel} ${probe.className} ${probe.src ?? ''}`.toLowerCase();
  let score = 0;
  if (probe.width >= 240 && probe.height >= 100) score += 1;
  if (ratio >= 1.7) score += 2;
  if (probe.y >= 0 && probe.y <= 420) score += 1.5;
  if (/cover|header|banner/.test(combined)) score += 2.5;
  if (/scontent|cdninstagram|fbcdn/.test(combined)) score += 0.5;
  return score;
}

async function captureSocialVisualCandidates(page: Page, url: string) {
  if (!isSocialHost(url)) return [] as PageVisualCandidate[];

  const probes = await page.evaluate(() => {
    return Array.from(document.images)
      .map((img) => {
        const rect = img.getBoundingClientRect();
        return {
          src: img.currentSrc || img.src || null,
          alt: img.getAttribute('alt') || '',
          ariaLabel: img.getAttribute('aria-label') || '',
          className: typeof img.className === 'string' ? img.className : '',
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y,
        };
      })
      .filter((probe) =>
        probe.src &&
        probe.width >= 40 &&
        probe.height >= 40 &&
        probe.x >= 0 &&
        probe.y >= 0 &&
        probe.x + probe.width <= window.innerWidth &&
        probe.y + probe.height <= window.innerHeight
      );
  }) as RawImageProbe[];

  if (!probes.length) return [];

  const avatarProbe = [...probes]
    .sort((left, right) => scoreAvatarProbe(right) - scoreAvatarProbe(left))[0];
  const coverProbe = /facebook\.com|fb\.com/i.test(url)
    ? [...probes].sort((left, right) => scoreCoverProbe(right) - scoreCoverProbe(left))[0]
    : null;

  const visualCandidates: PageVisualCandidate[] = [];

  if (avatarProbe && scoreAvatarProbe(avatarProbe) >= 3) {
    const screenshot = await page.screenshot({
      type: 'png',
      clip: clipWithinViewport(avatarProbe),
      animations: 'disabled',
    }).catch(() => null);
    if (screenshot) {
      visualCandidates.push({
        kind: 'social_profile_image',
        imageUrl: avatarProbe.src,
        screenshot,
        label: 'Social profile image',
      });
    }
  }

  if (coverProbe && scoreCoverProbe(coverProbe) >= 3) {
    const screenshot = await page.screenshot({
      type: 'png',
      clip: clipWithinViewport(coverProbe),
      animations: 'disabled',
    }).catch(() => null);
    if (screenshot) {
      visualCandidates.push({
        kind: 'social_cover_image',
        imageUrl: coverProbe.src,
        screenshot,
        label: 'Social cover image',
      });
    }
  }

  return visualCandidates;
}

async function visibleText(page: Page) {
  return clipText(await page.locator('body').innerText().catch(() => null));
}

async function clickGoogleMenuTabs(page: Page) {
  const labels = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[role="tab"], button, a'));
    return elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: (element.innerText || element.textContent || '').trim(),
          y: rect.y,
          x: rect.x,
          width: rect.width,
          height: rect.height,
        };
      })
      .filter((item) =>
        item.text.length >= 2 &&
        item.text.length <= 32 &&
        item.y >= 0 &&
        item.y <= 260 &&
        item.width >= 36 &&
        item.height >= 20
      )
      .sort((left, right) => left.x - right.x)
      .map((item) => item.text)
      .filter((text, index, values) => values.indexOf(text) === index)
      .slice(0, 5);
  });

  const captures: MenuPageVisualCapture[] = [];
  for (const label of labels) {
    const locator = page.locator('[role="tab"], button, a').filter({ hasText: label }).first();
    const count = await locator.count().catch(() => 0);
    if (!count) continue;
    await locator.click({ timeout: 4_000 }).catch(() => undefined);
    await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => undefined);
    await page.waitForTimeout(350).catch(() => undefined);
    const textExcerpt = await visibleText(page);
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      animations: 'disabled',
    }).catch(() => null);
    if (!screenshot) continue;
    captures.push({
      label: `Google menu tab: ${label}`,
      screenshot,
      textExcerpt,
    });
  }

  return captures;
}

export async function captureMenuPageEvidence(
  urls: string[],
  options?: { storageState?: StoredBrowserSession['storageState'] | null }
): Promise<MenuPageEvidenceCapture[]> {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      locale: 'en-US',
      storageState: options?.storageState ?? undefined,
    });
    const captures: MenuPageEvidenceCapture[] = [];

    for (const url of urls) {
      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
        const title = await page.title().catch(() => null);
        const textExcerpt = await visibleText(page);
        const visualCaptures: MenuPageVisualCapture[] = [];

        const baseScreenshot = await page.screenshot({
          type: 'png',
          fullPage: false,
          animations: 'disabled',
        }).catch(() => null);
        if (baseScreenshot) {
          visualCaptures.push({
            label: 'Visible menu content',
            screenshot: baseScreenshot,
            textExcerpt,
          });
        }

        if (isGoogleMenuViewerUrl(url)) {
          const tabCaptures = await clickGoogleMenuTabs(page).catch(() => []);
          visualCaptures.push(...tabCaptures);
        }

        captures.push({
          url,
          title,
          textExcerpt,
          visualCaptures,
        });
      } catch {
        // Ignore page-level failures; menu research falls back to direct fetch and Firecrawl evidence.
      } finally {
        await page.close();
      }
    }

    await context.close();
    return captures;
  } finally {
    await browser.close();
  }
}

function summarizeAxe(results: Awaited<ReturnType<AxeBuilder['analyze']>>): AxeSummary {
  const seriousOrWorse = results.violations.filter((violation) =>
    violation.impact === 'serious' || violation.impact === 'critical',
  );

  return {
    violation_count: results.violations.length,
    serious_or_worse: seriousOrWorse.length,
    top_violations: results.violations.slice(0, 5).map((violation) => ({
      id: violation.id,
      impact: violation.impact ?? null,
      description: violation.description,
      affected_nodes: violation.nodes.length,
    })),
  };
}

export async function runBrowserQa(urls: string[]): Promise<BrowserQaCheck[]> {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 960 },
    });

    const checks: BrowserQaCheck[] = [];

    for (const url of urls) {
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => {
        pageErrors.push(error.message);
      });

      const started = Date.now();

      try {
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: PAGE_TIMEOUT_MS,
        });
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);

        const title = await page.title().catch(() => null);
        const headings = await page.locator('h1').allInnerTexts().catch(() => []);
        let axe: AxeSummary | null = null;

        try {
          axe = summarizeAxe(await new AxeBuilder({ page }).analyze());
        } catch {
          axe = null;
        }

        checks.push({
          url,
          ok: Boolean(response?.ok()),
          status: response?.status() ?? 0,
          duration_ms: Date.now() - started,
          title,
          h1: headings[0] ?? null,
          console_errors: consoleErrors.slice(0, 10),
          page_errors: pageErrors.slice(0, 10),
          axe,
        });
      } catch (error) {
        checks.push({
          url,
          ok: false,
          status: 0,
          duration_ms: Date.now() - started,
          title: null,
          h1: null,
          console_errors: consoleErrors.slice(0, 10),
          page_errors: pageErrors.slice(0, 10),
          error: error instanceof Error ? error.message : 'Playwright navigation failed.',
        });
      } finally {
        await page.close();
      }
    }

    await context.close();
    return checks;
  } finally {
    await browser.close();
  }
}

export async function capturePageScreenshots(
  urls: string[],
  options?: { storageState?: StoredBrowserSession['storageState'] | null }
): Promise<PageScreenshotCapture[]> {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      locale: 'en-US',
      storageState: options?.storageState ?? undefined,
    });
    const captures: PageScreenshotCapture[] = [];

    for (const url of urls) {
      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
        const title = await page.title().catch(() => null);
        const screenshot = await page.screenshot({
          type: 'png',
          fullPage: false,
          animations: 'disabled',
        });
        const visualCandidates = await captureSocialVisualCandidates(page, url).catch(() => []);
        captures.push({ url, title, screenshot, visualCandidates });
      } catch {
        // Ignore captures that could not be loaded; the research pipeline falls back to remote asset URLs.
      } finally {
        await page.close();
      }
    }

    await context.close();
    return captures;
  } finally {
    await browser.close();
  }
}
