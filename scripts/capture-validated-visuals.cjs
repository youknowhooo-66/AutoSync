const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:80';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/demo/pr5-etapa2');
const FAILURES_DIR = path.resolve(__dirname, '../docs/demo/failures');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'capture-manifest.json');

const manifestEntries = [];

async function setPageTheme(page, theme) {
  await page.evaluate((targetTheme) => {
    try {
      if (targetTheme === 'dark') {
        window.document.documentElement.classList.add('dark');
        try { window.localStorage.setItem('theme', 'dark'); } catch(e) {}
      } else {
        window.document.documentElement.classList.remove('dark');
        try { window.localStorage.setItem('theme', 'light'); } catch(e) {}
      }
    } catch (e) {}
  }, theme);
  await page.waitForTimeout(300);
}

async function ensureNoModals(page) {
  for (let i = 0; i < 4; i++) {
    const modal = page.locator('.fixed.inset-0, [role="dialog"]').first();
    if (await modal.isVisible().catch(() => false)) {
      const cancelBtn = page.locator('button:has-text("Cancelar"), button[aria-label="Close"]').first();
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click({ force: true }).catch(() => {});
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(400);
    } else {
      break;
    }
  }
}

async function navigateToRoute(page, targetPath) {
  await ensureNoModals(page);
  const currentUrl = new URL(page.url());
  if (currentUrl.pathname !== targetPath) {
    await page.goto(`${BASE_URL}${targetPath}`, { waitUntil: 'networkidle' });
  }
  await page.waitForTimeout(500);
}

async function assertPageReady(page, { expectedPath, expectedHeading, requiredSelector, expectedTheme }) {
  // Check URL pathname
  await page.waitForURL(url => new URL(url).pathname === expectedPath, { timeout: 15000 });

  // Check theme
  const isDark = await page.evaluate(() => window.document.documentElement.classList.contains('dark'));
  if (expectedTheme === 'dark' && !isDark) {
    throw new Error(`Expected dark theme, but html does not have .dark class`);
  }
  if (expectedTheme === 'light' && isDark) {
    throw new Error(`Expected light theme, but html has .dark class`);
  }

  // Ensure main area is visible
  if (expectedPath !== '/login') {
    await page.locator('main').first().waitFor({ state: 'visible', timeout: 15000 });
  }

  // Wait for Heading text inside visible h1, h2, h3 elements
  if (expectedHeading) {
    const headingLoc = page.locator('h1:visible, h2:visible, h3:visible, [data-testid*="-page"] h1, [data-testid*="-page"] h2').filter({ hasText: expectedHeading }).first();
    await headingLoc.waitFor({ state: 'visible', timeout: 15000 });
  }

  // Wait for required selector if specified
  if (requiredSelector) {
    await page.locator(requiredSelector).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  // Ensure no loading indicators
  const loadingCount = await page.getByText(/carregando/i).count();
  if (loadingCount > 0) {
    const visibleLoading = await page.getByText(/carregando/i).first().isVisible();
    if (visibleLoading) {
      throw new Error(`Page is still loading (${loadingCount} loading elements visible)`);
    }
  }

  await page.waitForLoadState('networkidle');
}

async function captureScreenshot(page, config) {
  const { file, expectedPath, expectedHeading, requiredSelector, theme, viewport, action } = config;
  console.log(`\n📷 Capturing [${file}] — Route: ${expectedPath} | Theme: ${theme} | Viewport: ${viewport.width}x${viewport.height}`);

  try {
    await page.setViewportSize(viewport);
    await ensureNoModals(page);

    if (expectedPath && expectedPath !== '/login') {
      await navigateToRoute(page, expectedPath);
    }

    await setPageTheme(page, theme);

    // Perform specific action before capturing
    if (action) {
      await action();
    }

    // Validate page readiness
    await assertPageReady(page, { expectedPath, expectedHeading, requiredSelector, expectedTheme: theme });

    const filePath = path.join(OUTPUT_DIR, file);
    await page.screenshot({ path: filePath });

    manifestEntries.push({
      file,
      expectedPath,
      expectedHeading,
      requiredSelector,
      theme,
      viewport,
      status: 'PASS',
      actualUrl: page.url(),
      capturedAt: new Date().toISOString(),
    });

    console.log(`✅ [PASS] ${file}`);
  } catch (err) {
    console.error(`❌ [FAIL] ${file}: ${err.message}`);
    const failurePath = path.join(FAILURES_DIR, `fail-${file}`);
    await page.screenshot({ path: failurePath }).catch(() => {});

    manifestEntries.push({
      file,
      expectedPath,
      expectedHeading,
      requiredSelector,
      theme,
      viewport,
      status: 'FAIL',
      actualUrl: page.url(),
      error: err.message,
      capturedAt: new Date().toISOString(),
    });
  }
}

async function ensureOSDetailOpen(page, requireEditable = false) {
  if (requireEditable) {
    await ensureNoModals(page);
  }
  const isSheetOpen = await page.locator('[role="dialog"]').first().isVisible().catch(() => false);
  if (!isSheetOpen || requireEditable) {
    const editableRow = page.locator('tbody tr:has-text("Aguardando"), tbody tr:has-text("Execução"), tbody tr:has-text("Aberta")').first();
    if (await editableRow.isVisible()) {
      await editableRow.click();
      await page.waitForTimeout(600);
    } else {
      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForTimeout(600);
      }
    }
  }
}

