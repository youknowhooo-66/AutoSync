# Fluxo de Implementação DDD - AutoSync

Este documento registra o fluxo de decisões arquiteturais, o status de implementação e os próximos passos do sistema AutoSync. Ele serve como o guia principal de implementação (Single Source of Truth) para o desenvolvimento em Domain-Driven Design (DDD).

---

## 🏗️ 1. Fase 1: Fundação do Domínio Puro (✅ CONCLUÍDO)

Nesta fase, abandonamos o acoplamento com infraestrutura (Prisma/Express) na camada core e implementamos um **Rich Domain Model** puramente em TypeScript.

### Princípios Estabelecidos
- **Isolamento Total:** A camada de domínio não possui nenhuma dependência externa.
- **Aggregates como Guardiões:** Toda mutação de estado e regra de negócio crítica acontece *exclusivamente* dentro das entidades e aggregate roots.
- **Event-Driven:** Mutações geram *Domain Events* na memória para serem despachados posteriormente.
- **Tipagem Forte:** Identificadores únicos (`UniqueEntityId`) e objetos de valor (Value Objects) para garantir consistência.

### Módulos (Bounded Contexts) Implementados e Testados

| Módulo | Aggregate Root Principal | Entidades Chave | Status |
| :--- | :--- | :--- | :--- |
| **Identity** | `Company` (Multi-tenant) | `Branch`, `User`, `Role` | ✅ Testado & Concluído |
| **Fleet** | `Vehicle` | `Client`, `VehicleTimeline`, `Contract` | ✅ Testado & Concluído |
| **Maintenance** | `Maintenance` (CORE) | `WorkItem`, `Approval`, `Diagnosis` | ✅ Testado & Concluído |
| **Execution** | N/A (Event-driven) | `TechnicalTimeEntry`, `Evidence` | ✅ Testado & Concluído |
| **Inventory** | `StockItem` | `StockMovement`, `StockReservation` | ✅ Testado & Concluído |
| **Finance** | `Measurement` | `AccountPayable`, `AccountReceivable` | ✅ Testado & Concluído |
| **Fiscal** | `Invoice`, `ServiceInvoice`| N/A | ✅ Testado & Concluído |

### Invariantes e Regras de Negócio Garantidas (Via Suite Vitest)
1. `WorkItem` é a unidade econômica do sistema e tem ciclo de vida estrito.
2. `Maintenance` não pode ser finalizada enquanto possuir `WorkItems` não resolvidos.
3. `StockMovement`, `TechnicalTimeEntry` e `Evidence` são estritamente **Append-Only** e **Imutáveis**.
4. É impossível reservar estoque duplicado para o mesmo WorkItem (`StockReservationConflictError`).

---

## 🚀 2. Fase 2: Camada de Casos de Uso / Application Layer (🔄 PRÓXIMO PASSO)

A próxima fase consiste em construir os **Use Cases** que orquestram o Domínio.

### Padrão a ser seguido:
```typescript
class ApproveWorkItemUseCase {
  constructor(
    private maintenanceRepo: IMaintenanceRepository,
    private eventBus: IEventBus
  ) {}

  async execute(command: ApproveWorkItemCommand): Promise<void> {
    // 1. Carregar Aggregate
    const maintenance = await this.maintenanceRepo.findById(command.maintenanceId);
    
    // 2. Executar Regra de Domínio
    maintenance.approveWorkItem({ ... });
    
    // 3. Persistir Aggregate (Transacional)
    await this.maintenanceRepo.save(maintenance);
    
    // 4. Despachar Eventos de Domínio
    await this.eventBus.dispatchAll(maintenance.domainEvents);
  }
}
```

### Casos de Uso Prioritários para Implementação:
1. **Maintenance Flow:**
   - Abrir Solicitação de Manutenção
   - Criar Maintenance (Atendimento)
   - Adicionar WorkItems (Diagnóstico)
   - Aprovar/Rejeitar WorkItems
   - Iniciar/Finalizar Execução Técnica
   - Encerrar Maintenance
2. **Inventory Flow:**
   - Consumir Eventos: `StockReserved.v1`, `StockConsumed.v1`
3. **Execution Flow:**
   - Registrar Tempo (TimeEntry)
   - Fazer Upload de Evidência

---

## 💾 3. Fase 3: Infraestrutura e Adaptadores (Prisma e Event Bus) (⏳ FUTURO)

Após os Casos de Uso, implementaremos os repositórios reais e barramento de eventos.

### Objetivos:
- **Repositórios:** Implementar conversores (`Mappers`) que transformam os Aggregates ricos do Domínio nos modelos anêmicos do Prisma, respeitando o `domain-prisma-mapping.md`.
- **Event Bus:** Implementar mecanismo (RabbitMQ, Kafka ou mesmo Event Emitter em memória para começar) que reage aos eventos disparados e atualiza bounded contexts paralelos (Ex: Financeiro criando `AccountReceivable` após um `WorkItemCompleted`).

---

## 🌐 4. Fase 4: Camada de Apresentação (Controllers/GraphQL) (⏳ FUTURO)

Por fim, a exposição do sistema para os frontends (Web/Mobile).

### Objetivos:
- **Express / NestJS:** Criação das rotas REST ou GraphQL.
- **Autenticação:** Proteção de rotas, injeção de Tenant (`companyId`) via token JWT diretamente no comando enviado para os Use Cases.
