#!/usr/bin/env node
/**
 * Render showcase plans to SVG + PNG.
 *
 *   node scripts/render.mjs           # every plans/<slug>/plan.arch
 *   node scripts/render.mjs <slug>    # just that one
 *
 * Output lands next to the source: `plans/<slug>/plan.svg` and `plan.png`.
 *
 * Multi-storey plans (`level <n> { … }`) compile to one drawing PER STOREY.
 * `compile()` returns those in `pages[]`, ascending by level, and its top-level
 * `svg`/`scene` describe `pages[0]`. We mirror the compiler CLI's own naming —
 * `plan.L<n>.svg` / `plan.L<n>.png` per storey — and additionally write the
 * lowest storey as the plain `plan.svg`/`plan.png` so every showcase entry has
 * one predictable hero image regardless of how many floors it has.
 *
 * Errors are DATA in ArchLang, not exceptions: a plan with a fatal problem comes
 * back with `svg: ""` and a populated `diagnostics[]`. We print those with their
 * code and line:col and exit 1.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

import { compile, diagnosticToJson } from "@chanmeng666/archlang";

import { svgToPng } from "./raster.mjs";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const PLANS = join(ROOT, "plans");

/**
 * The `World` seam — the compiler's one window onto the filesystem, used to
 * resolve `import "./lib/…"` statements. `compile()` is otherwise pure, so an
 * import-free plan is byte-identical with or without this.
 */
function nodeWorld(baseDir) {
  return {
    read(path) {
      try {
        return readFileSync(resolvePath(baseDir, path), "utf8");
      } catch {
        return null;
      }
    },
  };
}

/** Every slug under plans/ that has a plan.arch. */
function allSlugs() {
  if (!existsSync(PLANS)) return [];
  return readdirSync(PLANS)
    .filter((name) => {
      const dir = join(PLANS, name);
      return statSync(dir).isDirectory() && existsSync(join(dir, "plan.arch"));
    })
    .sort();
}

function reportDiagnostics(source, diagnostics, slug) {
  for (const d of diagnostics) {
    const j = diagnosticToJson(source, d);
    const code = j.code ? ` ${j.code}` : "";
    console.error(`  ${j.severity}${code} ${slug}/plan.arch:${j.line}:${j.col} — ${j.message}`);
    if (j.fix?.title) console.error(`    fix: ${j.fix.title}`);
  }
}

async function writePair(dir, stem, svg) {
  const svgPath = join(dir, `${stem}.svg`);
  const pngPath = join(dir, `${stem}.png`);
  writeFileSync(svgPath, svg, "utf8");
  writeFileSync(pngPath, await svgToPng(svg));
  return [svgPath, pngPath];
}

async function renderSlug(slug) {
  const dir = join(PLANS, slug);
  const src = join(dir, "plan.arch");
  if (!existsSync(src)) {
    console.error(`No such plan: ${src}`);
    return false;
  }

  const source = readFileSync(src, "utf8");
  const result = compile(source, { world: nodeWorld(dir) });

  if (result.errors.length > 0) {
    console.error(`FAILED ${slug} — ${result.errors.length} error(s):`);
    reportDiagnostics(
      source,
      result.diagnostics.filter((d) => d.severity === "error"),
      slug,
    );
    return false;
  }

  const written = [];
  if (result.pages && result.pages.length > 0) {
    for (const page of result.pages) {
      written.push(...(await writePair(dir, `plan.L${page.level}`, page.svg)));
    }
    // The lowest storey doubles as the plan's hero image.
    written.push(...(await writePair(dir, "plan", result.pages[0].svg)));
  } else {
    written.push(...(await writePair(dir, "plan", result.svg)));
  }

  const warnings = result.warnings.length;
  console.log(`ok ${slug} — ${written.length} file(s)${warnings ? `, ${warnings} warning(s)` : ""}`);
  if (warnings) reportDiagnostics(source, result.diagnostics.filter((d) => d.severity === "warning"), slug);
  return true;
}

const requested = process.argv.slice(2);
const slugs = requested.length > 0 ? requested : allSlugs();

if (slugs.length === 0) {
  console.error("No plans found under plans/. Add plans/<slug>/plan.arch first.");
  process.exit(1);
}

let failed = 0;
for (const slug of slugs) {
  if (!(await renderSlug(slug))) failed++;
}
if (failed > 0) process.exit(1);
