# AutoSync - ERD Completo (Produção)

## 🌐 CORE (Multi-tenant base)

### Company (Empresa)

* id (PK)
* name
* document (CNPJ)
* createdAt

---

### Branch (Filial)

* id (PK)
* companyId (FK)
* name
* address

---

### User

* id (PK)
* companyId (FK)
* branchId (FK)
* name
* email
* password
* role
* active

---

### Role

* id (PK)
* name
* permissions (json)

---

# 👥 CLIENTES E FROTAS

## Client

* id (PK)
* companyId (FK)
* type (PRIVATE | PUBLIC)
* name
* document
* phone
* email

---

## Contract (Contrato Público/Privado)

* id (PK)
* clientId (FK)
* companyId (FK)
* number
* startDate
* endDate
* totalValue
* remainingValue
* status

---

## Commitment (Empenho - Público)

* id (PK)
* contractId (FK)
* value
* usedValue
* number
* date

---

## Vehicle

* id (PK)
* clientId (FK)
* branchId (FK)
* plate
* chassis
* type (CAR | TRUCK | BUS | MOTORCYCLE | HEAVY)
* mileage
* active

---

## VehicleTimeline

* id (PK)
* vehicleId (FK)
* eventType
* description
* createdAt

---

# 🛠️ ATENDIMENTO (CORE DO SISTEMA)

## MaintenanceRequest (Solicitação)

* id (PK)
* clientId (FK)
* vehicleId (FK)
* status
* priority
* createdAt

---

## MaintenanceAppointment (Agendamento)

* id (PK)
* requestId (FK)
* scheduledDate
* status

---

## Maintenance (Atendimento)

* id (PK)
* requestId (FK)
* contractId (FK)
* status
* checkinAt
* checkoutAt

---

## Diagnosis

* id (PK)
* maintenanceId (FK)
* description
* cause
* estimatedHours
* createdAt

---

## Approval (Aprovação por item)

* id (PK)
* maintenanceId (FK)
* workItemId (FK)
* status (APPROVED | REJECTED | PENDING)
* approvedBy
* approvedAt

---

## WorkItem (ENTIDADE MAIS IMPORTANTE)

* id (PK)
* maintenanceId (FK)
* type (MECHANIC | PAINT | ELECTRIC | BODYWORK | FINISHING)
* description
* status
* estimatedValue
* actualValue

---

## TechnicalAssignment

* id (PK)
* workItemId (FK)
* userId (FK)
* specialty
* createdAt

---

## TechnicalTimeEntry

* id (PK)
* assignmentId (FK)
* startTime
* endTime
* hours

---

# 📸 EVIDÊNCIAS (AUDITORIA OBRIGATÓRIA)

## Evidence

* id (PK)
* maintenanceId (FK)
* workItemId (FK)
* userId (FK)
* type (CHECKIN | BEFORE | DURING | AFTER | VIDEO | DOCUMENT | PDF)
* fileUrl
* description
* createdAt

---

# 🧾 RELATÓRIO TÉCNICO

## TechnicalReport

* id (PK)
* maintenanceId (FK)
* generatedAt
* status
* signedByUserId

---

## ReportSignature

* id (PK)
* reportId (FK)
* userId (FK)
* role
* signedAt

---

# 🛞 FROTA AVANÇADA

## Tire

* id (PK)
* vehicleId (FK)
* brand
* model
* dot
* position
* mileage
* status

---

## TireHistory

* id (PK)
* tireId (FK)
* eventType
* createdAt

---

# 📦 ESTOQUE

## StockItem

* id (PK)
* companyId (FK)
* name
* quantity
* unitPrice

---

## StockMovement

* id (PK)
* stockItemId (FK)
* type (IN | OUT | ADJUST)
* quantity
* referenceId (WorkItem / Purchase)

---

## StockReservation

* id (PK)
* stockItemId (FK)
* workItemId (FK)
* quantity

---

# 🛒 COMPRAS

## Supplier

* id (PK)
* name
* document

---

## ServiceProvider (Terceirizado)

* id (PK)
* name
* document
* specialty

---

## PurchaseRequest

* id (PK)
* workItemId (FK)
* status

---

## PurchaseOrder

* id (PK)
* supplierId (FK)
* status
* totalValue

