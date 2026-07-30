import { Project, SyntaxKind } from "ts-morph";
import fg from "fast-glob";
import path from "path";

const ROOT = process.cwd();

const project = new Project({
  tsConfigFilePath: path.join(ROOT, "apps/api/tsconfig.json"),
});

const files = fg.sync([path.join(ROOT, "apps/api/src/**/*.ts")], {
  ignore: ["**/node_modules/**", "**/dist/**"],
});

files.forEach(file => project.addSourceFileAtPath(file));

/**
 * FIX LOGGER CALLS (SAFE AST VERSION)
 */
function fixLogger() {
  project.getSourceFiles().forEach(file => {
    file.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
      const expr = call.getExpression().getText();

      if (!expr.includes("logger.")) return;

      const args = call.getArguments();
      if (args.length < 2) return;

      const [first, second] = args;

      const firstText = first.getText();
      const secondText = second.getText();

      // logger.info("msg", meta)
      if (first.getKind() === SyntaxKind.StringLiteral) {
        call.replaceWithText(
          `${expr}({ meta: ${secondText} }, ${firstText})`
        );
      }
    });
  });
}

/**
 * FIX CATCH (UNKNOWN SAFETY)
 */
function fixCatch() {
  project.getSourceFiles().forEach(file => {
    file.getDescendantsOfKind(SyntaxKind.CatchClause).forEach(catchClause => {
      const varDecl = catchClause.getVariableDeclaration();
      if (!varDecl) return;

      varDecl.setType("unknown");
    });
  });
}

/**
 * FIX ERROR USAGE (SAFE REPLACE VIA SOURCE TEXT)
 */
function fixErrorUsage() {
  project.getSourceFiles().forEach(file => {
    let text = file.getFullText();

    text = text.replace(
      /error\.message/g,
      "(error instanceof Error ? error.message : String(error))"
    );

    text = text.replace(
      /error\.stack/g,
      "(error instanceof Error ? error.stack : undefined)"
    );

    file.replaceWithText(text);
  });
}

/**
 * RUN
 */
function run() {
  console.log("🔧 Running FIX ENGINE V1 (corrected)");

  fixLogger();
  fixCatch();
  fixErrorUsage();

  project.saveSync();

  console.log("✅ V1 completed successfully");
}

run();