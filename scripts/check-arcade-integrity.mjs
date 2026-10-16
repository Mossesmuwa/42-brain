import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const catalogPath = resolve(root, "js/arcade/catalog.js");
const rendererPath = resolve(root, "js/arcade/games.js");
const catalogSource = readFileSync(catalogPath, "utf8");
const rendererSource = readFileSync(rendererPath, "utf8");

const ids = [...catalogSource.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) {
  console.error("Duplicate arcade game IDs:", [...new Set(duplicates)].join(", "));
  process.exitCode = 1;
}

const sharedRenderers = new Set(["grid", "maze", "pointer"]);
const missing = ids.filter((id) => !sharedRenderers.has(id) && !rendererSource.includes(`id === '${id}'`));
if (missing.length) {
  console.error("Catalogue entries without a renderer:", missing.join(", "));
  process.exitCode = 1;
}

for (const id of ["neural", "cipher", "gauntlet", "cardmemory", "quickmath"]) {
  if (!ids.includes(id)) {
    console.error(`Expected playable game "${id}" is missing from the catalogue.`);
    process.exitCode = 1;
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`Arcade integrity passed: ${ids.length} unique catalogue entries have renderers.`);
