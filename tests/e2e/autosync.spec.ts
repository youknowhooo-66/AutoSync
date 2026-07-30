import { test, expect, Page } from '@playwright/test';

async function openQuickPartDialog(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@autosync.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 8000 });
  await page.click('text="Ordens de Serviço"');
  await page.waitForURL('**/os');

  let openRow = page.locator('tbody tr:has-text("0121")').first();
  if (!(await openRow.isVisible())) {
    openRow = page.locator('tbody tr:has-text("0117")').first();
  }
  if (!(await openRow.isVisible())) {
    openRow = page.locator('tbody tr:has-text("0105")').first();
  }

  await expect(openRow).toBeVisible();
  await openRow.click();
  await page.waitForTimeout(500);

  const addBtn = page.locator('button:has-text("Adicionar")').first();
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  await page.waitForTimeout(400);

  const createPartLink = page.locator('button:has-text("Cadastrar Nova Peça")').first();
  await expect(createPartLink).toBeVisible();
  await createPartLink.click();
  await expect(page.getByRole('dialog', { name: 'Cadastrar Nova Peça no Estoque' })).toBeVisible();
}

test.describe('AutoSync E2E Flows', () => {
  test('should login and navigate to clients', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@autosync.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 8000 });
    await page.click('text="Clientes"');
    await page.waitForURL('**/clientes');
    await expect(page.locator('body')).toContainText(/Cliente/i);
  });

  test('should navigate to Inventory and check stock', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@autosync.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 8000 });
    await page.click('text="Estoque"');
    await page.waitForURL('**/estoque');
    await expect(page.locator('body')).toContainText(/Código|Produto|Peça/i);
  });

  test('fecha cadastro rápido pela tecla Escape', async ({ page }) => {
    await openQuickPartDialog(page);

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Cadastrar Nova Peça no Estoque' })).not.toBeVisible();
    await expect(page.locator('body')).toContainText(/Ordem de Serviço|Itens e Serviços/i);
  });

  test('fecha cadastro rápido pelo botão Cancelar', async ({ page }) => {
    await openQuickPartDialog(page);

    await page.getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.getByRole('dialog', { name: 'Cadastrar Nova Peça no Estoque' })).not.toBeVisible();
    await expect(page.locator('body')).toContainText(/Ordem de Serviço|Itens e Serviços/i);
  });

  test('fecha cadastro rápido pelo botão X', async ({ page }) => {
    await openQuickPartDialog(page);

    await page.locator('[data-slot="dialog-close"]').click();

    await expect(page.getByRole('dialog', { name: 'Cadastrar Nova Peça no Estoque' })).not.toBeVisible();
    await expect(page.locator('body')).toContainText(/Ordem de Serviço|Itens e Serviços/i);
  });

  test('fecha cadastro rápido ao clicar fora do modal', async ({ page }) => {
    await openQuickPartDialog(page);

    const dialog = page.getByRole('dialog', { name: 'Cadastrar Nova Peça no Estoque' });
    await expect(dialog).toBeVisible();

    const box = await dialog.boundingBox();
    if (!box) throw new Error('Não foi possível localizar os limites do Dialog');

    // Click in the viewport area outside the dialog content (to the left)
    await page.mouse.click(Math.max(5, box.x - 20), box.y + 20);

    await expect(dialog).not.toBeVisible();
    await expect(page.locator('body')).toContainText(/Ordem de Serviço|Itens e Serviços/i);
  });

  test('mantém modal aberto quando a criação falha', async ({ page }) => {
    await page.route('**/api/inventory/parts', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Código interno já cadastrado.' }),
      });
    });

    await openQuickPartDialog(page);

    await page.locator('#new-part-name').fill('Peça com erro');
    await page.locator('#new-part-sku').fill('SKU-DUPLICADO');
    await page.getByRole('button', { name: 'Cadastrar e Selecionar' }).click();

    await expect(page.getByRole('dialog', { name: 'Cadastrar Nova Peça no Estoque' })).toBeVisible();
  });

  test('cadastra nova peça e auto-seleciona na OS mantendo o Sheet aberto e enviando stockId no payload', async ({ page }) => {
    await openQuickPartDialog(page);

    const nameInput = page.locator('#new-part-name');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeFocused();

    const uniqueName = `Filtro E2E ${Date.now().toString().slice(-4)}`;
    await nameInput.fill(uniqueName);

    const uniqueSku = `E2E-COR-${Date.now().toString().slice(-6)}`;
    await page.fill('#new-part-sku', uniqueSku);
    await page.fill('#new-part-brand', 'Bosch E2E');
    await page.fill('#new-part-price', '210.00');
    await page.fill('#new-part-stock', '5');

    await page.getByRole('button', { name: 'Cadastrar e Selecionar' }).click();

    await expect(page.getByRole('dialog', { name: 'Cadastrar Nova Peça no Estoque' })).not.toBeVisible();
    await expect(page.locator('#part-search-combobox-trigger')).toContainText(uniqueName);

    await page.waitForTimeout(500);

    const submitBtn = page.locator('#add-item-submit-button');
    await expect(submitBtn).toBeVisible();

    const [request, response] = await Promise.all([
      page.waitForRequest(req => req.method() === 'POST' && req.url().includes('/items')),
      page.waitForResponse(res => res.request().method() === 'POST' && res.url().includes('/items')),
      submitBtn.click(),
    ]);

    const body = request.postDataJSON();
    expect(body.parts[0].stockId).toBeTruthy();
    expect(body.parts[0].quantity).toBe(1);
    expect(response.status()).toBeLessThan(300);

    // Verify added item is visible in OS items list
    await expect(page.locator('body')).toContainText(uniqueName);
  });
});
