
```md
# Domain ↔ Prisma Mapping — AutoSync System

Regra:
> Prisma nunca define domínio. Ele apenas persiste estados definidos pelo domínio.

---

## 🏢 Identity

Company → companies
Branch → branches
User → users
Role → roles

Persistência:
- Relacional direta
- Sem derived fields

---

## 🚗 Fleet

Vehicle → vehicles
VehicleTimeline → vehicle_timelines

Regras:
- VehicleTimeline = append-only table
- Nunca update em timeline

---

## 🛠️ Maintenance

Maintenance → maintenances
MaintenanceRequest → maintenance_requests
Diagnosis → diagnoses
WorkItem → work_items
Approval → approvals

Regras:
- WorkItem é transacional
- Approval é histórico imutável
- Diagnosis pode ser versionado

---

## 👷 Execution

TechnicalAssignment → technical_assignments
TechnicalTimeEntry → time_entries
Evidence → evidences

Regras:
- Evidence = immutable storage reference
- TimeEntry = append-only

---

## 📦 Inventory

StockItem → stock_items
StockMovement → stock_movements
StockReservation → stock_reservations

Regras:
- StockMovement nunca é atualizado
- Reservation expira ou é liberada

---

## 💰 Finance

AccountPayable → accounts_payable
AccountReceivable → accounts_receivable
Measurement → measurements

Regras:
- Measurement é snapshot agregado

---

## 🧾 Fiscal

Invoice → invoices
ServiceInvoice → service_invoices

Regras:
- Apenas persistência de eventos fiscais
