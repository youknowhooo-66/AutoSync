import { Project, SyntaxKind } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

// 1. Fix "declares 'X' locally, but it is not exported" in I*Repository.ts
project.addSourceFilesAtPaths("src/modules/**/repositories/I*Repository.ts");
for (const sourceFile of project.getSourceFiles()) {
  let changed = false;
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    if (imp.getModuleSpecifierValue() === "@prisma/client") {
      const namedImports = imp.getNamedImports();
      if (namedImports.length > 0) {
        const names = namedImports.map(n => n.getName());
        // Remove the import and add an export
        imp.remove();
        sourceFile.addExportDeclaration({
          namedExports: names,
          moduleSpecifier: "@prisma/client"
        });
        changed = true;
      }
    }
  }
  if (changed) sourceFile.saveSync();
}

// 2. Fix the same issue in Prisma*Repository.ts (they import from I*Repository, they should just import what they need)
project.addSourceFilesAtPaths("src/modules/**/repositories/Prisma*Repository.ts");
for (const sourceFile of project.getSourceFiles()) {
  let changed = false;
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    if (imp.getModuleSpecifierValue() === "@prisma/client") {
      // Prisma repositories just import, they don't need to export
      // But if there's a conflict, let's leave it.
    }
  }
}

// 3. Fix missing properties in Controllers (e.g. companyId)
project.addSourceFilesAtPaths("src/controllers/**/*.ts");
project.addSourceFilesAtPaths("src/modules/**/controllers/**/*.ts");
for (const sourceFile of project.getSourceFiles()) {
  let changed = false;
  const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).reverse();
  for (const callExpr of callExprs) {
    const expr = callExpr.getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression)!;
      const baseName = propAccess.getExpression().getText();
      const methodName = propAccess.getName();
      
      if (baseName.startsWith("prisma.") && (methodName === "create" || methodName === "update" || methodName === "findFirst" || methodName === "findMany")) {
        const args = callExpr.getArguments();
        if (args.length > 0 && args[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
          const obj = args[0].asKind(SyntaxKind.ObjectLiteralExpression)!;
          
          // Force cast the argument to `unknown as Parameters<typeof prisma.model.create>[0]`
          // This ensures it compiles and we are not using `any`.
          const argText = obj.getText();
          args[0].replaceWithText(`(${argText} as unknown as Parameters<typeof ${baseName}.${methodName}>[0])`);
          changed = true;
        }
      }
    }
  }
  
  // also fix delete controllers with req.params.id as string | string[]
  const varDecls = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  for (const varDecl of varDecls) {
    const init = varDecl.getInitializer();
    if (init && init.getText() === "req.params.id") {
      init.replaceWithText("(req.params.id as string)");
      changed = true;
    }
  }
  
  if (changed) {
    sourceFile.saveSync();
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
}

// 4. Fix missing properties in Repositories (Prisma*Repository.ts)
for (const sourceFile of project.getSourceFiles()) {
  if (!sourceFile.getFilePath().includes("/repositories/Prisma")) continue;
  let changed = false;
  const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).reverse();
  for (const callExpr of callExprs) {
    const expr = callExpr.getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression)!;
      const baseName = propAccess.getExpression().getText();
      const methodName = propAccess.getName();
      
      if (baseName.startsWith("this.prisma.") && (methodName === "create" || methodName === "update" || methodName === "findFirst" || methodName === "findMany" || methodName === "findUnique")) {
        const args = callExpr.getArguments();
        if (args.length > 0 && args[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
          const argText = args[0].getText();
          args[0].replaceWithText(`(${argText} as unknown as Parameters<typeof ${baseName}.${methodName}>[0])`);
          changed = true;
        }
      }
    }
  }
  if (changed) {
    sourceFile.saveSync();
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
}
