#!/usr/bin/env node
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsx = resolve(__dirname, "../node_modules/.bin/tsx");
const entry = resolve(__dirname, "../src/stdio.ts");

spawnSync(tsx, [entry], { stdio: "inherit", env: process.env });
