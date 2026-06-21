import { test, expect } from '@playwright/test';

test.describe('AutoSync E2E Flows', () => {
  test('should login and navigate to clients', async ({ page }) => {
    // 1. Visit Login page
    await page.goto('/login');

    // 2. Fill credentials and submit
    await page.fill('input[type="email"]', 'admin@autosync.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 3. Wait for Dashboard page (url is '/')
    await expect(page).toHaveURL('http://localhost:5173/');

    // 4. Click on navigation link "Clientes"
    await page.click('text="Clientes"');
    await expect(page).toHaveURL('http://localhost:5173/clientes');

    // 5. Verify the Clients page title or table header exists
    await expect(page.locator('body')).toContainText(/Cliente/i);
  });

  test('should navigate to Inventory and check stock', async ({ page }) => {
    // 1. Visit Login page and log in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@autosync.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 2. Wait for Dashboard
    await expect(page).toHaveURL('http://localhost:5173/');

    // 3. Navigate to Inventory / Estoque page
    await page.click('text="Estoque"');
    await expect(page).toHaveURL('http://localhost:5173/estoque');

    // 4. Verify stock table or page header
    await expect(page.locator('body')).toContainText(/Código|Produto|Peça/i);
  });
});
