# Plano de Implementação — Frontend Service Order Part Purchase Workflow

Implementação da camada frontend para o workflow completo de solicitação, compra, recebimento físico no estoque, retirada e instalação de peças não cadastradas ou sem estoque, originadas pela Ordem de Serviço e integradas aos módulos financeiro, estoque e notificações.

## User Review Required

> [!IMPORTANT]
> - O botão "Cadastrar nova peça" no formulário da OS será substituído por **"Solicitar peça para compra"**. Ele abre o modal `CreatePartRequestDialog`, coletando apenas nome/descrição, quantidade, observação técnica, prioridade e data limite, sem exigir código, preço ou dados de estoque.
> - As notificações utilizam polling a cada 30 segundos (`refetchInterval: 30000`) com `refetchOnWindowFocus: true` e filtro estrito por `recipientId` e `activeBranchId`.
> - A troca de filial via `BranchContext` invalida as queries de solicitações e notificações para impedir vazamento visual entre filiais.

## Proposed Changes

---

### Módulo Procurement (`apps/web/src/modules/procurement/`)

#### [NEW] [procurement.types.ts](file:///Users/yknwo/Desktop/AutoSync/apps/web/src/modules/procurement/types/procurement.types.ts)
- Define os tipos typescript estritos:
  - `PurchaseRequestStatus`: `'REQUESTED' | 'IN_PROGRESS' | 'READY_FOR_PICKUP' | 'INSTALLED' | 'CANCELED'`
  - `PurchaseRequestPriority`: `'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'`
  - `PurchaseRequest`, `PurchaseRequestEvent`, `Notification`
  - DTOs de envio e filtros.

#### [NEW] [procurementService.ts](file:///Users/yknwo/Desktop/AutoSync/apps/web/src/modules/procurement/services/procurementService.ts)
- Centraliza chamadas HTTP via Axios anexando o header `X-Branch-Id`:
  - `createPartRequest(data)`
  - `listPartRequests(params)`
  - `getPartRequest(id)`
  - `getCodeSuggestion(id)`
  - `startProgress(id)`
  - `registerPurchase(id, data)`
  - `receivePart(id, data)`
  - `installPart(id, data)`
  - `cancelPartRequest(id, data)`

#### [NEW] [procurementSchemas.ts](file:///Users/yknwo/Desktop/AutoSync/apps/web/src/modules/procurement/schemas/procurementSchemas.ts)
- Validações Zod para formulários:
  - `createPartRequestSchema`
  - `registerPurchaseSchema`
  - `receivePartSchema`
  - `installPartSchema`
  - `cancelPartRequestSchema`

#### [NEW] [Hooks de Procurement](file:///Users/yknwo/Desktop/AutoSync/apps/web/src/modules/procurement/hooks/)
- `usePurchaseRequests.ts`: Busca e paginação com filtro por `activeBranchId`.
- `usePurchaseRequest.ts`: Detalhe da solicitação.
- `useCodeSuggestion.ts`: Consulta sugestão de código interno (`GET /api/procurement/part-requests/:id/code-suggestion`).
- `useProcurementMutations.ts`: Encapsula `useMutation` para cada ação, com `invalidateQueries` para OS, solicitações e notificações.

#### [NEW] [Componentes de Procurement](file:///Users/yknwo/Desktop/AutoSync/apps/web/src/modules/procurement/components/)
- `PurchaseRequestStatusBadge.tsx`: Badges traduzidos (`Solicitada`, `Em andamento`, `Pronta para retirada`, `Instalada`, `Cancelada`).
- `CreatePartRequestDialog.tsx`: Modal do mecânico na OS ("Solicitar peça para compra").
- `PurchaseRequestDetailSheet.tsx`: Sheet responsivo de detalhes (Origem, Solicitação, Compra, Histórico).
- `StartProgressButton.tsx`: Ação do financeiro para iniciar atendimento.
- `RegisterPurchaseForm.tsx`: Formulário do financeiro com auto-preenchimento e solicitação de sugestão de código (`PEC-2026-XXXXXX`).
- `ReceivePartForm.tsx`: Formulário de confirmação de recebimento físico pelo estoquista com validação `receivedQuantity >= requestedQuantity`.
- `InstallPartDialog.tsx`: Modal de confirmação de instalação na OS pelo mecânico.
- `CancelPartRequestDialog.tsx`: Modal de cancelamento com justificativa obrigatória.
- `PurchaseRequestFilters.tsx` & `PurchaseRequestTable.tsx` & `PurchaseRequestMobileList.tsx`: Filtros e listagem responsiva (DataTable desktop, cards dedicados em mobile `< 768px`).

#### [NEW] [PurchaseRequests.tsx](file:///Users/yknwo/Desktop/AutoSync/apps/web/src/modules/procurement/pages/PurchaseRequests.tsx)
- Página principal em `/financeiro/solicitacoes-de-pecas` com KPI cards.

---

### Módulo Ordem de Serviço (`apps/web/src/modules/service-orders/`)

#### [MODIFY] [ServiceOrderItemForm.tsx](file:///Users/yknwo/Desktop/AutoSync/apps/web/src/modules/service-orders/components/ServiceOrderItemForm.tsx)
- Substitui o modal antigo "Cadastrar nova peça" pelo `CreatePartRequestDialog` ("Solicitar nova peça para compra").

#### [MODIFY] [ServiceOrderDetailSheet.tsx](file:///Users/yknwo/Desktop/AutoSync/apps/web/src/modules/service-orders/components/ServiceOrderDetailSheet.tsx)
- Adiciona a seção **"Peças solicitadas para compra"** exibindo cards das solicitações vinculadas à OS, histórico, status traduzido e o botão **"Confirmar instalação"** para peças `READY_FOR_PICKUP`.

---

### Sistema de Notificações (`apps/web/src/components/notifications/`)

#### [NEW] [NotificationBell.tsx](file:///Users/yknwo/Desktop/AutoSync/apps/web/src/components/notifications/NotificationBell.tsx)
- Popover de notificações com polling de 30 segundos, badge de não lidas, ação "Marcar todas como lidas", clique individual que redireciona à OS ou solicitação e marca como lida.

---

### Rotas e Navegação (`apps/web/src/`)

#### [MODIFY] [App.tsx](file:///Users/yknwo/Desktop/AutoSync/apps/web/src/App.tsx)
- Registra a rota `/financeiro/solicitacoes-de-pecas`.

#### [MODIFY] [AppSidebar.tsx](file:///Users/yknwo/Desktop/AutoSync/apps/web/src/components/layout/AppSidebar.tsx)
- Adiciona o item de menu "Solicitações de Peças" no grupo Financeiro/Estoque.
