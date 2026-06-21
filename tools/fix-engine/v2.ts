import { Project, SyntaxKind } from "ts-morph";
import fg from "fast-glob";
import path from "path";
import fs from "fs-extra";

const ROOT = process.cwd();

const project = new Project({
  tsConfigFilePath: path.join(ROOT, "apps/api/tsconfig.json"),
  skipAddingFilesFromTsConfig: false,
});

console.log("🚀 Fix Engine V2 starting...");

// -----------------------------
// 1. FIX LOGGER SIGNATURES
// -----------------------------
function fixLoggerCalls() {
  const files = project.getSourceFiles();

  for (const file of files) {
    const calls = file.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of calls) {
      const expr = call.getExpression().getText();

      if (!expr.includes("logger")) continue;

      const args = call.getArguments();
      if (args.length < 2) continue;

      const secondArg = args[1];

      // logger.error("msg", { meta }) -> FIX
      if (secondArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
        const text = call.getText();

        const newText = text.replace(
          /logger\.(error|warn|info)\((.*?),\s*({.*})\)/s,
          `logger.$1($3, $2)`
        );

        call.replaceWithText(newText);
      }
    }
  }
}

// -----------------------------
// 2. FIX ERROR UNKNOWN TYPES
// -----------------------------
function fixUnknownErrors() {
  const files = project.getSourceFiles();

  files.forEach(file => {
    file.getDescendantsOfKind(SyntaxKind.CatchClause).forEach(catchClause => {
      const varName = catchClause.getVariableDeclaration()?.getName();
      if (!varName) return;

      const body = catchClause.getBlock();

      body.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
        .forEach(prop => {
          const text = prop.getText();
          if (text.startsWith(varName + ".message")) {
            prop.replaceWithText(`(error instanceof Error ? error.message : String(error))`);
          }
          if (text.startsWith(varName + ".stack")) {
            prop.replaceWithText(`(error instanceof Error ? error.stack : undefined)`);
          }
        });
    });
  });
}

// -----------------------------
// 3. FIX ROOTDIR PROBLEMS
// -----------------------------
function fixTsConfig() {
  const tsconfigPath = path.join(ROOT, "apps/api/tsconfig.json");

  const tsconfig = fs.readJSONSync(tsconfigPath);

  tsconfig.compilerOptions = tsconfig.compilerOptions || {};

  tsconfig.compilerOptions.rootDir = "./src";

  tsconfig.include = ["src/**/*", "prisma/**/*"];

  fs.writeJSONSync(tsconfigPath, tsconfig, { spaces: 2 });

  console.log("✔ tsconfig fixed");
}

// -----------------------------
// 4. ENSURE BUILD SCRIPT EXISTS
// -----------------------------
function fixPackageJson() {
  const pkgPath = path.join(ROOT, "apps/api/package.json");

  const pkg = fs.readJSONSync(pkgPath);

  pkg.scripts = pkg.scripts || {};

  if (!pkg.scripts.build) {
    pkg.scripts.build = "tsc";
  }

  fs.writeJSONSync(pkgPath, pkg, { spaces: 2 });

  console.log("✔ package.json fixed");
}

// -----------------------------
// RUN ALL FIXES
// -----------------------------
async function run() {
  fixTsConfig();
  fixPackageJson();
  fixLoggerCalls();
  fixUnknownErrors();

  await project.save();

  console.log("✅ Fix Engine V2 completed");
}

run().catch(err => {
  console.error("❌ Fix Engine crashed:", err);
});