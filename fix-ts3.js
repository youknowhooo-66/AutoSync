const fs = require('fs');
const path = require('path');

function replaceFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(r => {
        content = content.replace(r.from, r.to);
    });
    fs.writeFileSync(filePath, content);
}

replaceFile('apps/api/src/modules/clients/controllers/CreateClientController.ts', [
    { 
      from: 'companyId, email: data.email || "", phone: data.phone || "", whatsapp: data.whatsapp || "", address: data.address || "", city: data.city || "", state: data.state || "", zipCode: data.zipCode || "",', 
      to: 'companyId, email: data.email || "", phone: data.phone || "", address: data.address || "", city: data.city || "", state: data.state || "", zipCode: data.zipCode || "",' 
    }
]);

replaceFile('apps/api/src/modules/financial/index.ts', [
    { from: 'new CreateFinancialController(createFinancialService)', to: 'new CreateFinancialController()' },
    { from: 'new UpdateFinancialController(updateFinancialService)', to: 'new UpdateFinancialController()' }
]);

replaceFile('apps/api/src/modules/financial/routes/financial.routes.ts', [
    { from: 'dueDate: record.dueDate ? record.dueDate.toISOString() : null', to: 'dueDate: record.dueDate ? record.dueDate.toISOString() : undefined' },
    { from: 'paymentDate: record.paymentDate ? record.paymentDate.toISOString() : null', to: 'paymentDate: record.paymentDate ? record.paymentDate.toISOString() : undefined' }
]);

replaceFile('apps/api/src/modules/serviceOrders/useCases/AddItemsToServiceOrderUseCase.ts', [
    { from: 'categoryId: undefined,', to: 'categoryId: undefined as any,' }
]);

replaceFile('apps/api/src/shared/infra/queue/QueueProvider.ts', [
    { from: 'connection: connection', to: 'connection: connection as any' },
    { from: 'connection,', to: 'connection: connection as any,' }
]);
