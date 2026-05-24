const { test, expect } = require('@playwright/test');

test.describe('资产概览页面', () => {
  test('should load the overview page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('客户资产管理系统');
  });

  test('should display sidebar navigation', async ({ page }) => {
    await page.goto('/');
    const navItems = page.locator('.nav-item');
    await expect(navItems).toHaveCount(7);
  });

  test('should display stats cards', async ({ page }) => {
    await page.goto('/');
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4);
  });

  test('should display customer table', async ({ page }) => {
    await page.goto('/');
    const tableRows = page.locator('.customer-table .table-row');
    await expect(tableRows).toHaveCount(6);
  });

  test('should switch active nav on click', async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav-item').nth(1).click();
    await expect(page.locator('.nav-item').nth(1)).toHaveClass(/active/);
  });
});