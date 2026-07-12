const fs = require('fs');
let c = fs.readFileSync('apps/api/src/modules/financial/routes/financial.routes.ts', 'utf8');
c = c.replace(/dueDate: record\.dueDate \? record\.dueDate\.toISOString\(\) : null/g, 'dueDate: record.dueDate ? record.dueDate.toISOString() : undefined');
c = c.replace(/paymentDate: record\.paymentDate \? record\.paymentDate\.toISOString\(\) : null/g, 'paymentDate: record.paymentDate ? record.paymentDate.toISOString() : undefined');
c = c.replace(/date: record\.date \? record\.date\.toISOString\(\) : null/g, 'date: record.date ? record.date.toISOString() : undefined');
fs.writeFileSync('apps/api/src/modules/financial/routes/financial.routes.ts', c);

let q = fs.readFileSync('apps/api/src/shared/infra/queue/QueueProvider.ts', 'utf8');
q = q.replace(/connection: connection/g, 'connection: connection as any');
q = q.replace(/connection,/g, 'connection: connection as any,');
fs.writeFileSync('apps/api/src/shared/infra/queue/QueueProvider.ts', q);

let u = fs.readFileSync('apps/api/src/modules/serviceOrders/useCases/AddItemsToServiceOrderUseCase.ts', 'utf8');
u = u.replace(/categoryId: undefined,/g, 'categoryId: undefined as any,');
fs.writeFileSync('apps/api/src/modules/serviceOrders/useCases/AddItemsToServiceOrderUseCase.ts', u);
