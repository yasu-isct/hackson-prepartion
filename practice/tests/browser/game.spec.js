import { test, expect } from '@playwright/test';
test('manual moves, success and restart', async ({ page }) => {
  await page.goto('/');
  for (const name of ['右 →', '右 →', '下 ↓', '下 ↓']) await page.getByRole('button', { name, exact: true }).click();
  await expect(page.locator('#state')).toContainText('成功');
  await expect(page.locator('#ai')).toBeDisabled();
  await page.getByRole('button', { name: '重新开始' }).click();
  await expect(page.locator('#state')).toContainText('8'); await expect(page.locator('#ai')).toBeEnabled();
});
test('Mock AI reads limited observation and can finish the game', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 4; i++) {
    await page.locator('#ai').click(); await expect(page.locator('#message')).toContainText('mock');
    await expect(page.locator('#state')).toContainText(String(7 - i));
  }
  await expect(page.locator('#state')).toContainText('成功');
});
test('network failure leaves manual controls usable', async ({ page }) => {
  await page.route('**/api/decision', route => route.abort()); await page.goto('/'); await page.locator('#ai').click();
  await expect(page.locator('#ai')).toBeEnabled(); await page.getByRole('button', { name: '右 →', exact: true }).click();
  await expect(page.locator('#state')).toContainText('7');
});
test('restart while AI is in flight ignores the old response', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/decision', async route => { await gate; await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ source: 'mock', decision: { action: 'right', reason: 'old' } }) }).catch(() => {}); });
  await page.goto('/'); const sent = page.waitForRequest('**/api/decision'); await page.locator('#ai').click(); await sent;
  await page.getByRole('button', { name: '重新开始' }).click(); release();
  await expect(page.locator('#state')).toContainText('8');
  await expect(page.locator('#message')).toContainText('新的一局');
  await expect(page.locator('#board .player')).toHaveCount(1);
});
