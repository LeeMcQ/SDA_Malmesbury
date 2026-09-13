import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { pagesRootDirs, pagesRootFiles } from "./pages-root.mjs";

const sources = [".vercel/output/static", "dist", ".output/public"];
const source = sources.find((dir) => existsSync(join(process.cwd(), dir)));

if (!source) {
  console.error("[pages] No static build output found.");
  process.exit(1);
}

const srcDir = join(process.cwd(), source);
const out = join(process.cwd(), "docs");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(srcDir, out, { recursive: true });

const shell = ["index.html", "_shell.html", "404.html"]
  .map((name) => join(srcDir, name))
  .find((path) => existsSync(path));

if (!shell) {
  console.error("[pages] No HTML shell in", source);
  process.exit(1);
}

const html = readFileSync(shell).toString("utf8").replaceAll("\u0000", "");
writeFileSync(join(out, "index.html"), html);
writeFileSync(join(out, "404.html"), html);
writeFileSync(join(out, ".nojekyll"), "");

// GitHub Pages for this repo is served from branch `main` path `/`.
// Mirror the static site at the repo root so https://leemcq.github.io/SDA_Malmesbury/
// is the hymnal (index.html wins over README).
const root = process.cwd();

for (const name of pagesRootFiles) {
  const from = join(out, name);
  if (existsSync(from)) cpSync(from, join(root, name));
}
for (const name of pagesRootDirs) {
  const from = join(out, name);
  const to = join(root, name);
  rmSync(to, { recursive: true, force: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

console.log(
  `[pages] copied ${source} -> docs/ and repo root from ${shell.split("/").at(-1)}`,
);
