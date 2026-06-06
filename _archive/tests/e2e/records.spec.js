const { test, expect } = require('@playwright/test');

test.describe('资产记录页面', () => {
  test('should load the records page', async ({ page }) => {
    await page.goto('/asset-records.html');
    await expect(page).toHaveTitle(/资产记录/);
  });

  test('should display stats cards', async ({ page }) => {
    await page.goto('/asset-records.html');
    const statsCards = page.locator('.stats-card');
    await expect(statsCards).toHaveCount(4);
  });

  test('should display tabs', async ({ page }) => {
    await page.goto('/asset-records.html');
    await expect(page.locator('#tabRecords')).toBeVisible();
    await expect(page.locator('#tabTimeline')).toBeVisible();
  });

  test('should switch to timeline tab', async ({ page }) => {
    await page.goto('/asset-records.html');
    await page.locator('#tabTimeline').click();
    const recordsContent = page.locator('#recordsContent');
    await expect(recordsContent).toHaveCSS('display', 'none');
  });

  test('should open add record modal', async ({ page }) => {
    await page.goto('/asset-records.html');
    await page.locator('button:has-text("新增记录")').click();
    const modal = page.locator('#assetModal');
    await expect(modal).toHaveClass(/active/);
  });

  test('should close modal on cancel', async ({ page }) => {
    await page.goto('/asset-records.html');
    await page.locator('button:has-text("新增记录")').click();
    await page.locator('#assetModal button:has-text("取消")').click();
    const modal = page.locator('#assetModal');
    await expect(modal).not.toHaveClass(/active/);
  });

  test('should navigate to analysis page', async ({ page }) => {
    await page.goto('/asset-records.html');
    await page.locator('.nav-item:has-text("数据分析")').click();
    const headerTitle = page.locator('.header-title h2');
    await expect(headerTitle).toHaveText('数据分析');
  });
});