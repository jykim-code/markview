import { cpSync, writeFileSync, copyFileSync } from "fs";

// 1. Copy worker.js as _worker.js for Pages
copyFileSync(".open-next/worker.js", ".open-next/_worker.js");

// 2. Copy static assets from assets/ to output root
cpSync(".open-next/assets", ".open-next", { recursive: true });

// 3. Create _routes.json to route static files directly via CDN
const routes = {
  version: 1,
  include: ["/v/*", "/api/*"],
  exclude: ["/_next/*", "/M.svg", "/markview_text_icon.svg", "/markview_icon.png", "/design-preview.html", "/BUILD_ID"],
};

writeFileSync(".open-next/_routes.json", JSON.stringify(routes, null, 2));

console.log("Pages preparation complete: _worker.js, assets, _routes.json");