---

# 🧾 FISCAL

## Invoice (NF-e entrada/saída)

* id (PK)
* companyId (FK)
* xml
* number
* type (IN | OUT)
* totalValue
* issuedAt

---

## ServiceInvoice (NFS-e)

* id (PK)
* maintenanceId (FK)
* totalValue
* status

---

## Measurement (MEDIÇÃO)

* id (PK)
* contractId (FK)
* periodStart
* periodEnd
* totalValue
* status

---

# 💰 FINANCEIRO

## AccountPayable

* id (PK)
* supplierId (FK)
* value
* dueDate
* status

---

## AccountReceivable

* id (PK)
* clientId (FK)
* value
* dueDate
* status

---

# 🔁 GARANTIA

## Warranty

* id (PK)
* maintenanceId (FK)
* workItemId (FK)
* type
* startDate
* endDate
* status

---

# 🔄 RELACIONAMENTO CENTRAL (VISÃO GERAL)

```text
Client
  └── Vehicle
        └── MaintenanceRequest
              └── Maintenance
                    ├── Diagnosis
                    ├── WorkItems
                    │     ├── Approvals
                    │     ├── TimeEntries
                    │     ├── Evidence
                    │     ├── StockReservation
                    │     └── PurchaseRequest
                    ├── TechnicalAssignments
                    ├── TechnicalReports
                    ├── Warranty
                    └── Billing (Invoice / NFS / Measurement)
```

---

# 🧠 REGRAS DE OURO DO MODELO

* Todo custo nasce de WorkItem
* Toda execução tem evidência obrigatória
* Toda aprovação é por item
* Todo atendimento é auditável
* Nenhum dado financeiro nasce no frontend
* Multi-tenant obrigatório em todas entidades críticas
* Histórico nunca é apagado (soft delete ou evento)

---

# 🎯 RESULTADO

Este ERD permite:

* oficinas privadas
* redes de oficinas
* frotas empresariais
* contratos públicos
* licitações
* rastreabilidade total
* auditoria completa
* integração fiscal

Sem necessidade de reestruturação futura do domínio
# AutoSync - ERD Completo (Produção)

## 🌐 CORE (Multi-tenant base)

### Company (Empresa)

* id (PK)
* name
* document (CNPJ)
* createdAt

---

### Branch (Filial)

* id (PK)
* companyId (FK)
* name
* address

---

### User

* id (PK)
* companyId (FK)
* branchId (FK)
* name
* email
* password
* role
* active

---

### Role

* id (PK)
* name
* permissions (json)

---

# 👥 CLIENTES E FROTAS

## Client

* id (PK)
* companyId (FK)
* type (PRIVATE | PUBLIC)
* name
* document
* phone
* email

---

## Contract (Contrato Público/Privado)

* id (PK)
* clientId (FK)
* companyId (FK)
* number
* startDate
* endDate
* totalValue
* remainingValue
* status

---

## Commitment (Empenho - Público)

* id (PK)
* contractId (FK)
* value
* usedValue
* number
* date

---

## Vehicle

* id (PK)
* clientId (FK)
* branchId (FK)
* plate
* chassis
* type (CAR | TRUCK | BUS | MOTORCYCLE | HEAVY)
* mileage
* active

---

## VehicleTimeline

* id (PK)
* vehicleId (FK)
* eventType
* description
* createdAt

---

# 🛠️ ATENDIMENTO (CORE DO SISTEMA)

## MaintenanceRequest (Solicitação)

* id (PK)
* clientId (FK)
* vehicleId (FK)
* status
* priority
* createdAt

---

## MaintenanceAppointment (Agendamento)

* id (PK)
* requestId (FK)
* scheduledDate
* status

---

## Maintenance (Atendimento)

* id (PK)
* requestId (FK)
* contractId (FK)
* status
* checkinAt
* checkoutAt

---

## Diagnosis

* id (PK)
* maintenanceId (FK)
* description
* cause
* estimatedHours
* createdAt

---

## Approval (Aprovação por item)

* id (PK)
* maintenanceId (FK)
* workItemId (FK)
* status (APPROVED | REJECTED | PENDING)
* approvedBy
* approvedAt

---

