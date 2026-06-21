# Event Contracts — AutoSync System

Regra principal:
> Eventos representam fatos imutáveis do sistema.

---

## 📌 PADRÃO OBRIGATÓRIO

Todos os eventos devem conter:

- eventId (uuid)
- eventType
- timestamp
- companyId
- correlationId
- payload
- version

---

## 🛠️ Maintenance Events

### MaintenanceCreated.v1
```json
{
  "maintenanceId": "",
  "clientId": "",
  "vehicleId": ""
}

WorkItemCreated.v1
{
  "workItemId": "",
  "maintenanceId": "",
  "description": "",
  "estimatedCost": 0
}
WorkItemApproved.v1
{
  "workItemId": "",
  "maintenanceId": "",
  "approvedBy": ""
}
WorkItemRejected.v1
{
  "workItemId": "",
  "reason": ""
}
👷 Execution Events
TechnicalAssignmentCreated.v1
{
  "workItemId": "",
  "userId": ""
}
TimeEntryRegistered.v1
{
  "workItemId": "",
  "hours": 0
}
EvidenceUploaded.v1
{
  "workItemId": "",
  "type": "before|during|after|document",
  "url": ""
}
📦 Inventory Events
StockReserved.v1
{
  "stockItemId": "",
  "quantity": 0,
  "workItemId": ""
}
StockConsumed.v1
{
  "stockItemId": "",
  "quantity": 0
}
💰 Finance Events
WorkItemCompleted.v1
{
  "workItemId": "",
  "totalCost": 0
}
MeasurementGenerated.v1
{
  "period": "",
  "totalValue": 0
}
InvoiceIssued.v1
{
  "invoiceId": "",
  "type": "nfe|nfse",
  "referenceId": ""
}

---