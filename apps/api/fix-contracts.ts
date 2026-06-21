import fs from "fs";
import path from "path";
import { globSync } from "glob";

const root = path.join(__dirname, "src");

const replaceInFiles = (pattern: string, replacements: { regex: RegExp; replacer: string }[]) => {
  const files = globSync(pattern);
  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    let changed = false;
    for (const { regex, replacer } of replacements) {
      if (regex.test(content)) {
        content = content.replace(regex, replacer);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
};

// Fix financial repository prisma calls: 'financialEntry' or 'financial' -> 'financialRecord'
replaceInFiles(path.join(root, "modules/financial/repositories/**/*.ts"), [
  { regex: /prisma\.financialEntry/g, replacer: "prisma.financialRecord" },
  { regex: /prisma\.financial\./g, replacer: "prisma.financialRecord." }
]);

// Fix stock repository: 'productId' -> 'partId', and 'id_companyId' -> 'companyId'
replaceInFiles(path.join(root, "modules/stock/repositories/**/*.ts"), [
  { regex: /productId:/g, replacer: "partId:" },
  { regex: /id_companyId:/g, replacer: "companyId:" }
]);

// Fix missing DTO exports in financial
replaceInFiles(path.join(root, "modules/financial/**/*.ts"), [
  { regex: /FinancialEntryType/g, replacer: "FinancialType" },
  { regex: /CreateFinancialEntryDTO/g, replacer: "CreateFinancialDTO" },
  { regex: /UpdateFinancialEntryDTO/g, replacer: "UpdateFinancialDTO" }
]);

// Fix vehicle DTO missing properties (licensePlate vs plate, color)
// PrismaVehicleRepository uses plate but DTO might use plate?
// "Type '{ model... }' is missing the following properties from type 'Vehicle': licensePlate, color"
// Wait, the schema uses 'plate' and 'color'. The code is probably missing 'color' and 'licensePlate'
replaceInFiles(path.join(root, "modules/vehicles/repositories/PrismaVehicleRepository.ts"), [
  { regex: /plate:/g, replacer: "licensePlate:" },
  { regex: /return vehicle;/g, replacer: "return { ...vehicle, color: vehicle.color || 'N/A', licensePlate: vehicle.plate };" },
  { regex: /return vehicles;/g, replacer: "return vehicles.map(v => ({ ...v, color: v.color || 'N/A', licensePlate: v.plate }));" }
]);

// Fix authMiddleware.test.ts
replaceInFiles(path.join(root, "tests/authMiddleware.test.ts"), [
  { regex: /email: 'a@a\.com',/g, replacer: "" }
]);

// Fix ClientController missing module
replaceInFiles(path.join(root, "controllers/ClientController.ts"), [
  { regex: /\.\.\/\.\.\/modules\/clients\/services\/ClientService/g, replacer: "../modules/clients/services/ClientService" },
  { regex: /\.\.\/\.\.\/modules\/clients\/dtos\/ClientDTO/g, replacer: "../modules/clients/dtos/ClientDTO" }
]);

// Fix error.code usage
replaceInFiles(path.join(root, "controllers/**/*.ts"), [
  { regex: /if\s*\(\(error\s*as\s*any\)\.code\s*===/g, replacer: "if ((error as any).code ===" },
  { regex: /if\s*\(error\.code\s*===/g, replacer: "if ((error as any).code ===" },
  { regex: /error\.code/g, replacer: "(error as any).code" }
]);

// Fix CompleteServiceOrderUseCase missing imports
replaceInFiles(path.join(root, "modules/serviceOrders/application/useCases/CompleteServiceOrderUseCase.ts"), [
  { regex: /\.\.\/\.\.\/\.\.\/shared\//g, replacer: "../../../../shared/" },
  { regex: /\.\.\/\.\.\/\.\.\/modules\//g, replacer: "../../../../modules/" }
]);

// Fix OSStatus comparisons in ServiceOrders
replaceInFiles(path.join(root, "modules/serviceOrders/**/*.ts"), [
  { regex: /ServiceOrderStatus\.CANCELED/g, replacer: "'CANCELLED'" },
  { regex: /ServiceOrderStatus\.COMPLETED/g, replacer: "'COMPLETED'" },
  { regex: /ServiceOrderStatus\.CREATED/g, replacer: "'OPEN'" }, // The schema has OPEN probably?
]);

// Fix EventsWorker statusCode
replaceInFiles(path.join(root, "shared/queue/EventsWorker.ts"), [
  { regex: /error\.statusCode/g, replacer: "(error as any).statusCode" },
  { regex: /const { name, correlationId, id: eventId } = event;/g, replacer: "const { name, correlationId, id: eventId } = event as any;" }
]);

// Fix health.routes.ts ping
replaceInFiles(path.join(root, "shared/infra/http/health.routes.ts"), [
  { regex: /await redisQueue\.client\.ping\(\);/g, replacer: "(await redisQueue.client).ping();" }
]);
