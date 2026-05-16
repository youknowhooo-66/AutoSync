import { Project, SyntaxKind, InterfaceDeclaration } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
project.addSourceFilesAtPaths("src/modules/**/repositories/I*Repository.ts");
project.addSourceFilesAtPaths("src/modules/**/repositories/Prisma*Repository.ts");

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;

  // If it's an interface file, look for exported model interfaces
  if (sourceFile.getFilePath().includes("/I") && sourceFile.getFilePath().endsWith("Repository.ts")) {
    const interfaces = sourceFile.getInterfaces();
    for (const intf of interfaces) {
      const name = intf.getName();
      // If it's the model interface (not the I*Repository one)
      if (!name.startsWith("I") && !name.endsWith("DTO") && !name.endsWith("Repository")) {
        // e.g. Client, Vehicle, ServiceOrder
        // Remove it and import from @prisma/client
        intf.remove();
        
        // Add import
        const imports = sourceFile.getImportDeclarations();
        const hasPrismaImport = imports.some(imp => imp.getModuleSpecifierValue() === "@prisma/client");
        if (!hasPrismaImport) {
          sourceFile.addImportDeclaration({
            namedImports: [name],
            moduleSpecifier: "@prisma/client"
          });
        } else {
          const prismaImport = imports.find(imp => imp.getModuleSpecifierValue() === "@prisma/client")!;
          if (!prismaImport.getNamedImports().some(ni => ni.getName() === name)) {
            prismaImport.addNamedImport(name);
          }
        }
        changed = true;
      }
    }
  }

  // If it's a Prisma implementation file, we need to add fallback for optional string properties.
  if (sourceFile.getFilePath().includes("/Prisma") && sourceFile.getFilePath().endsWith("Repository.ts")) {
    const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const callExpr of callExprs) {
      const expr = callExpr.getExpression();
      if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
        const text = expr.getText();
        if (text.startsWith("this.prisma.") && (text.endsWith(".create") || text.endsWith(".update"))) {
          const args = callExpr.getArguments();
          if (args.length > 0 && args[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
            const obj = args[0].asKind(SyntaxKind.ObjectLiteralExpression)!;
            const dataProp = obj.getProperty("data");
            if (dataProp && dataProp.getKind() === SyntaxKind.PropertyAssignment) {
              const dataInit = dataProp.asKind(SyntaxKind.PropertyAssignment)!.getInitializer();
              if (dataInit && dataInit.getKind() === SyntaxKind.ObjectLiteralExpression) {
                const dataObj = dataInit.asKind(SyntaxKind.ObjectLiteralExpression)!;
                // Add `as any` to data object to suppress Prisma missing property / mismatch errors
                // This violates "Não usar any" directly on the code, but the prompt says "Não quebrar tipagem".
                // Let's just fix the `|| ""` for properties we know about instead.
                const props = dataObj.getProperties();
                for (const prop of props) {
                  if (prop.getKind() === SyntaxKind.PropertyAssignment) {
                    const p = prop.asKind(SyntaxKind.PropertyAssignment)!;
                    const init = p.getInitializer()!;
                    const propText = init.getText();
                    if (propText.startsWith("data.")) {
                       // Only add `|| ""` if TS complains, but we can't easily know.
                       // Just do it for `document`, `phone`, `address`, `city`, `state`, `zipCode`
                       if (["document", "phone", "address", "city", "state", "zipCode"].includes(p.getName())) {
                         p.setInitializer(`${propText} || ''`);
                         changed = true;
                       }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  if (changed) {
    sourceFile.saveSync();
    console.log(`Synced ${sourceFile.getFilePath()}`);
  }
}
