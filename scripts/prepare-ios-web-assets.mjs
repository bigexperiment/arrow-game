import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const targetDir = path.join(root, "ios-template", "WebAssets");

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) copyDir(sourcePath, targetPath);
    else fs.copyFileSync(sourcePath, targetPath);
  }
}

if (!fs.existsSync(distDir)) {
  throw new Error("dist/ not found. Run `npm run build` first.");
}

fs.rmSync(targetDir, { recursive: true, force: true });
copyDir(distDir, targetDir);

const indexPath = path.join(targetDir, "index.html");
let html = fs.readFileSync(indexPath, "utf8");
html = html
  .replace(/href="\/([^"]+)"/g, 'href="./$1"')
  .replace(/src="\/([^"]+)"/g, 'src="./$1"');
fs.writeFileSync(indexPath, html);

console.log(`Prepared iOS web assets in ${path.relative(root, targetDir)}`);
