
# Bounded Contexts — AutoSync System

Este documento define os limites rígidos de contexto do sistema AutoSync.

Regra principal:
> Nenhum contexto pode acessar diretamente regras internas de outro contexto sem eventos ou interfaces explícitas.

---

## 🏢 Identity & Multi-Tenant Context

Responsabilidade:
- Company
- Branch
- User
- Role

Regras:
- Controla autenticação e autorização
- Não contém regras de negócio de oficina
- Não acessa dados de manutenção, estoque ou financeiro

Dependências permitidas:
- Nenhuma dependência direta de outros contextos

---

## 🚗 Fleet & Client Context

Responsabilidade:
- Client
- Vehicle
- VehicleTimeline
- Contract
- Commitment

Regras:
- Representa entidades externas ao sistema operacional
- Não executa lógica de manutenção
- Pode emitir eventos para Maintenance Context

Dependências:
- Identity Context (apenas validação de user/company scope)

---

## 🛠️ Maintenance Core Context

Responsabilidade:
- MaintenanceRequest
- Maintenance
- Diagnosis
- WorkItem
- Approval

Regras:
- Core do sistema operacional
- Contém regras de execução de serviço
- Define WorkItem como unidade econômica

Dependências:
- Fleet Context (read-only)
- Inventory via eventos
- Execution via eventos

---

## 👷 Execution Context

Responsabilidade:
- TechnicalAssignment
- TechnicalTimeEntry
- Evidence

Regras:
- Registra execução real do trabalho
- Não cria regras de negócio
- Não decide aprovação

Dependências:
- Maintenance Context (event-driven)

---

## 📦 Inventory Context

Responsabilidade:
- StockItem
- StockMovement
- StockReservation
- Supplier
- ServiceProvider

Regras:
- Controle físico de materiais
- Atualização apenas por eventos
- Nunca chamado diretamente por Maintenance

Dependências:
- Event Bus (obrigatório)

---

## 💰 Finance Context

Responsabilidade:
- AccountPayable
- AccountReceivable
- Measurement

Regras:
- Processa dados financeiros derivados
- Não cria WorkItems ou Maintenance

Dependências:
- Maintenance (event-driven)
- Inventory (event-driven)

---

## 🧾 Fiscal Context

Responsabilidade:
- Invoice
- ServiceInvoice

Regras:
- Emissão fiscal
- Integração SEFAZ/NFS-e
- Apenas consome eventos

Dependências:
- Finance Context
- Maintenance Context