# Read Side (CQRS Query Models) — AutoSync

## Visão Geral

O pacote `@autosync/read-models` implementa o **Query Side** do AutoSync via **Event Projections**. Projeções são views materializadas alimentadas exclusivamente por Domain Events — sem acesso a Aggregates ou regras de negócio.

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Command Side   │────▶│  Event Bus   │────▶│  Projection Handlers │
│  (Use Cases)    │     │  + Outbox    │     │  (Read Side)         │
└─────────────────┘     └──────────────┘     └──────────┬──────────┘
                                                        │
                                                        ▼
                                             ┌─────────────────────┐
                                             │  Read Model Store   │
                                             │  (Views/Queries)    │
                                             └─────────────────────┘
```

## Princípios

| Regra | Implementação |
|-------|---------------|
| Sem regras de negócio | Projectors apenas transformam eventos em dados de leitura |
| Sem modificação de Aggregates | Handlers nunca chamam repositórios de escrita |
| Reconstruível | `ProjectionReplayService.rebuildAll()` |
| Idempotente | `withProjectionIdempotency` + `withIdempotency` (infra) |
| Eventos duplicados seguros | Deduplicação por `eventId + scope` |

## Estrutura

```
packages/read-models/
├── src/
│   ├── views/              # Interfaces das Read Models
│   ├── repositories/       # IProjectionRepository + InMemory
│   ├── projections/        # Lógica de atualização (projectors)
│   ├── handlers/           # Handlers por evento
│   ├── replay/             # Event Store + Replay Engine
│   ├── events/             # Contratos de eventos pendentes no domínio
│   └── wiring/             # Registro no Event Bus
├── projection-tests/       # Testes de projeção
└── docs/
    └── ARCHITECTURE.md
```

## Read Models

### 1. WorkItemDashboardView
Dashboard operacional de work items.

**Eventos:** `WorkItemCreated`, `WorkItemApproved`, `TechnicalAssignmentCreated`, `TimeEntryRegistered`, `EvidenceUploaded`, `WorkItemCompleted`

### 2. MaintenanceOverviewView
Visão consolidada de manutenções.

**Eventos:** `MaintenanceCreated`, `WorkItemCreated`, `WorkItemApproved`, `WorkItemCompleted`

### 3. InventoryProjectionView
Posição de estoque materializada.

**Eventos:** `StockItemRegistered`, `StockReserved`, `StockReleased`, `StockConsumed`

### 4. TechnicianProductivityView
Métricas de produtividade por técnico.

**Eventos:** `TimeEntryRegistered`, `WorkItemCompleted`

### 5. FinancialDashboardView
Dashboard financeiro por empresa.

**Eventos:** `MeasurementGenerated`, `InvoiceIssued`, `AccountReceivableCreated`, `AccountPayableCreated`, `WorkItemCompleted`

### 6. VehicleHistoryView
Histórico e timeline de veículos.

**Eventos:** `MaintenanceCreated`, `WorkItemCompleted`, `InvoiceIssued`

### 7. AuditTrailView
Trilha de auditoria universal.

**Eventos:** Todos os Domain Events

## Integração

```typescript
import { InMemoryEventBus, InMemoryIdempotencyStore } from '@autosync/infrastructure';
import { registerProjections } from '@autosync/read-models';

const eventBus = new InMemoryEventBus();
const readModels = registerProjections({
  eventBus,
  idempotencyStore: new InMemoryIdempotencyStore(),
});

// Consultar projeções
const workItems = await readModels.projectionStore.workItemDashboard.findAll();
```

## Event Replay

```typescript
// Reconstruir todas as projeções
await readModels.replayService.rebuildAll();

// Reconstruir projeção específica
await readModels.replayService.rebuildProjection('workItemDashboard');
```

## Denormalização

Campos como `vehiclePlate`, `clientName` e `assignedTechnicianName` são obtidos via `IReferenceDataLookup` — uma lookup table de referência, **não** acesso a Aggregates. Populada por:

- Eventos futuros de referência (`VehicleRegistered`, `ClientCreated`)
- Seed em testes via `InMemoryReferenceDataLookup`

## Eventos Pendentes no Domínio

Contratos definidos em `src/events/ProjectionEvents.ts`, aguardando implementação no `@autosync/domain`:

- `StockReleased`
- `AccountReceivableCreated`
- `AccountPayableCreated`

**Mapeamento:** `TechnicianAssigned` → `TechnicalAssignmentCreated` (evento existente no domínio)

## Persistência

| Camada | Implementação Atual | Futuro |
|--------|--------------------|---------|
| Read Models | `InMemoryProjectionStore` | Prisma Read DB |
| Event Store | `InMemoryEventStore` | Outbox / Event Log |
| Idempotency | `InMemoryProjectionIdempotencyTracker` | Redis / DB |

## Testes

```bash
pnpm --filter @autosync/read-models test
```

- **ProjectionUpdate** — evento → projeção correta
- **Replay** — rebuild produz mesmo resultado
- **Idempotency** — eventos duplicados não corrompem dados
- **CrossProjectionConsistency** — consistência entre views
