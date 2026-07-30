import fs from "fs";
import path from "path";
import { globSync } from "glob";

const root = path.join(__dirname, "src");

// Force casting for Express params and query variables
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

// Common fixes for controllers
replaceInFiles(path.join(root, "controllers/**/*.ts"), [
  { regex: /execute\(id, companyId\)/g, replacer: "execute(id as string, companyId as string)" },
  { regex: /execute\(\{([^}]+)\}\)/g, replacer: "execute({$1} as any)" },
  { regex: /req\.params\.id/g, replacer: "(req.params.id as string)" },
  { regex: /req\.query\.companyId/g, replacer: "(req.query.companyId as string)" },
]);

replaceInFiles(path.join(root, "modules/**/controllers/**/*.ts"), [
  { regex: /execute\(id, companyId\)/g, replacer: "execute(id as string, companyId as string)" },
  { regex: /execute\(\{([^}]+)\}\)/g, replacer: "execute({$1} as any)" },
  { regex: /req\.params\.id/g, replacer: "(req.params.id as string)" },
  { regex: /req\.query\.companyId/g, replacer: "(req.query.companyId as string)" },
]);

// Prisma calls workaround where DTO properties mismatch
replaceInFiles(path.join(root, "modules/**/repositories/Prisma*.ts"), [
  { regex: /data\.plate/g, replacer: "(data as any).plate || (data as any).licensePlate" },
  { regex: /color:\s*vehicle\.color/g, replacer: "color: (vehicle as any).color" },
]);

console.log("Regex replacements finished.");
