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

const pagesBase = "/SDA_Malmesbury/";
const manifest = {
  name: "Malmesbury Praise",
  short_name: "Praise",
  description:
    "Praise & Worship songbook for Malmesbury Seventh-day Adventist Church Women's Ministries.",
  id: pagesBase,
  start_url: pagesBase,
  scope: pagesBase,
  display: "standalone",
  display_override: ["standalone", "minimal-ui"],
  background_color: "#F4EFE4",
  theme_color: "#1E4A6E",
  lang: "en",
  dir: "ltr",
  orientation: "any",
  icons: [
    {
      src: `${pagesBase}icon-192.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: `${pagesBase}icon-512.png`,
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: `${pagesBase}__grok/icon-180.png`,
      sizes: "180x180",
      type: "image/png",
    },
  ],
};
const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
mkdirSync(join(out, "__grok"), { recursive: true });
writeFileSync(join(out, "__grok/manifest.webmanifest"), manifestJson);
writeFileSync(join(out, "__grok/manifest.json"), manifestJson);

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
