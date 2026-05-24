const { test, expect } = require('@playwright/test');

test.describe('客户管理页面', () => {
  test('should load the customers page', async ({ page }) => {
    await page.goto('/customers.html');
    await expect(page).toHaveTitle(/客户管理/);
  });

  test('should display stats cards', async ({ page }) => {
    await page.goto('/customers.html');
    const statsCards = page.locator('.stats-card');
    await expect(statsCards).toHaveCount(4);
  });

  test('should display role toggle buttons', async ({ page }) => {
    await page.goto('/customers.html');
    const roleAdmin = page.locator('#roleAdminBtn');
    const roleUser = page.locator('#roleUserBtn');
    await expect(roleAdmin).toBeVisible();
    await expect(roleUser).toBeVisible();
  });

  test('should switch to user role and show user selector', async ({ page }) => {
    await page.goto('/customers.html');
    await page.locator('#roleUserBtn').click();
    const userSelect = page.locator('#userSelectWrapper');
    await expect(userSelect).toBeVisible();
  });

  test('should open add customer modal', async ({ page }) => {
    await page.goto('/customers.html');
    await page.locator('#addCustomerBtn').click();
    const modal = page.locator('#customerModal');
    await expect(modal).toHaveClass(/active/);
  });

  test('should display customer cards in grid', async ({ page }) => {
    await page.goto('/customers.html');
    const cards = page.locator('.customer-card');
    await expect(cards.first()).toBeVisible();
  });
});