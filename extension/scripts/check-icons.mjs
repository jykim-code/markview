// Verifies the PNG icons the manifest references actually exist, at the right
// size. Chrome Web Store rejects a package without a 128x128 icon, and a missing
// file only surfaces as a load error in the browser — too late if it is found
// during submission.
//
//   node scripts/check-icons.mjs          warn only (used by `npm run build`)
//   node scripts/check-icons.mjs --strict exit 1 on any problem (pre-submission)

import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));

/** Width/height from a PNG's IHDR chunk, or null if not a PNG. */
function pngSize(file) {
  const b = readFileSync(file);
  const isPng = b.length > 24 && b.toString("binary", 1, 4) === "PNG";
  if (!isPng) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// Collect every declared size → path pair (icons + action.default_icon).
const declared = new Map();
for (const source of [manifest.icons, manifest.action?.default_icon]) {
  for (const [size, path] of Object.entries(source ?? {})) {
    declared.set(`${size}:${path}`, { size: Number(size), path });
  }
}

const problems = [];
if (declared.size === 0) {
  problems.push('manifest.json declares no icons — Chrome Web Store requires a 128x128 icon.');
}

for (const { size, path } of declared.values()) {
  const file = join(root, "public", path);
  if (!existsSync(file)) {
    problems.push(`missing: public/${path} (declared as ${size}x${size})`);
    continue;
  }
  const dim = pngSize(file);
  if (!dim) {
    problems.push(`not a PNG: public/${path} — Chrome does not accept SVG for manifest icons.`);
  } else if (dim.w !== size || dim.h !== size) {
    problems.push(`wrong size: public/${path} is ${dim.w}x${dim.h}, expected ${size}x${size}.`);
  }
}

if (problems.length === 0) {
  console.log(`✓ icons OK (${declared.size} declared)`);
  process.exit(0);
}

const label = strict ? "ERROR" : "WARNING";
console.error(`\n${label}: extension icons are not submission-ready:`);
for (const p of problems) console.error(`  - ${p}`);
console.error(
  "\nPlace square PNGs at extension/public/icons/icon{16,32,48,128}.png.\n" +
    "public/M.svg (200x200) is the intended artwork.\n"
);
process.exit(strict ? 1 : 0);