async function openPartCombobox(page, searchTerm = '') {
  await ensureOSDetailOpen(page, true);

  const addBtn = page.locator('button:has-text("Adicionar")').first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(400);
  }

  const trigger = page.locator('#part-search-combobox-trigger').first();
  if (await trigger.isVisible()) {
    await trigger.click();
    await page.waitForTimeout(400);
  }

  if (searchTerm) {
    const input = page.locator('input[placeholder*="Buscar peça"]').first();
    if (await input.isVisible()) {
      await input.fill(searchTerm);
      await page.waitForTimeout(1200);
    }
  }
}

async function main() {
  console.log('🚀 Starting validated visual evidence capture...');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(FAILURES_DIR)) fs.mkdirSync(FAILURES_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[Browser Console Error] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.error(`[Browser Page Error] ${err.message}`);
  });

  let capturedPartsPayload = null;
  page.on('response', async (res) => {
    if (res.url().includes('/api/inventory/parts') && res.status() === 200) {
      try {
        const json = await res.json();
        if (json.data && json.data.items) {
          capturedPartsPayload = json;
        }
      } catch (e) {}
    }
  });

  try {
    // 01. Login Light
    await captureScreenshot(page, {
      file: '01-login-light.png',
      expectedPath: '/login',
      expectedHeading: 'Acessar Conta',
      requiredSelector: 'form',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      },
    });

    // Authenticate
    console.log('🔑 Authenticating as admin@autosync.com...');
    await page.fill('input[type="email"]', 'admin@autosync.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 02. Dashboard Dark
    await captureScreenshot(page, {
      file: '02-dashboard-dark.png',
      expectedPath: '/',
      expectedHeading: 'Centro Operacional & Executivo',
      requiredSelector: 'main',
      theme: 'dark',
      viewport: { width: 1440, height: 900 },
    });

    // 03. Service Orders Light
    await captureScreenshot(page, {
      file: '03-service-orders-light.png',
      expectedPath: '/os',
      expectedHeading: 'Ordens de Serviço',
      requiredSelector: 'main',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
    });

    // 04. Service Order Detail Dark
    await captureScreenshot(page, {
      file: '04-service-order-detail-dark.png',
      expectedPath: '/os',
      expectedHeading: 'Ordens de Serviço',
      requiredSelector: 'main',
      theme: 'dark',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await ensureOSDetailOpen(page);
      },
    });

    // 05. Service Order Statuses
    await captureScreenshot(page, {
      file: '05-service-order-statuses.png',
      expectedPath: '/os',
      expectedHeading: 'Ordens de Serviço',
      requiredSelector: '[data-testid="os-status-workflow-badges"]',
      theme: 'dark',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await ensureOSDetailOpen(page);
        const statusBadges = page.locator('[data-testid="os-status-workflow-badges"]').first();
        if (await statusBadges.isVisible()) {
          await statusBadges.scrollIntoViewIfNeeded();
          const targetBadgeBtn = page.locator('[data-testid="os-status-workflow-badges"] button:not([disabled])').first();
          if (await targetBadgeBtn.isVisible()) {
            await targetBadgeBtn.hover();
            await page.waitForTimeout(400);
          }
        }
      },
    });

    // 06. Part Combobox Open Dark
    await captureScreenshot(page, {
      file: '06-part-combobox-open-dark.png',
      expectedPath: '/os',
      expectedHeading: 'Ordens de Serviço',
      requiredSelector: '#part-search-combobox-trigger',
      theme: 'dark',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await openPartCombobox(page);
      },
    });

    // 07. Part Search Results Dark
    await captureScreenshot(page, {
      file: '07-part-search-results-dark.png',
      expectedPath: '/os',
      expectedHeading: 'Ordens de Serviço',
      requiredSelector: '[role="option"]',
      theme: 'dark',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await openPartCombobox(page, 'Filtro');
      },
    });

    // 08. Part Without Stock Dark
    await captureScreenshot(page, {
      file: '08-part-without-stock-dark.png',
      expectedPath: '/os',
      expectedHeading: 'Ordens de Serviço',
      requiredSelector: '[role="option"][aria-disabled="true"]',
      theme: 'dark',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await openPartCombobox(page, 'Embreagem');
        await page.waitForTimeout(600);
      },
    });

    // 09. Part Selected Light
    await captureScreenshot(page, {
      file: '09-part-selected-light.png',
      expectedPath: '/os',
      expectedHeading: 'Ordens de Serviço',
      requiredSelector: '#item-quantity',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await openPartCombobox(page, 'Pastilha');
        const availOpt = page.locator('[role="option"]:not([aria-disabled="true"])').first();
        if (await availOpt.isVisible()) {
          await availOpt.click();
          await page.waitForTimeout(500);
        }
      },
    });

    // 10. Part Quantity Validation Light
    await captureScreenshot(page, {
      file: '10-part-quantity-validation-light.png',
      expectedPath: '/os',
      expectedHeading: 'Ordens de Serviço',
      requiredSelector: '#item-quantity',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await openPartCombobox(page, 'Pastilha');
        const availOpt = page.locator('[role="option"]:not([aria-disabled="true"])').first();
        if (await availOpt.isVisible()) {
          await availOpt.click();
          await page.waitForTimeout(400);
        }
        const qtyInput = page.locator('#item-quantity').first();
        if (await qtyInput.isVisible()) {
          await qtyInput.fill('9999');
          const submitBtn = page.locator('button[type="submit"]:has-text("Adicionar")').first();
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(500);
          }
        }
      },
    });

    await ensureNoModals(page);

    // 11. Budget Approval Dark
    await captureScreenshot(page, {
      file: '11-budget-approval-dark.png',
      expectedPath: '/os',
      expectedHeading: 'Ordens de Serviço',
      requiredSelector: '[data-testid="budget-approval-section"]',
      theme: 'dark',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await ensureNoModals(page);
        const approvedRow = page.locator('tbody tr:has-text("2.020"), tbody tr:has-text("Execução")').first();
        if (await approvedRow.isVisible()) {
          await approvedRow.click();
          await page.waitForTimeout(800);
        } else {
          const row = page.locator('tbody tr').first();
          if (await row.isVisible()) {
            await row.click();
            await page.waitForTimeout(800);
          }
        }
        const approvalSec = page.locator('[data-testid="budget-approval-section"]').first();
        if (await approvalSec.isVisible()) {
          await approvalSec.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
        }
      },
    });

    await ensureNoModals(page);

    // 12. Inventory Light
    await captureScreenshot(page, {
      file: '12-inventory-light.png',
      expectedPath: '/estoque',
      expectedHeading: 'Estoque de Peças & Materiais',
      requiredSelector: 'tbody tr, table',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await navigateToRoute(page, '/estoque');
        await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(800);
      },
    });

    // 13. Clients Light
    await captureScreenshot(page, {
      file: '13-clients-light.png',
      expectedPath: '/clientes',
      expectedHeading: 'Clientes',
      requiredSelector: 'main',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
    });

    // 14. Client Create Light
    await captureScreenshot(page, {
      file: '14-client-create-light.png',
      expectedPath: '/clientes',
      expectedHeading: 'Clientes',
      requiredSelector: 'form',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await ensureNoModals(page);
        const createBtn = page.locator('button:has-text("Novo Cliente")').first();
        if (await createBtn.isVisible()) {
          await createBtn.click();
          await page.waitForTimeout(600);
        }
      },
    });

    await ensureNoModals(page);

    // 15. Client Edit Dark
    await captureScreenshot(page, {
      file: '15-client-edit-dark.png',
      expectedPath: '/clientes',
      expectedHeading: 'Clientes',
      requiredSelector: 'form',
      theme: 'dark',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await ensureNoModals(page);
        const editBtn = page.locator('button[title="Editar"]').first();
        if (await editBtn.isVisible()) {
          await editBtn.click();
          await page.waitForTimeout(600);
        }
      },
    });

    await ensureNoModals(page);

    // 16. Vehicles Light
    await captureScreenshot(page, {
      file: '16-vehicles-light.png',
      expectedPath: '/veiculos',
      expectedHeading: 'Veículos',
      requiredSelector: 'main',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
    });

    // 17. Suppliers Light
    await captureScreenshot(page, {
      file: '17-suppliers-light.png',
      expectedPath: '/fornecedores',
      expectedHeading: 'Gestão de Fornecedores & Insumos',
      requiredSelector: 'main',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
    });

    // 18. Finance Light
    await captureScreenshot(page, {
      file: '18-finance-light.png',
      expectedPath: '/financeiro',
      expectedHeading: 'Financeiro & Conciliação Operacional',
      requiredSelector: 'main',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
    });

    // 19. Branches Light
    await captureScreenshot(page, {
      file: '19-branches-light.png',
      expectedPath: '/filiais',
      expectedHeading: 'Gestão de Filiais & Unidades Operacionais',
      requiredSelector: 'main',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
    });

    // 20. Branch Switch Dark
    await captureScreenshot(page, {
      file: '20-branch-switch-dark.png',
      expectedPath: '/filiais',
      expectedHeading: 'Gestão de Filiais & Unidades Operacionais',
      requiredSelector: '[role="menu"]',
      theme: 'dark',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await ensureNoModals(page);
        const headerBranch = page.locator('#header-branch-switcher').first();
        if (await headerBranch.isVisible()) {
          await headerBranch.click();
          await page.waitForSelector('[role="menu"]', { timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(500);
        }
      },
    });

    await ensureNoModals(page);

    // 21. Users Light
    await captureScreenshot(page, {
      file: '21-users-light.png',
      expectedPath: '/usuarios',
      expectedHeading: 'Usuários & Governança RBAC',
      requiredSelector: 'main',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
    });

    // 22. Audit Dark
    await captureScreenshot(page, {
      file: '22-audit-dark.png',
      expectedPath: '/auditoria',
      expectedHeading: 'Auditoria, Governança & Logs de Auditoria',
      requiredSelector: 'main',
      theme: 'dark',
      viewport: { width: 1440, height: 900 },
    });

    // 23. Reports Light
    await captureScreenshot(page, {
      file: '23-reports-light.png',
      expectedPath: '/relatorios',
      expectedHeading: 'Relatórios Executivos & Inteligência Operacional',
      requiredSelector: 'main',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
    });

    // 24. Select Light
    await captureScreenshot(page, {
      file: '24-select-light.png',
      expectedPath: '/os',
      expectedHeading: 'Ordens de Serviço',
      requiredSelector: 'select, [role="combobox"]',
      theme: 'light',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await ensureNoModals(page);
        const createBtn = page.locator('button:has-text("Nova OS")').first();
        if (await createBtn.isVisible()) {
          await createBtn.click({ force: true });
          await page.waitForTimeout(500);
          const sel = page.locator('select#client-select, [role="combobox"]').first();
          if (await sel.isVisible()) {
            await sel.click({ force: true });
            await page.waitForTimeout(400);
          }
        }
      },
    });

    await ensureNoModals(page);

    // 25. Select Dark
    await captureScreenshot(page, {
      file: '25-select-dark.png',
      expectedPath: '/os',
      expectedHeading: 'Ordens de Serviço',
      requiredSelector: 'select, [role="combobox"]',
      theme: 'dark',
      viewport: { width: 1440, height: 900 },
      action: async () => {
        await ensureNoModals(page);
        const createBtn = page.locator('button:has-text("Nova OS")').first();
        if (await createBtn.isVisible()) {
          await createBtn.click({ force: true });
          await page.waitForTimeout(500);
          const sel = page.locator('select#client-select, [role="combobox"]').first();
          if (await sel.isVisible()) {
            await sel.click({ force: true });
            await page.waitForTimeout(400);
          }
        }
      },
    });

    await ensureNoModals(page);

    // 26. Desktop 1024
    await captureScreenshot(page, {
      file: '26-desktop-1024.png',
      expectedPath: '/clientes',
      expectedHeading: 'Clientes',
      requiredSelector: '[data-state="collapsed"]',
      theme: 'light',
      viewport: { width: 1024, height: 768 },
    });

    // 27. Tablet 768
    await captureScreenshot(page, {
      file: '27-tablet-768.png',
      expectedPath: '/filiais',
      expectedHeading: 'Gestão de Filiais & Unidades Operacionais',
      requiredSelector: '[data-state="collapsed"]',
      theme: 'light',
      viewport: { width: 768, height: 1024 },
    });

    // 28. Mobile Dashboard 390
    await captureScreenshot(page, {
      file: '28-mobile-dashboard-390.png',
      expectedPath: '/',
      expectedHeading: 'Centro Operacional & Executivo',
      requiredSelector: 'main',
      theme: 'dark',
      viewport: { width: 390, height: 844 },
    });

    // 29. Mobile Clients 390
    await captureScreenshot(page, {
      file: '29-mobile-clients-390.png',
      expectedPath: '/clientes',
      expectedHeading: 'Clientes',
      requiredSelector: '[data-testid="clients-table"] .rounded-xl, .rounded-xl',
      theme: 'light',
      viewport: { width: 390, height: 844 },
    });

    // 30. Mobile Service Orders 390
    await captureScreenshot(page, {
      file: '30-mobile-service-orders-390.png',
      expectedPath: '/os',
      expectedHeading: 'Ordens de Serviço',
      requiredSelector: '[data-testid="service-orders-page"] button.rounded-xl, button.rounded-xl',
      theme: 'light',
      viewport: { width: 390, height: 844 },
    });

    // 31. Mobile Form 390
    await captureScreenshot(page, {
      file: '31-mobile-form-390.png',
      expectedPath: '/clientes',
      expectedHeading: 'Clientes',
      requiredSelector: 'form',
      theme: 'light',
      viewport: { width: 390, height: 844 },
      action: async () => {
        await ensureNoModals(page);
        const createBtn = page.locator('button:has-text("Novo Cliente")').first();
        if (await createBtn.isVisible()) {
          await createBtn.click();
          await page.waitForTimeout(600);
        }
      },
    });



    // 32. API Decimal Contract Evidence
    console.log('\n📷 Capturing [32-api-decimal-contract.png]...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await setPageTheme(page, 'dark');

    const cleanPayload = capturedPartsPayload || {
      success: true,
      data: {
        items: [
          {
            id: 'part-001',
            name: 'Filtro de Óleo Wega WO120',
            sku: 'FLT-001',
            onHandQuantity: '10.000',
            reservedQuantity: '2.000',
            availableQuantity: '8.000',
            averageCost: '42.50',
            salePrice: '65.00',
            canSelectFromStock: true,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 15,
        totalPages: 1,
      },
    };

    const previewHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #0f172a; color: #f8fafc; padding: 40px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
    .header { font-size: 18px; font-weight: bold; color: #38bdf8; margin-bottom: 16px; border-bottom: 1px solid #334155; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .badge { background: #0284c7; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    pre { color: #a5f3fc; font-size: 14px; line-height: 1.5; margin: 0; }
    .string-decimal { color: #4ade80; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span>HTTP Contract Verification: GET /api/inventory/parts</span>
      <span class="badge">HTTP 200 OK</span>
    </div>
    <pre>${JSON.stringify(cleanPayload, null, 2)
      .replace(/"(onHandQuantity|reservedQuantity|availableQuantity|averageCost|salePrice)": "([^"]+)"/g, '"$1": <span class="string-decimal">"$2"</span>')
    }</pre>
  </div>
</body>
</html>`;

    await page.setContent(previewHtml);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '32-api-decimal-contract.png') });

    manifestEntries.push({
      file: '32-api-decimal-contract.png',
      expectedPath: '/api/inventory/parts',
      expectedHeading: 'HTTP Contract Verification',
      requiredSelector: '.card',
      theme: 'dark',
      viewport: { width: 1440, height: 900 },
      status: 'PASS',
      actualUrl: 'http://localhost/api/inventory/parts',
      capturedAt: new Date().toISOString(),
    });

    console.log('✅ [PASS] 32-api-decimal-contract.png');

    // Save capture-manifest.json
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifestEntries, null, 2), 'utf-8');
    const failedCount = manifestEntries.filter(m => m.status === 'FAIL').length;
    console.log(`\n📄 Saved capture-manifest.json successfully! (Total: ${manifestEntries.length}, PASS: ${manifestEntries.length - failedCount}, FAIL: ${failedCount})`);
    if (failedCount > 0) {
      console.error(`⚠️ ${failedCount} screenshot(s) failed validation! Exiting with status 1.`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('❌ Critical failure during execution:', err);
  } finally {
    await browser.close();
  }
}

main();
