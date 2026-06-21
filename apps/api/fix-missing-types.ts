import { Project, SyntaxKind } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;
  const text = sourceFile.getFullText();

  // 1. If uses PrismaClient but not imported
  if (text.includes("PrismaClient")) {
    const imports = sourceFile.getImportDeclarations();
    const hasPrismaImport = imports.some(imp => imp.getNamedImports().some(ni => ni.getName() === "PrismaClient"));
    if (!hasPrismaImport) {
      // Find or create @prisma/client import
      let prismaImp = imports.find(imp => imp.getModuleSpecifierValue() === "@prisma/client");
      if (prismaImp) {
        prismaImp.addNamedImport("PrismaClient");
      } else {
        sourceFile.addImportDeclaration({
          namedImports: ["PrismaClient"],
          moduleSpecifier: "@prisma/client"
        });
      }
      changed = true;
    }
  }

  // 2. Fix I*Repository.ts missing local types
  if (sourceFile.getFilePath().includes("/repositories/I") && sourceFile.getFilePath().endsWith("Repository.ts")) {
    const exports = sourceFile.getExportDeclarations();
    for (const exp of exports) {
      if (exp.getModuleSpecifierValue() === "@prisma/client") {
        const names = exp.getNamedExports().map(n => n.getName());
        // Remove export { Model } from '@prisma/client'
        exp.remove();
        
        // Add import { Model } from '@prisma/client'
        let prismaImp = sourceFile.getImportDeclaration(imp => imp.getModuleSpecifierValue() === "@prisma/client");
        if (!prismaImp) {
          prismaImp = sourceFile.addImportDeclaration({
            namedImports: names,
            moduleSpecifier: "@prisma/client"
          });
        } else {
          for (const name of names) {
            if (!prismaImp.getNamedImports().some(ni => ni.getName() === name)) {
              prismaImp.addNamedImport(name);
            }
          }
        }
        
        // Add export type { Model }
        sourceFile.addExportDeclaration({
          namedExports: names,
          isTypeOnly: true
        });
        changed = true;
      }
    }
  }

  if (changed) {
    sourceFile.saveSync();
    console.log(`Restored ${sourceFile.getFilePath()}`);
  }
}
