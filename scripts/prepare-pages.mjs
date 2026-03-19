import { cpSync, writeFileSync, copyFileSync } from "fs";

// 1. Copy worker.js as _worker.js for Pages
copyFileSync(".open-next/worker.js", ".open-next/_worker.js");

// 2. Copy static assets from assets/ to output root
cpSync(".open-next/assets", ".open-next", { recursive: true });

// 3. Create _routes.json — all requests go to Worker except static assets
const routes = {
  version: 1,
  include: ["/*"],
  exclude: ["/_next/static/*", "/M.svg", "/markview_text_icon.svg", "/markview_icon.png", "/ads.txt"],
};

writeFileSync(".open-next/_routes.json", JSON.stringify(routes, null, 2));

console.log("Pages preparation complete: _worker.js, assets, _routes.json");
