# Walkthrough — Frontend Service Order Part Purchase Workflow

```text
FRONTEND PROCUREMENT WORKFLOW READY FOR PR TO DEVELOP
```

## Resumo do Trabalho Realizado

Implementado o módulo frontend completo para a solicitação, acompanhamento, compra, recebimento físico no estoque, retirada, instalação de peças e central de notificações na Ordem de Serviço e Módulo Financeiro/Estoque do AutoSync ERP.

---

## 1. Componentes e Estruturas Criadas

### Módulo Procurement (`apps/web/src/modules/procurement/`)
- **`types/procurement.types.ts`**: Tipagem typescript estrita de solicitações, status (`REQUESTED`, `IN_PROGRESS`, `READY_FOR_PICKUP`, `INSTALLED`, `CANCELED`), prioridades, DTOs e eventos.
- **`utils/procurementUtils.ts`**: Formatadores de moeda BRL, status traduzidos e utilitário `normalizeDecimalInput` (conversão de `250,90` para `250.90`).
- **`services/procurementService.ts`**: Cliente de API centralizado reutilizando o Axios global com injeção automática de JWT, `x-company-id` e `x-branch-id`.
- **`schemas/procurementSchemas.ts`**: Schemas Zod de validação para solicitação, compra, recebimento, instalação e cancelamento.
- **`hooks/`**:
  - `usePurchaseRequests.ts`: Listagem com escopo de filial e filtros.
  - `usePurchaseRequest.ts`: Detalhes da solicitação por ID.
  - `useCodeSuggestion.ts`: Consulta sugestão de código interno (`GET /api/procurement/part-requests/:id/code-suggestion`).
  - `useProcurementMutations.ts`: Mutantes do React Query com invalidação de cache de OS, procurement, estoque e notificações.
  - `useNotifications.ts`: Polling a cada 30 segundos, `refetchOnWindowFocus`, contador de não lidas e marcação.
  - `useSuppliers.ts`: Reutilização da listagem de fornecedores (`GET /api/suppliers`).
- **`components/`**:
  - `PurchaseRequestStatusBadge.tsx`: Badges estilizados com traduções em pt-BR.
  - `CreatePartRequestDialog.tsx`: Modal do mecânico fora do `<form>` principal para evitar formulários aninhados.
  - `PurchaseRequestDetailSheet.tsx`: Painel lateral completo com origem da OS, dados da solicitação, compra e linha do tempo de eventos.
  - `RegisterPurchaseForm.tsx`: Formulário do financeiro com auto-preenchimento e geração de código interno (`PEC-2026-XXXXXX`).
  - `ReceivePartForm.tsx`: Formulário de confirmação do estoquista em modo somente leitura para dados cadastrais, coletando apenas quantidade física recebida.
  - `InstallPartDialog.tsx`: Modal de confirmação de instalação pelo mecânico.
  - `CancelPartRequestDialog.tsx`: Modal de cancelamento com justificativa obrigatória.
  - `PurchaseRequestFilters.tsx` & `PurchaseRequestTable.tsx` & `PurchaseRequestMobileList.tsx`: Filtros e suporte a layouts Desktop / Mobile (`< 768px`).
- **`pages/PurchaseRequests.tsx`**: Página principal em `/financeiro/solicitacoes-de-pecas` com KPI cards agregados da visualização atual.

### Integração com Ordem de Serviço (`apps/web/src/modules/service-orders/`)
- **`ServiceOrderItemForm.tsx`**: Botão "Solicitar Peça para Compra" aciona o modal `CreatePartRequestDialog`, mantendo intacta a pesquisa de catálogo de peças existente.
- **`ServiceOrderPartRequestsSection.tsx`**: Nova seção na OS exibindo peças solicitadas, status traduzidos, previsão de entrega, valor e botão "Confirmar Instalação" para o mecânico.
- **`ServiceOrderDetailSheet.tsx`**: Integrada a seção de solicitações de compra.

### Central de Notificações (`apps/web/src/components/notifications/`)
- **`NotificationBell.tsx`**: Sino no header com polling a cada 30s, contador de não lidas, popover de mensagens, marcação e navegação inteligente com validação de filial.

### Controle de Acesso e Filiais
- **`PermissionGate.tsx` & `PermissionRoute.tsx`**: Componentes para visibilidade condicional e proteção de rotas via RBAC.
- **`AppSidebar.tsx` & `App.tsx`**: Rota `/financeiro/solicitacoes-de-pecas` registrada e adicionada ao menu "Gestão".
- **`AppLayout.tsx`**: Listener `autosync:branch-changed` limpando o cache das queries de procurement e notificações ao alternar de filial.

---

## 2. Testes e Validações Executados

### Suíte de Testes E2E (Playwright)
```bash
npx playwright test tests/e2e/procurement-workflow.spec.ts

# Resultado:
Running 6 tests using 1 worker
  6 passed (1.3s)
```

### Suíte de Testes Backend (Vitest)
```bash
JWT_SECRET="..." pnpm --filter back test

# Resultado:
 Test Files  31 passed (31)
      Tests  195 passed (195)
```

### Suíte de Testes Frontend (Vitest & TSC)
```bash
pnpm --filter front exec tsc --noEmit && pnpm --filter front test --run

# Resultado:
 Test Files  24 passed (24)
      Tests  140 passed (140)
```

### ESLint Frontend
```bash
pnpm --filter front lint

# Resultado:
0 erros
```

### Build do Monorepo
```bash
pnpm build

# Resultado:
PASS (0 erros de compilação em apps/api e apps/web)
```
