#!/usr/bin/env node
/**
 * Keep every playground link in plans/<slug>/README.md equal to its source.
 *
 *   node scripts/links.mjs           # rewrite stale `#z=` links in place
 *   node scripts/links.mjs --check   # exit 1 and list any stale link (no writes)
 *
 * A link is fresh when it decodes to the exact bytes of the file it stands for. The Nth
 * link in a plan README stands for the Nth file of [plan.arch, plan-strict.arch] that
 * exists (only tweet-house has the second). Links are minted with scripts/permalink.mjs.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { encodeSrc, srcFromHash } from "./permalink.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLANS = join(ROOT, "plans");
const LINK = /https:\/\/playground\.archlang\.uk\/(#z=[A-Za-z0-9_-]+)/g;
const check = process.argv.includes("--check");

let stale = 0;
let total = 0;
for (const d of readdirSync(PLANS, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const dir = join(PLANS, d.name);
  const readmePath = join(dir, "README.md");
  if (!existsSync(readmePath)) continue;
  const sources = ["plan.arch", "plan-strict.arch"].filter((f) => existsSync(join(dir, f)));
  const md = readFileSync(readmePath, "utf8");
  let n = 0;
  const next = md.replace(LINK, (whole, hash) => {
    const file = sources[n++];
    total++;
    if (!file) {
      console.error(`${d.name}: link #${n} has no source file`);
      stale++;
      return whole;
    }
    const src = readFileSync(join(dir, file), "utf8");
    if (srcFromHash(hash) === src) return whole;
    stale++;
    console.error(`${check ? "stale" : "refreshed"}: ${d.name} link #${n} (${file})`);
    return `https://playground.archlang.uk/${encodeSrc(src)}`;
  });
  if (!check && next !== md) writeFileSync(readmePath, next);
}
console.log(`links: ${total} checked, ${stale} ${check ? "stale" : "refreshed"}`);
if (check && stale) process.exit(1);
