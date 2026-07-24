const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:80';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/demo/pr5-etapa2');

async function main() {
  console.log('🚀 Initiating visual evidence capture suite...');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });

  const page = await context.newPage();

  try {
    // ---------------------------------------------------------------------------
    // 01. Login
    // ---------------------------------------------------------------------------
    console.log('📸 01-login.png');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-login.png') });

    console.log('🔑 Logging in as admin@autosync.com...');
    await page.fill('input[type="email"]', 'admin@autosync.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Force dark mode
    await page.evaluate(() => {
      window.document.documentElement.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(500);

    // ---------------------------------------------------------------------------
    // 02. Dashboard Dark Mode
    // ---------------------------------------------------------------------------
    console.log('📸 02-dashboard-dark.png');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-dashboard-dark.png') });

    // ---------------------------------------------------------------------------
    // 03. Service Orders List
    // ---------------------------------------------------------------------------
    console.log('📸 03-service-orders.png');
    await page.goto(`${BASE_URL}/os`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-service-orders.png') });

    // ---------------------------------------------------------------------------
    // 04. Service Order Details & 10. Budget Approval
    // ---------------------------------------------------------------------------
    console.log('🔍 Opening OS Detail Sheet...');
    const osRow = page.locator('tbody tr').first();
    if (await osRow.isVisible()) {
      await osRow.click();
      await page.waitForTimeout(1000);
    }

    console.log('📸 04-service-order-details.png');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04-service-order-details.png') });

    console.log('📸 10-budget-approval.png');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10-budget-approval.png') });

    // ---------------------------------------------------------------------------
    // 05. PartSearchCombobox Open
    // ---------------------------------------------------------------------------
    console.log('➕ Clicking "Adicionar" button to open item form...');
    const addItemBtn = page.locator('button:has-text("Adicionar")').first();
    if (await addItemBtn.isVisible()) {
      await addItemBtn.click();
      await page.waitForTimeout(600);
    }

    // Switch Item Type to PART
    const typeSelect = page.locator('#item-type-select').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      await page.waitForTimeout(300);
      const partOption = page.locator('[role="option"]:has-text("Peça")').first();
      if (await partOption.isVisible()) {
        await partOption.click();
        await page.waitForTimeout(400);
      }
    }

    console.log('📸 05-part-search-combobox.png');
    const comboboxTrigger = page.locator('#part-search-combobox-trigger').first();
    if (await comboboxTrigger.isVisible()) {
      await comboboxTrigger.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '05-part-search-combobox.png') });

      // -------------------------------------------------------------------------
      // 06. Search Results (Filtro)
      // -------------------------------------------------------------------------
      console.log('🔍 Searching "Filtro" in combobox...');
      const comboboxInput = page.locator('input[placeholder*="Buscar peça"]').first();
      if (await comboboxInput.isVisible()) {
        await comboboxInput.fill('Filtro');
        await page.waitForTimeout(800);

        console.log('📸 06-part-search-results.png');
        await page.screenshot({ path: path.join(OUTPUT_DIR, '06-part-search-results.png') });

        // -----------------------------------------------------------------------
        // 07. Out of Stock Item (Vela or zero stock)
        // -----------------------------------------------------------------------
        console.log('🔍 Searching out-of-stock item ("Vela")...');
        await comboboxInput.fill('Vela');
        await page.waitForTimeout(800);

        console.log('📸 07-part-out-of-stock.png');
        await page.screenshot({ path: path.join(OUTPUT_DIR, '07-part-out-of-stock.png') });

        // -----------------------------------------------------------------------
        // 08. Part Selected & Form Metadata
        // -----------------------------------------------------------------------
        console.log('🔍 Selecting available part ("Pastilha")...');
        await comboboxInput.fill('Pastilha');
        await page.waitForTimeout(800);

        const availableItem = page.locator('[role="option"]:not([aria-disabled="true"])').first();
        if (await availableItem.isVisible()) {
          await availableItem.click();
          await page.waitForTimeout(500);
        }
      }
    }

    console.log('📸 08-part-selected.png');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08-part-selected.png') });

    // ---------------------------------------------------------------------------
    // 09. Quantity Validation Error
    // ---------------------------------------------------------------------------
    console.log('📸 09-quantity-validation.png');
    const qtyInput = page.locator('#item-quantity').first();
    if (await qtyInput.isVisible()) {
      await qtyInput.fill('9999');
      const submitBtn = page.locator('button[type="submit"]:has-text("Adicionar")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(500);
      }
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09-quantity-validation.png') });

    // Close detail sheet
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ---------------------------------------------------------------------------
    // 11. Inventory Page
    // ---------------------------------------------------------------------------
    console.log('📸 11-inventory.png');
    await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '11-inventory.png') });

    // ---------------------------------------------------------------------------
    // 12. Clients Page
    // ---------------------------------------------------------------------------
    console.log('📸 12-clients.png');
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '12-clients.png') });

    // ---------------------------------------------------------------------------
    // 13. Client Edit Modal (Dark Mode)
    // ---------------------------------------------------------------------------
    console.log('📸 13-client-edit-dark.png');
    const actionMenu = page.locator('tbody tr button').first();
    if (await actionMenu.isVisible()) {
      await actionMenu.click();
      await page.waitForTimeout(300);
      const editBtn = page.locator('[role="menuitem"]:has-text("Editar")').first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await page.waitForTimeout(600);
      }
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '13-client-edit-dark.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // ---------------------------------------------------------------------------
    // 14. Branches Page
    // ---------------------------------------------------------------------------
    console.log('📸 14-branches.png');
    await page.goto(`${BASE_URL}/branches`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '14-branches.png') });

    // ---------------------------------------------------------------------------
    // 15. Branch Context Switch
    // ---------------------------------------------------------------------------
    console.log('📸 15-branch-context-switch.png');
    const headerBranchBtn = page.locator('header button:has-text("AutoSync")').first();
    if (await headerBranchBtn.isVisible()) {
      await headerBranchBtn.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '15-branch-context-switch.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // ---------------------------------------------------------------------------
    // 16. Network Decimal Contract
    // ---------------------------------------------------------------------------
    console.log('📸 16-network-decimal-contract.png');
    await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '16-network-decimal-contract.png') });

    // ---------------------------------------------------------------------------
    // 18. Dark Mode Dialog (Nova Peça Modal)
    // ---------------------------------------------------------------------------
    console.log('📸 18-dark-mode-dialog.png');
    const novaPecaBtn = page.locator('button:has-text("Nova Peça"), button:has-text("Adicionar Peça")').first();
    if (await novaPecaBtn.isVisible()) {
      await novaPecaBtn.click();
      await page.waitForTimeout(600);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '18-dark-mode-dialog.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // ---------------------------------------------------------------------------
    // 17. Mobile Viewport (390 x 844)
    // ---------------------------------------------------------------------------
    console.log('📸 17-mobile-responsive.png');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/os`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '17-mobile-responsive.png') });
    await mobileContext.close();

    console.log('🎉 ALL 18 SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error during capture execution:', err);
  } finally {
    await browser.close();
  }
}

main();
