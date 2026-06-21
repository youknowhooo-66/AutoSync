# Aggregate Design — AutoSync System

Este documento define Aggregate Roots e invariantes do domínio.

Regra:
> Toda consistência forte vive dentro de um Aggregate Root.

---

## 🏢 Identity Aggregate

### Root: Company

Entidades:
- Branch
- User
- Role

Regras:
- Usuário pertence a uma Company
- Role define permissões operacionais
- Branch é isolada dentro da Company

---

## 🚗 Fleet Aggregate

### Root: Vehicle

Entidades:
- VehicleTimeline

Regras:
- Timeline é append-only
- Vehicle não depende de Maintenance

---

## 🛠️ Maintenance Aggregate (CORE)

### Root: Maintenance

Entidades:
- MaintenanceRequest
- Diagnosis
- WorkItem
- Approval

Invariantes críticas:

- WorkItem não pode existir sem Maintenance
- Approval é por WorkItem (não global)
- Maintenance só pode ser finalizada se todos WorkItems estiverem aprovados ou rejeitados

Regras:
- Maintenance é o agregador central do sistema
- Controla lifecycle completo do serviço

---

## 🧩 WorkItem Aggregate (sub-entity controlada)

Entidades:
- Approval
- Assignment
- StockReservation (reference only)

Regras:
- WorkItem representa unidade econômica
- Estado depende de Approval + Execution
- Pode gerar eventos financeiros

---

## 👷 Execution Aggregate

### Root: None (event-driven entity group)

Entidades:
- TechnicalAssignment
- TechnicalTimeEntry
- Evidence

Regras:
- Não altera estado de Maintenance diretamente
- Apenas registra execução

---

## 📦 Inventory Aggregate

### Root: StockItem

Entidades:
- StockMovement
- StockReservation

Regras:
- StockMovement é append-only
- Reservation evita conflitos de consumo
- Nunca muta estado baseado em chamada direta

---

## 💰 Finance Aggregate

### Root: AccountReceivable / AccountPayable

Regras:
- Criados a partir de eventos
- Nunca criam dados operacionais

---

## 🧾 Fiscal Aggregate

### Root: Invoice

Regras:
- Derivado de Measurement ou Finance events
- Não influencia operação do sistema