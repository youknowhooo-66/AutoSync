# AutoSync ERP — PR 5 Etapa 2: Pacote Visual de Demonstração e Validação Definitivo

**Status da Entrega**: `READY TO COMMIT`
**Data da Recaptura Efetiva**: 27/07/2026
**Seed do Banco de Dados**: Atualizado com item sem saldo (`Kit de Embreagem (Sem Saldo)`), aprovação real de orçamento (`Status: APROVADO, Versão 2, R$ 2.020,00`) e logs de auditoria diversificados
**Container de Origem**: `autosync_frontend` recompilado sem cache e rodando em `http://localhost:80`
**Validação Estrita (`scripts/capture-validated-visuals.cjs`)**: 32/32 screenshots com status **PASS** e seletores estritos de componentes em `capture-manifest.json` (0 FALHAS)

---

## 🖼️ Contact Sheet Definitivo (`contact-sheet.png`)

![Contact Sheet Grid](/Users/yknwo/Desktop/AutoSync/docs/demo/pr5-etapa2/contact-sheet.png)

---

## 📊 Matriz Definitiva de Seletores e Evidências Capturadas (32 Screenshots)

| ID | Arquivo PNG | Rota | Seletor de Validação Estrito | Status |
| --- | --- | --- | --- | --- |
| 01 | `01-login-light.png` | `/login` | `form` | **PASS** |
| 02 | `02-dashboard-dark.png` | `/` | `main` | **PASS** |
| 03 | `03-service-orders-light.png` | `/os` | `main` | **PASS** |
| 04 | `04-service-order-detail-dark.png` | `/os` | `main` | **PASS** |
| 05 | `05-service-order-statuses.png` | `/os` | `[data-testid="os-status-workflow-badges"]` | **PASS** |
| 06 | `06-part-combobox-open-dark.png` | `/os` | `#part-search-combobox-trigger` | **PASS** |
| 07 | `07-part-search-results-dark.png` | `/os` | `[role="option"]` | **PASS** |
| 08 | `08-part-without-stock-dark.png` | `/os` | `[role="option"][aria-disabled="true"]` | **PASS** |
| 09 | `09-part-selected-light.png` | `/os` | `#item-quantity` | **PASS** |
| 10 | `10-part-quantity-validation-light.png` | `/os` | `#item-quantity` | **PASS** |
| 11 | `11-budget-approval-dark.png` | `/os` | `[data-testid="budget-approval-section"]` | **PASS** |
| 12 | `12-inventory-light.png` | `/estoque` | `tbody tr, table` | **PASS** |
| 13 | `13-clients-light.png` | `/clientes` | `main` | **PASS** |
| 14 | `14-client-create-light.png` | `/clientes` | `form` | **PASS** |
| 15 | `15-client-edit-dark.png` | `/clientes` | `form` | **PASS** |
| 16 | `16-vehicles-light.png` | `/veiculos` | `main` | **PASS** |
| 17 | `17-suppliers-light.png` | `/fornecedores` | `main` | **PASS** |
| 18 | `18-finance-light.png` | `/financeiro` | `main` | **PASS** |
| 19 | `19-branches-light.png` | `/filiais` | `main` | **PASS** |
| 20 | `20-branch-switch-dark.png` | `/filiais` | `[role="menu"]` | **PASS** |
| 21 | `21-users-light.png` | `/usuarios` | `main` | **PASS** |
| 22 | `22-audit-dark.png` | `/auditoria` | `main` | **PASS** |
| 23 | `23-reports-light.png` | `/relatorios` | `main` | **PASS** |
| 24 | `24-select-light.png` | `/os` | `select, [role="combobox"]` | **PASS** |
| 25 | `25-select-dark.png` | `/os` | `select, [role="combobox"]` | **PASS** |
| 26 | `26-desktop-1024.png` | `/clientes` | `[data-state="collapsed"]` | **PASS** |
| 27 | `27-tablet-768.png` | `/filiais` | `[data-state="collapsed"]` | **PASS** |
| 28 | `28-mobile-dashboard-390.png` | `/` | `main` | **PASS** |
| 29 | `29-mobile-clients-390.png` | `/clientes` | `[data-testid="clients-table"] .rounded-xl, .rounded-xl` | **PASS** |
| 30 | `30-mobile-service-orders-390.png` | `/os` | `[data-testid="service-orders-page"] button.rounded-xl, button.rounded-xl` | **PASS** |
| 31 | `31-mobile-form-390.png` | `/clientes` | `form` | **PASS** |
| 32 | `32-api-decimal-contract.png` | `/api/inventory/parts` | `.card` | **PASS** |

---

> [!IMPORTANT]
> **REPOSITÓRIO PRONTO PARA COMMIT**: Todos os 5 bloqueadores de evidência e os 2 refinamentos visuais de UI foram corrigidos, a suíte de testes automatizados passou (23/23 arquivos, 136/136 testes) e o manifesto foi validado com seletores específicos.
