import { setupStockHandler } from './StockHandler';
import { setupFinancialHandler } from './FinancialHandler';
import { setupAuditHandler } from './AuditHandler';

export function initializeEventHandlers() {
  setupStockHandler();
  setupFinancialHandler();
  setupAuditHandler();
  console.log('[EventBus] All Service Order handlers registered.');
}
