import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Use an installed Playwright; do not download browsers or touch a personal profile.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3100';
const out = resolve('.tmp-prints/browser-qa');
mkdirSync(out, { recursive: true });
const results = [];
const browser = await chromium.launch({ headless: true, ...(process.env.QA_CHROMIUM_PATH ? { executablePath: process.env.QA_CHROMIUM_PATH } : {}) });
try {
  for (const width of [375, 390, 768, 1366, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    // The timed offer has its own flow; it must not interrupt menu/route checks.
    await context.addInitScript(() => sessionStorage.setItem('closet-lunar-popup-visto', '1'));
    const page = await context.newPage();
    const errors = [];
    const requestFailures = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => {
      if (request.failure()?.errorText !== 'net::ERR_ABORTED') requestFailures.push({ url: request.url(), error: request.failure()?.errorText });
    });
    for (const route of ['/', '/buscar?q=top', '/categoria/tops', '/produto/top', '/conta', '/conta/medidas', '/checkout', '/admin']) {
      const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 180_000 });
      assert(response && response.status() < 400, `${route}: HTTP ${response?.status()}`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${route} overflows at ${width}px`);
      const broken = await page.locator('img').evaluateAll(images => images.filter(image => image.complete && image.naturalWidth === 0).map(image => image.src));
      assert.deepEqual(broken, [], `Broken images in ${route}`);
      const inaccessible = await page.locator('button:not([aria-hidden="true"]), input:not([type="hidden"]), select, textarea').evaluateAll(elements => elements.filter(element => {
        if (!element.getClientRects().length || element.closest('[hidden]')) return false;
        return !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby') && !element.textContent?.trim() && !element.labels?.length && !element.getAttribute('title');
      }).map(element => element.outerHTML.slice(0, 200)));
      assert.deepEqual(inaccessible, [], `Unnamed visible controls in ${route}`);
      if (route === '/' && width < 1024) {
        await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
        await page.locator('#store-mobile-menu').waitFor({ state: 'visible' });
        assert.equal(await page.getByRole('button', { name: 'Abrir menu', exact: true }).getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        await page.locator('#store-mobile-menu').waitFor({ state: 'hidden' });
      }
      if (route === '/conta/medidas') {
        if (width < 1024) {
          const toggle = page.locator('[aria-controls="account-mobile-sections"]');
          await toggle.click();
          await page.locator('#account-mobile-sections').waitFor({ state: 'visible' });
          await toggle.click();
          await page.locator('#account-mobile-sections').waitFor({ state: 'hidden' });
        }
        await page.getByRole('button', { name: 'Ver no Avatar', exact: false }).click();
        await page.getByRole('dialog').waitFor({ state: 'visible' });
        await page.keyboard.press('Escape');
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
      }
      await page.screenshot({ path: resolve(out, `${width}-${route.replace(/[^a-z0-9]+/gi, '-') || 'home'}.png`), fullPage: true });
      results.push({ width, route, status: response.status(), passed: true });
      console.log('PASS', width, route);
    }
    assert.deepEqual(errors, [], `JavaScript errors at ${width}px`);
    assert.deepEqual(requestFailures, [], `Failed browser requests at ${width}px`);
    await context.close();
  }
} finally {
  await browser.close();
  writeFileSync(resolve(out, 'results.json'), JSON.stringify(results, null, 2));
}