## WorkItem (ENTIDADE MAIS IMPORTANTE)

* id (PK)
* maintenanceId (FK)
* type (MECHANIC | PAINT | ELECTRIC | BODYWORK | FINISHING)
* description
* status
* estimatedValue
* actualValue

---

## TechnicalAssignment

* id (PK)
* workItemId (FK)
* userId (FK)
* specialty
* createdAt

---

## TechnicalTimeEntry

* id (PK)
* assignmentId (FK)
* startTime
* endTime
* hours

---

# 📸 EVIDÊNCIAS (AUDITORIA OBRIGATÓRIA)

## Evidence

* id (PK)
* maintenanceId (FK)
* workItemId (FK)
* userId (FK)
* type (CHECKIN | BEFORE | DURING | AFTER | VIDEO | DOCUMENT | PDF)
* fileUrl
* description
* createdAt

---

# 🧾 RELATÓRIO TÉCNICO

## TechnicalReport

* id (PK)
* maintenanceId (FK)
* generatedAt
* status
* signedByUserId

---

## ReportSignature

* id (PK)
* reportId (FK)
* userId (FK)
* role
* signedAt

---

# 🛞 FROTA AVANÇADA

## Tire

* id (PK)
* vehicleId (FK)
* brand
* model
* dot
* position
* mileage
* status

---

## TireHistory

* id (PK)
* tireId (FK)
* eventType
* createdAt

---

# 📦 ESTOQUE

## StockItem

* id (PK)
* companyId (FK)
* name
* quantity
* unitPrice

---

## StockMovement

* id (PK)
* stockItemId (FK)
* type (IN | OUT | ADJUST)
* quantity
* referenceId (WorkItem / Purchase)

---

## StockReservation

* id (PK)
* stockItemId (FK)
* workItemId (FK)
* quantity

---

# 🛒 COMPRAS

## Supplier

* id (PK)
* name
* document

---

## ServiceProvider (Terceirizado)

* id (PK)
* name
* document
* specialty

---

## PurchaseRequest

* id (PK)
* workItemId (FK)
* status

---

## PurchaseOrder

* id (PK)
* supplierId (FK)
* status
* totalValue

---

# 🧾 FISCAL

## Invoice (NF-e entrada/saída)

* id (PK)
* companyId (FK)
* xml
* number
* type (IN | OUT)
* totalValue
* issuedAt

---

## ServiceInvoice (NFS-e)

* id (PK)
* maintenanceId (FK)
* totalValue
* status

---

## Measurement (MEDIÇÃO)

* id (PK)
* contractId (FK)
* periodStart
* periodEnd
* totalValue
* status

---

# 💰 FINANCEIRO

## AccountPayable

* id (PK)
* supplierId (FK)
* value
* dueDate
* status

---

## AccountReceivable

* id (PK)
* clientId (FK)
* value
* dueDate
* status

---

# 🔁 GARANTIA

## Warranty

* id (PK)
* maintenanceId (FK)
* workItemId (FK)
* type
* startDate
* endDate
* status

---

# 🔄 RELACIONAMENTO CENTRAL (VISÃO GERAL)

```text
Client
  └── Vehicle
        └── MaintenanceRequest
              └── Maintenance
                    ├── Diagnosis
                    ├── WorkItems
                    │     ├── Approvals
                    │     ├── TimeEntries
                    │     ├── Evidence
                    │     ├── StockReservation
                    │     └── PurchaseRequest
                    ├── TechnicalAssignments
                    ├── TechnicalReports
                    ├── Warranty
                    └── Billing (Invoice / NFS / Measurement)
```

---

# 🧠 REGRAS DE OURO DO MODELO

* Todo custo nasce de WorkItem
* Toda execução tem evidência obrigatória
* Toda aprovação é por item
* Todo atendimento é auditável
* Nenhum dado financeiro nasce no frontend
* Multi-tenant obrigatório em todas entidades críticas
* Histórico nunca é apagado (soft delete ou evento)

---

# 🎯 RESULTADO

Este ERD permite:

* oficinas privadas
* redes de oficinas
* frotas empresariais
* contratos públicos
* licitações
* rastreabilidade total
* auditoria completa
* integração fiscal

Sem necessidade de reestruturação futura do domínio
