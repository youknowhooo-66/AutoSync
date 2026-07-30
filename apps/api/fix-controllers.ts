import { Project, SyntaxKind, ObjectLiteralExpression } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
project.addSourceFilesAtPaths("src/controllers/**/*.ts");

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;
  
  const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const callExpr of callExprs) {
    const expr = callExpr.getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression)!;
      const methodName = propAccess.getName();
      const baseName = propAccess.getExpression().getText();
      
      // Look for prisma.model.create or prisma.model.update
      if (baseName.startsWith("prisma.") && (methodName === "create" || methodName === "update" || methodName === "findMany")) {
        const args = callExpr.getArguments();
        if (args.length > 0 && args[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
          const obj = args[0].asKind(SyntaxKind.ObjectLiteralExpression)!;
          const dataProp = obj.getProperty("data");
          if (dataProp && dataProp.getKind() === SyntaxKind.PropertyAssignment) {
            const dataInit = dataProp.asKind(SyntaxKind.PropertyAssignment)!.getInitializer();
            if (dataInit && dataInit.getKind() === SyntaxKind.ObjectLiteralExpression) {
              const dataObj = dataInit.asKind(SyntaxKind.ObjectLiteralExpression)!;
              
              // Depending on the model, we add companyId
              const model = baseName.split(".")[1];
              const modelsWithCompany = ["branch", "client", "financialRecord", "stock", "part", "serviceOrder", "supplier", "user", "vehicle"];
              const modelsWithBranch = ["financialRecord", "stock", "serviceOrder", "user"]; // Check prisma schema for exact fields
              
              if (modelsWithCompany.includes(model) && methodName === "create") {
                if (!dataObj.getProperty("companyId")) {
                  dataObj.addPropertyAssignment({ name: "companyId", initializer: "req.companyId || req.user?.companyId || ''" });
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
  }

  // Also fix `AuthRequest` in controllers. 
  // Wait, I already removed AuthRequest and replaced with Request in middleware, but controllers still import AuthRequest.
  // We can just redefine AuthRequest to Request. Wait, controllers use `AuthRequest`. Let's just make sure it's valid.
  
  if (changed) {
    sourceFile.saveSync();
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
}
