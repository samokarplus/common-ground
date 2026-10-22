// Remove only previous build artifacts from docs/, so project documentation
// (docs/*.md) survives each build. Vite's emptyOutDir is disabled for this reason.
import { rm } from "node:fs/promises";
const targets = ["docs/assets", "docs/index.html", "docs/favicon.svg", "docs/.nojekyll", "docs/404.html"];
for (const t of targets) await rm(t, { recursive: true, force: true });
console.log("Cleaned build artifacts:", targets.join(", "));
