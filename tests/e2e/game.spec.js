import { test, expect } from '@playwright/test';
test('plays a full game, handles mistakes and restarts', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await page.getByRole('button', { name: '开始任务' }).click();
  const input = page.getByRole('textbox', { name: '输入当前英文单词' });
  await expect(input).toBeEnabled();
  await input.fill('wrong'); await input.press('Enter');
  await expect(page.getByRole('status')).toContainText('不匹配'); await expect(page.locator('#score')).toHaveText('000');
  for (let index = 0; index < 8; index++) {
    await input.fill(await page.locator('#word').textContent()); await input.press('Enter');
    await expect(page.locator('#progress')).toHaveText(`${index + 1} / 8`);
  }
  await expect(page.locator('#word')).toHaveText('COMPLETE!'); await expect(page.locator('#score')).toHaveText('800'); await expect(input).toBeDisabled();
  await page.getByRole('button', { name: '再来一局' }).click(); await expect(input).toBeEnabled();
  await expect(page.locator('#score')).toHaveText('000'); await expect(page.locator('#progress')).toHaveText('0 / 8');
  expect(errors).toEqual([]);
});
test('timer expires and prevents late input', async ({ page }) => {
  await page.clock.install(); await page.goto('/');
  await page.getByRole('button', { name: '开始任务' }).click();
  await expect(page.locator('#word-input')).toBeEnabled();
  await page.clock.runFor(30100);
  await expect(page.locator('#word')).toHaveText('TIME UP'); await expect(page.locator('#word-input')).toBeDisabled();
  await expect(page.locator('#timer')).toHaveText('0s');
});
test('selected theme and difficulty are sent to server', async ({ page }) => {
  await page.goto('/'); await page.getByLabel('探索主题').selectOption('forest'); await page.getByLabel('任务难度').selectOption('hard');
  const request = page.waitForRequest('**/api/level'); await page.getByRole('button', { name: '开始任务' }).click();
  expect((await request).postDataJSON()).toEqual({ theme: 'forest', difficulty: 'hard' });
  await expect(page.locator('#level-title')).toHaveText('森林密语'); await expect(page.locator('#timer')).toHaveText('20s');
});
test('failed request can be retried', async ({ page }) => {
  await page.route('**/api/level', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'SERVER_BUSY', message: '服务暂时不可用' } }) }));
  await page.goto('/'); await page.getByRole('button', { name: '开始任务' }).click();
  await expect(page.getByRole('status')).toContainText('服务暂时不可用'); await expect(page.locator('#word-input')).toBeDisabled();
  await page.unroute('**/api/level'); await page.getByRole('button', { name: '重试任务' }).click(); await expect(page.locator('#word-input')).toBeEnabled();
});
test('fallback and generated title are displayed safely', async ({ page }) => {
  await page.route('**/api/level', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ source: 'fallback', warning: { code: 'UPSTREAM_TIMEOUT', message: 'AI 超时，已切换离线关卡' }, level: { title: '<img src=x onerror=alert(1)>', durationSec: 30, words: ['star', 'moon', 'nova', 'orbit', 'comet', 'solar', 'planet', 'rocket'] } }) }));
  await page.goto('/'); await page.getByRole('button', { name: '开始任务' }).click();
  await expect(page.locator('#source')).toHaveText('离线回退'); await expect(page.getByRole('status')).toContainText('离线关卡');
  await expect(page.locator('#level-title img')).toHaveCount(0); await expect(page.locator('#level-title')).toContainText('<img');
});
test('mobile page has no horizontal overflow and remains playable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '开始任务' }).click(); await expect(page.locator('#word-input')).toBeEnabled();
  await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
});
test('desktop preview renders', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 }); await page.goto('/');
  await expect(page.locator('#source')).toHaveText('离线关卡');
  await page.screenshot({ path: 'artifacts/desktop.png', fullPage: true });
});
