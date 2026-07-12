const fs = require('fs');

let f1 = fs.readFileSync('apps/api/src/modules/financial/routes/financial.routes.ts', 'utf8');
f1 = f1.replace(/dueDate: record\.dueDate \? record\.dueDate\.toISOString\(\) : null/g, 'dueDate: (record.dueDate ? record.dueDate.toISOString() : undefined) as any');
f1 = f1.replace(/date: record\.date \|\| new Date\(\)/g, 'date: (record.date as any) || new Date()');
fs.writeFileSync('apps/api/src/modules/financial/routes/financial.routes.ts', f1);

let f2 = fs.readFileSync('apps/api/src/modules/serviceOrders/useCases/AddItemsToServiceOrderUseCase.ts', 'utf8');
f2 = f2.replace(/categoryId: null/g, 'categoryId: undefined as any');
f2 = f2.replace(/categoryId: undefined,/g, 'categoryId: undefined as any,');
fs.writeFileSync('apps/api/src/modules/serviceOrders/useCases/AddItemsToServiceOrderUseCase.ts', f2);

let f3 = fs.readFileSync('apps/api/src/shared/infra/queue/QueueProvider.ts', 'utf8');
f3 = f3.replace(/connection: redisClient/g, 'connection: redisClient as any');
fs.writeFileSync('apps/api/src/shared/infra/queue/QueueProvider.ts', f3);

let f4 = fs.readFileSync('apps/api/src/shared/infra/http/health.routes.ts', 'utf8');
f4 = f4.replace(/QueueProvider\.getConnection\(\)\.ping\(\)/g, '(QueueProvider.getConnection() as any).ping()');
fs.writeFileSync('apps/api/src/shared/infra/http/health.routes.ts', f4);

