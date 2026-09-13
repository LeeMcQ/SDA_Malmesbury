import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

/** Static copies published at the git repo root for GitHub Pages (`main` `/`). */
export const pagesRootFiles = [
  "index.html",
  "404.html",
  "_shell.html",
  ".nojekyll",
  "favicon.svg",
  "icon-192.png",
  "icon-512.png",
  "og.jpg",
];

export const pagesRootDirs = ["assets", "images", "__grok"];

export function clearPagesRoot(root = process.cwd()) {
  for (const name of pagesRootFiles) {
    const path = join(root, name);
    if (existsSync(path)) rmSync(path, { force: true });
  }
  for (const name of pagesRootDirs) {
    rmSync(join(root, name), { recursive: true, force: true });
  }
}
