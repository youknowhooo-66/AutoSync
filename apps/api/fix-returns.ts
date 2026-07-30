import fs from "fs";
import path from "path";
import { globSync } from "glob";

const root = path.join(__dirname, "src");

const files = globSync(path.join(root, "**/*.ts"));

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  
  if (content.includes('logger.error({ err: error }, "An unknown error occurred");')) {
    // If it's a controller returning response, we need to return
    if (content.includes("response.status") || content.includes("res.status")) {
      const resObj = content.includes("res.status") ? "res" : "response";
      const replacement = `logger.error({ err: error }, "An unknown error occurred");\n      return ${resObj}.status(500).json({ message: 'An unknown error occurred' });`;
      
      content = content.replace(/logger\.error\(\{\s*err:\s*error\s*\},\s*"An unknown error occurred"\);\n?(?!\s*return)/g, replacement);
      fs.writeFileSync(file, content);
      console.log(`Fixed return in ${file}`);
    }
  }
}
