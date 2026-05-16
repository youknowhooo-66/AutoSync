import { Project, SyntaxKind } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

project.addSourceFilesAtPaths("src/**/*.ts");

const sourceFiles = project.getSourceFiles();

for (const sourceFile of sourceFiles) {
  let changed = false;

  // 1. Refactor logger calls
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const callExpr of callExpressions) {
    const expr = callExpr.getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression)!;
      const expressionText = propAccess.getExpression().getText();
      const methodName = propAccess.getName();

      if (expressionText === "logger" && ["info", "warn", "error", "debug"].includes(methodName)) {
        const args = callExpr.getArguments();
        
        if (args.length === 2) {
          const arg0 = args[0];
          const arg1 = args[1];
          
          const isArg0StringLike = arg0.getKind() === SyntaxKind.StringLiteral || arg0.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral || arg0.getKind() === SyntaxKind.TemplateExpression;
          
          if (isArg0StringLike) {
            let metaText = arg1.getText();
            if (arg1.getKind() === SyntaxKind.ObjectLiteralExpression) {
              const obj = arg1.asKind(SyntaxKind.ObjectLiteralExpression)!;
              const props = obj.getProperties();
              let newProps = props.map(p => {
                if (p.getKind() === SyntaxKind.PropertyAssignment) {
                  const pAssign = p.asKind(SyntaxKind.PropertyAssignment)!;
                  if (pAssign.getName() === "error") {
                    return `err: ${pAssign.getInitializer()?.getText()}`;
                  }
                  return p.getText();
                } else if (p.getKind() === SyntaxKind.ShorthandPropertyAssignment) {
                  const pShort = p.asKind(SyntaxKind.ShorthandPropertyAssignment)!;
                  if (pShort.getName() === "error") {
                    return `err: error`;
                  }
                  return p.getText();
                }
                return p.getText();
              });
              metaText = `{ ${newProps.join(", ")} }`;
            }
            
            callExpr.replaceWithText(`logger.${methodName}(${metaText}, ${arg0.getText()})`);
            changed = true;
          }
        }
      }
    }
  }

  if (changed) {
    sourceFile.saveSync();
  }
}

// 2. Refactor Catch clauses in a second pass
const project2 = new Project({
  tsConfigFilePath: "tsconfig.json",
});
project2.addSourceFilesAtPaths("src/**/*.ts");

for (const sourceFile of project2.getSourceFiles()) {
  let changed = false;

  const catchClauses = sourceFile.getDescendantsOfKind(SyntaxKind.CatchClause);
  for (const catchClause of catchClauses) {
    const varDecl = catchClause.getVariableDeclaration();
    if (!varDecl) continue;
    
    const varName = varDecl.getName();
    const block = catchClause.getBlock();
    const statements = block.getStatements();
    
    if (statements.length > 0) {
      const firstStmt = statements[0];
      if (firstStmt.getKind() === SyntaxKind.IfStatement) {
        const expr = firstStmt.asKind(SyntaxKind.IfStatement)?.getExpression();
        if (expr?.getText() === `${varName} instanceof Error`) {
          continue; // Already wrapped
        }
      }
    }
    
    const innerText = statements.map(s => s.getText()).join('\n    ');
    
    // Check if error is used as an unknown that needs casting/typeguarding
    // If there is `logger.error({ err: error }` or similar, it's safer to wrap.
    if (innerText.includes(varName)) {
      block.replaceWithText(`{
  if (${varName} instanceof Error) {
    ${innerText}
  } else {
    logger.error({ err: ${varName} }, "An unknown error occurred");
  }
}`);
      changed = true;
    }
  }

  if (changed) {
    sourceFile.saveSync();
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
}
